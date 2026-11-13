# TimescaleDB for tcn_nas: install, copy, switch over

This folder moves the readings from `tcn_nas` (PostgreSQL 14.4) into a new database `tcn_nas_ts` on
**PostgreSQL 17 + TimescaleDB**, on the same Windows server, without stopping the live system for
more than the few minutes of the switch-over. **No backend or frontend code changes**: same table
names and columns. The backend is pointed at the new database by `.env` only, as in
`../DB_MAINTENANCE.md`.

## Why

| | tcn_nas today | tcn_nas_ts |
|---|---|---|
| `lines_table` 682 M rows, 115 GB | 3 single-column indexes (27 GB). A search for one line over a day reads the whole station or the whole time range | 1-day chunks, one index `(station, line_name, time)`. Old chunks compressed and stored by station/line |
| `genco_units_table` 317 M rows, 50 GB | **no index but the primary key**: any search by time reads all 50 GB | 1-day chunks, index `(genco_name, unit_name, time)` |
| `bilateral_table` 135 M rows, 24 GB | time index only | 7-day chunks, index `(name, line_name, time)` |
| `frequency_table` 37 M rows | primary key only | 7-day chunks, time index |
| TEM report (`WHERE date = ...`) | reads all 115 GB | reads the chunk(s) of that day (chunk skipping) |
| Disk | ~190 GB plus indexes | typically a small fraction once compressed (check with the size query in step 6) |
| VACUUM / bloat | whole 115 GB table | per chunk; compressed chunks need none |
| PostgreSQL 14 | end of life November 2026 | 17, supported to 2029 |

The files:

| File | What it does |
|---|---|
| `01_tables.sql` | the 4 tables, same columns; primary key `(id, time)` |
| `02_timescale.sql` | hypertables, composite indexes, compression settings, chunk skipping on `date` |
| `03_link_old_db.sql` | lets the new database read `tcn_nas` (postgres_fdw) |
| `04_copy.sql` | resumable copy, final pass, checks, repair, copy-back for rollback |
| `05_after_copy.sql` | compression policy, compress the rest, sizes |
| `06_optional_minute_summary.sql` | optional 1-minute summary of `lines_table` |

**Tested** on PostgreSQL 17.11 and on 18.6, both with TimescaleDB 2.32.0 (Docker images; same results), with a source database built
from the production table definitions in `nas_schema.sql` and test data. All six files ran in the
order below. Covered:
- gaps in the ids, empty times, NaN values;
- rows arriving during the copy, including a late row into an already compressed chunk;
- a copy stopped half-way and resumed;
- compression during the copy;
- deliberate damage found by the checks and repaired;
- the app's own test suites against the new database with every chunk compressed (39 checks on
  the `_fix` analysis API; 34 on the old routes, including the TEM, collapse and frequency reports
  and their `GROUP BY` queries);
- an app insert into a compressed chunk;
- the TEM date search reading 2 of 12 chunks;
- the one-minute summary matching the raw average;
- rollback (copy-back), run twice without duplicates.

Why the primary key is `(id, time)` and not a plain index: the old reports run
`SELECT * FROM lines_table ... GROUP BY station, line_name, id, ..., time` without `hour`, `minute`,
`seconds`. PostgreSQL accepts that only when the GROUP BY contains the whole **primary key**. With
`(id, time)` they keep working; with a unique index they would fail.

---

## Step 1. Measure (old server, a few seconds each)

Open PowerShell in `C:\Program Files\PostgreSQL\14\bin` (rows per day, last 3 days, using indexes):

```bash
.\psql -h localhost -U postgres -d tcn_nas -c "SELECT date, count(*) FROM lines_table WHERE time > (extract(epoch from now())*1000)::bigint - 3*86400000 GROUP BY 1 ORDER BY 1"
```

```bash
.\psql -h localhost -U postgres -d tcn_nas -c "SELECT date, count(*) FROM genco_units_table WHERE id > (SELECT max(id) - 3000000 FROM genco_units_table) GROUP BY 1 ORDER BY 1"
```

The chunk sizes in `02_timescale.sql` (1 day for lines and genco, 7 days for bilateral and
frequency) suit anything from ~100 000 to a few million rows per day. Only if you see far more, tell
me the numbers before step 4.

