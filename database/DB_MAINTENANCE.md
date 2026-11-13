# Database maintenance runbook (NISO NAS backend)

Every PostgreSQL query in this backend goes through `database/db.js`, which calls `new Pool()` with
no connection settings. So **the database is chosen only by the standard libpq variables in `.env`**:

```
PGHOST=...      PGPORT=5432      PGDATABASE=...      PGUSER=...      PGPASSWORD=...
```

Pointing the server at another database = change those lines and restart the backend. Nothing else
in the code names a database. (MSSQL in `database/nsongdb.js` is separate and not affected.)

Words used below: **A** = the main database, **B** = the stand-in database used during maintenance.

---

## 1. Send me the structure of the current database

Run on the database server (or any machine with `psql` that can reach it). Replace the
`<...>` parts; `psql`/`pg_dump` will ask for the password, so it is not typed on the command line.

Structure only (no data, no passwords, no owners):

```bash
.\pg_dump -h localhost -p 5432 -U postgres -d tcn_nas --schema-only --no-owner --no-privileges -f nas_schema.sql
```

Table sizes and row counts:

```bash
.\psql -h localhost -U postgres -d tcn_nas -At -F ' | ' -c "SELECT relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) AS total, pg_size_pretty(pg_indexes_size(relid)) AS indexes, last_autovacuum, last_autoanalyze FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC" > nas_tables.txt
```

Which indexes are used (and which are never used):

```bash
.\psql -h localhost -U postgres -d tcn_nas -At -F ' | ' -c "SELECT relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) FROM pg_stat_user_indexes ORDER BY relname, idx_scan" > nas_indexes.txt
```

Server version and memory settings:

```bash
.\psql -h localhost -U postgres -d tcn_nas -At -c "SELECT version()" -c "SELECT name, setting, unit FROM pg_settings WHERE name IN ('shared_buffers','work_mem','maintenance_work_mem','effective_cache_size','max_connections','autovacuum','max_wal_size','random_page_cost')" > nas_settings.txt
```

Send `nas_schema.sql`, `nas_tables.txt`, `nas_indexes.txt` and `nas_settings.txt`. None of them
contain readings or passwords. With them I can write the optimised database (section 5).

---

## 2. Before every maintenance: prepare B

1. **Create B with the same structure** (same server or another one):

   ```bash
   createdb -h localhost -U postgres nas_standby
   ```

   ```bash
   psql -h localhost -U postgres -d nas_standby -f nas_schema.sql
   ```

2. **Copy the small tables the application needs to work** (accounts and settings, not readings).
   Without them nobody can sign in while B is in use. `pg_dump -t` also sets each table's id
   sequence, so new rows in B do not clash with A:

   ```bash
   pg_dump -h localhost -U postgres -d tcn_nas --data-only --no-owner -t users -t bilateral_users -t nas_sessions -f nas_reference.sql
   ```

   ```bash
   .\psql -h localhost -U postgres -d nas_standby -f nas_reference.sql
   ```

   Add any other configuration tables you see in `nas_tables.txt` (small row counts) with more
   `-t name`. **`nas_sessions` is what keeps people (and the grid page one / two wall screens) signed
   in.** Copy it at the moment of the switch, or everyone signs in again on B. If you skip it the
   wall screens show the sign-in page until someone signs them in again.

3. Check B answers:

   ```bash
   .\psql -h localhost -U postgres -d nas_standby -c "SELECT count(*) FROM users"
   ```

---

## 3. Switch to B, maintain A, switch back

**Switch to B** — note the time (T1):

1. In `.env` change `PGHOST` / `PGDATABASE` (and user/password if different) to B.
2. Restart the backend the usual way. From that moment every reading is written to B only.
3. Open `/home_fix` and one of the analysis pages: the live readings keep coming (they come from
   MQTT, not the database), and new rows appear in B:

   ```bash
   .\psql -h localhost -U postgres -d nas_standby -c "SELECT count(*), max(time) FROM lines_table"
   ```

   History pages show only what B has (from T1) while B is in use. That is expected.

**Maintain A** (examples, pick what you need; run on A):

```bash
psql -h <hostA> -U <user> -d <database> -c "VACUUM (VERBOSE, ANALYZE) lines_table"
```

```bash
psql -h <hostA> -U <user> -d <database> -c "REINDEX TABLE CONCURRENTLY lines_table"
```

