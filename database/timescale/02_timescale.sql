-- =====================================================================================================
-- 02_timescale.sql  -  turn the four reading tables into TimescaleDB hypertables.
--
-- Run in the NEW database, after 01_tables.sql and while the tables are still empty:
--   psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 02_timescale.sql
--
-- Needs TimescaleDB 2.13 or later (by_range). Written for the 2.2x/2.3x releases on PostgreSQL 17.
--
-- Chunk sizes (time is stored in milliseconds, so intervals are in ms):
--   lines_table, genco_units_table : 1 day   (86 400 000)   - the two busiest tables
--   bilateral_table, frequency_table: 7 days (604 800 000)
-- If README step 1 shows very different rows per day, change them here before running.
-- =====================================================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

DO $$
BEGIN
  -- Compression is a community-licence feature. The Windows build includes it, but the setting must
  -- not be 'apache'.
  IF coalesce(current_setting('timescaledb.license', true), '') = 'apache' THEN
    RAISE EXCEPTION 'timescaledb.license is apache: set timescaledb.license = ''timescale'' in postgresql.conf, restart PostgreSQL 17, run this file again';
  END IF;
END $$;

-- ---- hypertables ------------------------------------------------------------------------------------
SELECT create_hypertable('public.lines_table',       by_range('time',       86400000::bigint));
SELECT create_hypertable('public.genco_units_table', by_range('time',       86400000::bigint));
SELECT create_hypertable('public.bilateral_table',   by_range('time',       604800000::bigint));
SELECT create_hypertable('public.frequency_table',   by_range('time_epoch', 604800000::bigint));
-- create_hypertable also adds an index on the time column (time DESC), used by the whole-grid
-- reports (WHERE time BETWEEN ... AND station IN (...)) and by the catch-up queries.

SELECT set_integer_now_func('public.lines_table',       'public.nas_now_ms');
SELECT set_integer_now_func('public.genco_units_table', 'public.nas_now_ms');
SELECT set_integer_now_func('public.bilateral_table',   'public.nas_now_ms');
SELECT set_integer_now_func('public.frequency_table',   'public.nas_now_ms');

-- ---- one composite index per table, matching how the app searches ----------------------------------
-- lines_table: WHERE station = $1 AND line_name = $2 AND time BETWEEN ... (history, downtime, profile,
-- availability, CSV export, collapse). Replaces station_index and time_index of tcn_nas.
CREATE INDEX lines_station_line_time_idx ON public.lines_table (station, line_name, "time" DESC);
-- genco_units_table had no index but its primary key, so every search by time read all 50 GB.
CREATE INDEX genco_name_unit_time_idx ON public.genco_units_table (genco_name, unit_name, "time" DESC);
-- bilateral_table: WHERE name IN (...) AND time BETWEEN ...
CREATE INDEX bilateral_name_line_time_idx ON public.bilateral_table (name, line_name, "time" DESC);
-- frequency_table: WHERE time_epoch BETWEEN ... only - the default time index is enough.

-- ---- compression settings (the policies are added after the copy, in 05_after_copy.sql) ------------
-- Rows of one station/line are stored together and in time order, which is how they are read.
-- id is in the order so the primary-key check stays cheap if an old row arrives late.
ALTER TABLE public.lines_table SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'station, line_name',
  timescaledb.compress_orderby   = '"time" DESC, id');
ALTER TABLE public.genco_units_table SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'genco_name, unit_name',
  timescaledb.compress_orderby   = '"time" DESC, id');
ALTER TABLE public.bilateral_table SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'name, line_name',
  timescaledb.compress_orderby   = '"time" DESC, id');
ALTER TABLE public.frequency_table SET (
  timescaledb.compress,
  timescaledb.compress_orderby   = 'time_epoch DESC, id');

-- ---- the TEM report searches by date, not time ------------------------------------------------------
-- (WHERE date = $1 AND hour = $2 AND minute BETWEEN ...). In tcn_nas that reads the whole 115 GB
-- table. Chunk skipping keeps the date range of each compressed chunk, so only the chunk(s) of that
-- day are read. Optional: if this release does not have it, the report still works, just slower.
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timescaledb.enable_chunk_skipping = on', current_database()); -- new sessions
  PERFORM set_config('timescaledb.enable_chunk_skipping', 'on', false);                                -- this session
  PERFORM enable_chunk_skipping('public.lines_table', 'date');
  PERFORM enable_chunk_skipping('public.genco_units_table', 'date');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Chunk skipping not enabled (%). Everything else is fine.', SQLERRM;
END $$;

SELECT hypertable_name, num_dimensions, compression_enabled FROM timescaledb_information.hypertables ORDER BY 1;