Memory on the server (GB):

```bash
powershell -c "[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)"
```

Both servers run side by side until the old one is retired, and tcn_nas already has
`shared_buffers = 16GB`. **Keep the two shared_buffers together at or below ~40% of the RAM** (step 3).

## Step 2. Install PostgreSQL 17 next to 14

> **Already have PostgreSQL 18 on the server?** Use it and skip this step. TimescaleDB 2.32 has a
> Windows build for 18 (`timescaledb-postgresql-18-windows-amd64.zip`), and these files use nothing
> specific to 17. Everywhere below read 18 for 17: `C:\Program Files\PostgreSQL\18\bin`, service
> `postgresql-x64-18`, its own port instead of 5433, and the 18 `pg_config`, `pg_dump`, `psql`.
> Be on the latest 18.x minor. If that server also holds the v2 database `niso_nas`, nothing
> conflicts: TimescaleDB is enabled per database, and `tcn_nas_ts` is a separate database.

1. Download the PostgreSQL **17** Windows installer (EDB) from postgresql.org, latest 17.x.
2. Run it. Choose:
   - a data directory on the disk with the most free space;
   - **port 5433** (5432 is tcn_nas);
   - a password for its `postgres` user;
   - no need for Stack Builder.
3. The old service `postgresql-x64-14` is not touched. The new one is `postgresql-x64-17`.

## Step 3. Install TimescaleDB for PostgreSQL 17

1. Prerequisites: the Microsoft Visual C++ 2015-2022 Redistributable (x64) and OpenSSL 3.x for
   Windows.
2. From the TimescaleDB releases page on GitHub (`timescale/timescaledb`), take the latest 2.x
   **Windows zip for PostgreSQL 17**. Unzip it.
3. Run `setup.exe` **as Administrator**. When asked for `pg_config`, give
   `C:\Program Files\PostgreSQL\17\bin\pg_config.exe` (not the 14 one).
4. It offers to run `timescaledb-tune`: accept. Then open the 17 `postgresql.conf` (in the data
   directory chosen in step 2) and check or set:

   ```
   shared_preload_libraries = 'timescaledb'
   shared_buffers = 4GB                 # while tcn_nas (16GB) still runs; raise in step 9
   effective_cache_size = 8GB           # same reason
   max_locks_per_transaction = 256      # a query over many days touches many chunks
   timescaledb.max_background_workers = 8
   max_worker_processes = 16
   timescaledb.telemetry_level = off    # by default TimescaleDB reports usage data to Timescale
   ```

5. Restart it:

   ```bash
   powershell -c "Restart-Service postgresql-x64-17"
   ```

6. Check, from `C:\Program Files\PostgreSQL\17\bin`:

   ```bash
   .\psql -p 5433 -U postgres -c "CREATE DATABASE tcn_nas_ts"
   ```

   ```bash
   .\psql -p 5433 -U postgres -d tcn_nas_ts -c "CREATE EXTENSION IF NOT EXISTS timescaledb" -c "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'" -c "SHOW timescaledb.license"
   ```

   The licence must say `timescale`. If it says `apache`, add `timescaledb.license = 'timescale'`
   to `postgresql.conf`, restart, check again (compression needs it).

7. **Same date style on both servers.** The sign-up page stored dates as e.g. `14/11/2026`
   (fixed in the code now, but check anyway). A server reading dates month-first refuses that
   after the 12th of each month. Compare:

   ```bash
   .\psql -p 5432 -U postgres -c "SHOW DateStyle"
   ```

   ```bash
   .\psql -p 5433 -U postgres -c "SHOW DateStyle"
   ```

   If they differ, set `datestyle = '<the value of 5432>'` in the 17 `postgresql.conf` and restart.

**Try 02 on a throw-away database first** (one minute; it confirms your install accepts the file):

```bash
.\psql -p 5433 -U postgres -c "CREATE DATABASE ts_try"
```

```bash
.\psql -p 5433 -U postgres -d ts_try -v ON_ERROR_STOP=1 -f 01_tables.sql -f 02_timescale.sql
```

The last lines must list the 4 tables with `compression_enabled = t`. Then:

```bash
.\psql -p 5433 -U postgres -c "DROP DATABASE ts_try"
```

