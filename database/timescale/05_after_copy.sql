-- =====================================================================================================
-- 05_after_copy.sql  -  run once the history is copied (README step 6), before or after the switch.
--
--   psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 05_after_copy.sql
--
-- From then on TimescaleDB compresses every chunk automatically 7 days after it ends. Nothing is ever
-- deleted: there is no retention policy (see README "Optional" if you want one).
-- =====================================================================================================

-- 7 days, in the stored time unit (ms). Measured with public.nas_now_ms().
SELECT add_compression_policy('public.lines_table',       compress_after => 604800000::bigint, if_not_exists => true);
SELECT add_compression_policy('public.genco_units_table', compress_after => 604800000::bigint, if_not_exists => true);
SELECT add_compression_policy('public.bilateral_table',   compress_after => 604800000::bigint, if_not_exists => true);
SELECT add_compression_policy('public.frequency_table',   compress_after => 604800000::bigint, if_not_exists => true);

-- Compress, now, every chunk older than 7 days that the copy left uncompressed. One chunk per
-- transaction, so it can be interrupted and run again.
CREATE OR REPLACE PROCEDURE ts_migration.compress_old_chunks()
LANGUAGE plpgsql AS $$
DECLARE
  chunks text[];
  c      text;
BEGIN
  SELECT array_agg(format('%I.%I', chunk_schema, chunk_name) ORDER BY range_start_integer) INTO chunks
    FROM timescaledb_information.chunks
   WHERE hypertable_schema = 'public'
     AND hypertable_name IN ('lines_table', 'genco_units_table', 'bilateral_table', 'frequency_table')
     AND NOT is_compressed
     AND range_end_integer <= public.nas_now_ms() - 604800000;
  FOREACH c IN ARRAY coalesce(chunks, '{}'::text[]) LOOP
    PERFORM compress_chunk(c::regclass, if_not_compressed => true);
    COMMIT;
    RAISE NOTICE 'compressed %', c;
  END LOOP;
END $$;
CALL ts_migration.compress_old_chunks();

ANALYZE public.lines_table;
ANALYZE public.genco_units_table;
ANALYZE public.bilateral_table;
ANALYZE public.frequency_table;

-- Size before / after compression, per table.
SELECT hypertable_name,
       pg_size_pretty(before_compression_total_bytes) AS before,
       pg_size_pretty(after_compression_total_bytes)  AS after
  FROM (SELECT h.hypertable_name, s.*
          FROM timescaledb_information.hypertables h,
               LATERAL hypertable_compression_stats(format('%I.%I', h.hypertable_schema, h.hypertable_name)::regclass) s) x
 ORDER BY 1;