(`REINDEX ... CONCURRENTLY` needs PostgreSQL 12+. `VACUUM FULL` rewrites the table and locks it:
fine while the server writes to B, never while A is in use.)

**Switch back** — note the time (T2):

1. Put the A settings back in `.env` and restart the backend. Writes go to A again.
2. **Copy what B received between T1 and T2 into A.** Because the server writes to only one database
   at a time, everything B holds in the reading tables belongs to that window. The `id` column is
   left out so A gives the rows its own ids. Example for `lines_table` (repeat for each reading table,
   e.g. the bilateral, frequency and weather tables — list them from `nas_tables.txt`):

   ```bash
   psql -h <hostB> -U <user> -d nas_standby -c "\copy (SELECT station, line_name, time, mw, kv, amp, mvar FROM lines_table) TO 'window_lines.csv' CSV"
   ```

   ```bash
   psql -h <hostA> -U <user> -d <database> -c "\copy lines_table (station, line_name, time, mw, kv, amp, mvar) FROM 'window_lines.csv' CSV"
   ```

   Use the real column list from `nas_schema.sql` (every column except `id`), in the same order on
   both commands.

3. Copy the audit trail of the window the same way (who signed in and what they did while B was
   in use):

   ```bash
   psql -h <hostB> -U <user> -d nas_standby -c "\copy (SELECT at, session_id, realm, email, name, action, path, detail, ip, user_agent FROM nas_audit_log) TO 'window_audit.csv' CSV"
   ```

   ```bash
   psql -h <hostA> -U <user> -d <database> -c "\copy nas_audit_log (at, session_id, realm, email, name, action, path, detail, ip, user_agent) FROM 'window_audit.csv' CSV"
   ```

   Sign-ins made on B are not copied back, so people who signed in during the window sign in once
   more. To keep the wall screens signed in, sign them in before T1, or copy `nas_sessions` back.

4. **Check** the window is complete. First read the count and the first/last time in B:

   ```bash
   psql -h <hostB> -U <user> -d nas_standby -At -c "SELECT count(*), min(time), max(time) FROM lines_table"
   ```

   Then count the same span in A, pasting B's min and max. The count must equal B's:

   ```bash
   psql -h <hostA> -U <user> -d <database> -At -c "SELECT count(*) FROM lines_table WHERE time BETWEEN <min from B> AND <max from B>"
   ```

5. Empty B for next time (`DROP DATABASE nas_standby;` and repeat section 2 then, or `TRUNCATE` the
   reading tables).

Notes:
- `nas_sessions` and `nas_audit_log` are created automatically in whichever database is active
  the first time `/auth2` is used, so B works even if you forget them in the schema. Their structure
  is in `database/migrations/001_nas_auth_audit.sql`.
- Do a short practice run on a quiet day first (switch to B for 10 minutes and back), and keep the
  CSV files until you have checked the counts.

---

## 4. Index you can add now (no downtime)

The analysis pages (`/history_fix`, `/downtime_fix`, ...) and the old reports search
`lines_table` by station, equipment and time. If `nas_schema.sql` does not already have an index
starting with those three columns, this one makes those searches read only the rows they need.
`CONCURRENTLY` builds it without blocking the writes from MQTT (it takes longer; run it at a quiet
hour, outside a transaction):

```bash
psql -h <hostA> -U <user> -d <database> -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS lines_table_station_line_time_idx ON lines_table (station, line_name, time)"
```

If the build is interrupted it leaves an INVALID index: drop it (`DROP INDEX CONCURRENTLY
lines_table_station_line_time_idx`) and run the command again.

---

## 5. Optimised database: TimescaleDB

Done, from `nas_schema.sql`: see **`timescale/README.md`**. In short:

- PostgreSQL 17 + TimescaleDB installed next to the current 14 (port 5433), new database
  `tcn_nas_ts`, same tables and columns, so the code does not change; the switch is the `.env`
  change of section 3.
- The four reading tables become hypertables (1-day or 7-day chunks on `time`), with one composite
  index each, matching the app's searches. `genco_units_table` had no index but its primary key.
  Chunks are compressed by station/line after 7 days.
- The history is copied with a resumable procedure while the live system keeps writing to tcn_nas;
  the switch-over itself is a few minutes; tcn_nas stays complete as the way back, and rows written
  after the switch can be copied back.

Until then, the index in section 4 is still worth adding to tcn_nas.