## Step 4. Structure of the new database

From this folder (`tcn_radar_BE\database\timescale`), with the 17 `psql` (full path or PATH):

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 01_tables.sql -f 02_timescale.sql
```

The small tables (users, bilateral_users, station_coords, station_coords_2, weather_table,
feeder_rows, nas_sessions, nas_audit_log, ...) are copied as they are, with the **17** `pg_dump`
(it reads a 14 server) **and the 17 `psql`** (a 17 dump has lines an older psql does not know). `-n public` leaves out the `niso` schema and the `adminpack` extension
(which no longer exists in 17):

```bash
pg_dump -h localhost -p 5432 -U postgres -d tcn_nas -n public -T lines_table -T genco_units_table -T bilateral_table -T frequency_table -T lines_table_id_seq -T genco_units_table_id_seq -T bilateral_table_id_seq -T frequency_table_id_seq --no-owner -f nas_small.sql
```

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -f nas_small.sql
```

Errors that only mention schema `public` ("already exists", "cannot drop schema public because
other objects depend on it", its comment) are expected and harmless. Any error about a table is not:
send it to me. (The 4 id sequences are excluded by name because pg_dump includes them even when
their tables are excluded.)

## Step 5. Copy the history (hours; the live system keeps running)

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 03_link_old_db.sql -f 04_copy.sql
```

(It asks for the password of `postgres` on the old server.) Then copy each table. Smallest first;
each command runs until that table is done and prints a line per batch:

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.copy_table('frequency_table')"
```

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.copy_table('bilateral_table')"
```

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.copy_table('genco_units_table')"
```

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.copy_table('lines_table')"
```

- **Stop it any time** (Ctrl+C, closing the window, a restart): run the same command again and it
  carries on after the last saved batch. Nothing is copied twice or skipped.
- The first batches show the speed (`rows in s`); multiply for an estimate. Prefer quiet hours: it
  reads the old server hard. The four can run in four windows at once if the server copes.
- Progress at any time:

  ```bash
  psql -p 5433 -U postgres -d tcn_nas_ts -c "SELECT * FROM ts_migration.progress"
  ```

- New readings keep going into tcn_nas meanwhile. Run the four commands again whenever you like
  to catch up; the last catch-up is the final pass in step 7.
- `rows_null_time`: rows of `lines_table` whose `time` is empty in tcn_nas. A hypertable cannot hold
  them, so they are kept in `ts_migration.lines_table_null_time` (counted, not lost).

## Step 6. Compress and check (before the switch)

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 05_after_copy.sql
```

The last query shows each table's size before and after compression.

**Checks** (quiet hour; the count check reads both tables in full). No rows returned = all good:

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "SELECT * FROM ts_migration.compare_counts('lines_table')"
```

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "SELECT * FROM ts_migration.sample_check('lines_table', 2000)"
```

Same for `genco_units_table`, `bilateral_table`, `frequency_table`. `compare_counts` lists the id
ranges whose counts differ; copy one again with (safe to repeat):

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.recopy_range('lines_table', 120000000, 129999999)"
```

`sample_check` compares random rows column by column, at most 2000 per call (run it several
times for more; larger samples took too much memory in the test). To check given rows:
`SELECT * FROM ts_migration.sample_check('lines_table', p_ids => '{1001,1002}')`.

Compare the speed of a typical search on both servers before the switch (change the station, line
and dates to a real one; `time` is in ms). **Do not** start a second copy of the backend against
the new database to try it: `bin/www` would subscribe to MQTT and write readings into it before
step 7 has set the id sequences.

```bash
psql -p 5433 -U postgres -d tcn_nas_ts -c "EXPLAIN ANALYZE SELECT time, mw, kv FROM lines_table WHERE station = 'eket' AND line_name = 'e21m' AND time BETWEEN 1793000000000 AND 1793086400000 ORDER BY time"
```

(the same command with `-p 5432 -d tcn_nas` on the old one; compare the `Execution Time` lines).

## Step 7. Switch over (a few minutes without writes)

1. **Stop the backend** (so nothing more is written to tcn_nas).
2. Final pass and sequences:

   ```bash
   psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.copy_table('frequency_table', p_final => true)" -c "CALL ts_migration.copy_table('bilateral_table', p_final => true)" -c "CALL ts_migration.copy_table('genco_units_table', p_final => true)" -c "CALL ts_migration.copy_table('lines_table', p_final => true)" -c "CALL ts_migration.set_sequences()"
   ```

3. Small tables again, with today's content (accounts, sessions, so nobody has to sign in again):

   ```bash
   pg_dump -h localhost -p 5432 -U postgres -d tcn_nas -n public -T lines_table -T genco_units_table -T bilateral_table -T frequency_table -T lines_table_id_seq -T genco_units_table_id_seq -T bilateral_table_id_seq -T frequency_table_id_seq --no-owner --clean --if-exists -f nas_small.sql
   ```

   ```bash
   psql -p 5433 -U postgres -d tcn_nas_ts -f nas_small.sql
   ```

4. In the backend `.env`: `PGPORT=5433`, `PGDATABASE=tcn_nas_ts`, and `PGUSER` / `PGPASSWORD` for
   the 17 server.
5. **Start the backend.** Check new rows arrive (run twice, a minute apart):

   ```bash
   psql -p 5433 -U postgres -d tcn_nas_ts -c "SELECT count(*), max(time) FROM lines_table WHERE time > nas_now_ms() - 120000"
   ```

   Open `/home_fix`, `/history_fix`, `/downtime_fix`, and one old report (TEM, daily).

tcn_nas is unchanged and still complete up to the switch. It is the way back.

## Step 8. Going back (only if needed)

1. Stop the backend.
2. Copy the rows written to the new database since the switch back into tcn_nas:

   ```bash
   psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL ts_migration.copy_back('frequency_table')" -c "CALL ts_migration.copy_back('bilateral_table')" -c "CALL ts_migration.copy_back('genco_units_table')" -c "CALL ts_migration.copy_back('lines_table')"
   ```

3. Each line prints a `setval` command: run those four on the **old** server (port 5432,
   database tcn_nas), so new ids continue after the copied rows.
4. `.env` back to `PGPORT=5432`, `PGDATABASE=tcn_nas`. Start the backend.

## Step 9. After 2 to 4 weeks without problems

1. Keep a last backup of tcn_nas (`pg_dump -Fc`), then set `postgresql-x64-14` to Manual and stop it.
2. In the 17 `postgresql.conf`, raise `shared_buffers` (~25% of RAM) and `effective_cache_size`
   (~60%), then restart `postgresql-x64-17`.
3. Remove the link to the old server (the empty-time rows are in `ts_migration`; export them first
   if you want them):

   ```bash
   psql -p 5433 -U postgres -d tcn_nas_ts -c "DROP SCHEMA ts_src CASCADE" -c "DROP SERVER nas_old CASCADE" -c "DROP SCHEMA ts_migration CASCADE"
   ```

4. tcn_nas also holds a `niso` schema with `niso.v1_*` functions that read these four tables (from
   the v2 work). Anything that uses them must be pointed at tcn_nas_ts, or it will see no new data
   after the switch.

## Backups with TimescaleDB

`pg_dump -Fc` works as usual. To restore into an empty database, on the same TimescaleDB version:

```bash
psql -p 5433 -U postgres -d restored_db -c "CREATE EXTENSION timescaledb" -c "SELECT timescaledb_pre_restore()"
```

```bash
pg_restore -p 5433 -U postgres -d restored_db nas.dump
```

```bash
psql -p 5433 -U postgres -d restored_db -c "SELECT timescaledb_post_restore()"
```

The A/B maintenance runbook in `../DB_MAINTENANCE.md` still applies (B is created from these files
the same way). Most of what made it necessary (VACUUM of 100 GB tables, index rebuilds) goes away,
as each chunk is small and old chunks are compressed.

## Optional

- **One-minute summary** of `lines_table`, kept up to date by TimescaleDB:
  `06_optional_minute_summary.sql`. The app does not use it yet. It is meant for future long-range
  charts, so a month of a line reads ~43 000 rows instead of ~500 000.
- **Retention** (only if you decide to delete old raw readings, e.g. after 5 years):
  `SELECT add_retention_policy('lines_table', drop_after => 157680000000::bigint);` (ms). Not set by
  these files: nothing is ever deleted.
