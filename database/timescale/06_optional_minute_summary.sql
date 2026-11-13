-- =====================================================================================================
-- 06_optional_minute_summary.sql  -  OPTIONAL. Not needed by the app today.
--
-- A one-minute summary of lines_table (average / min / max per station and line) that TimescaleDB
-- keeps up to date by itself. A month of one line is ~43 000 summary rows instead of ~500 000
-- readings, so future long-range charts and reports can read it instead of the raw table.
-- The backend does not use it yet; adding it changes nothing for the running app.
--
--   psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 06_optional_minute_summary.sql
-- then, once, at a quiet hour (fills it from the whole history; can take a long time):
--   psql -p 5433 -U postgres -d tcn_nas_ts -c "CALL refresh_continuous_aggregate('public.lines_1min', NULL, NULL)"
-- =====================================================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.lines_1min
WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT station,
       line_name,
       time_bucket(60000::bigint, "time") AS bucket,          -- stored time convention, ms
       avg(NULLIF(mw, 'NaN'))   AS mw_avg,   min(NULLIF(mw, 'NaN'))   AS mw_min,   max(NULLIF(mw, 'NaN'))   AS mw_max,
       avg(NULLIF(kv, 'NaN'))   AS kv_avg,   min(NULLIF(kv, 'NaN'))   AS kv_min,   max(NULLIF(kv, 'NaN'))   AS kv_max,
       avg(NULLIF(amp, 'NaN'))  AS amp_avg,  min(NULLIF(amp, 'NaN'))  AS amp_min,  max(NULLIF(amp, 'NaN'))  AS amp_max,
       avg(NULLIF(mvar, 'NaN')) AS mvar_avg, min(NULLIF(mvar, 'NaN')) AS mvar_min, max(NULLIF(mvar, 'NaN')) AS mvar_max,
       count(*) AS readings
  FROM public.lines_table
 GROUP BY station, line_name, bucket
WITH NO DATA;

-- Every minute, bring the last 3 days up to date (late readings included); the newest minute is
-- read live from lines_table (materialized_only = false), so the summary is never behind.
SELECT add_continuous_aggregate_policy('public.lines_1min',
         start_offset      => 259200000::bigint,   -- 3 days
         end_offset        => 60000::bigint,       -- 1 minute
         schedule_interval => INTERVAL '1 minute',
         if_not_exists     => true);
