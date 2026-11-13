-- =====================================================================================================
-- 04_copy.sql  -  procedures that copy the readings from tcn_nas into the new database, and check them.
--
-- Install in the NEW database (after 01, 02, 03):
--   psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 04_copy.sql
--
-- How the copy works
--   * By id range, never by date: every source table's primary key starts with id, so each batch is
--     a short index range read on the old server (genco_units_table has no time index at all, so a
--     search by date there would read all 50 GB every batch).
--   * Each batch is committed together with its progress row, so the copy can be stopped (Ctrl+C,
--     restart, power cut) and started again: it carries on after the last committed batch, without
--     copying anything twice.
--   * While the old server is still being written to, the newest p_lag ids are left for later, so a
--     row whose insert is still in flight is never skipped. The final pass (p_final => true), run with
--     the backend stopped, copies everything that is left.
--   * Rows whose time is empty (lines_table."time" may be NULL in tcn_nas) cannot go into a hypertable.
--     They are kept in ts_migration.lines_table_null_time and counted, never dropped.
--   * With p_compress (default), chunks that are complete are compressed as the copy goes, so the new
--     database never needs the full uncompressed size on disk.
--
-- Use (each CALL runs until that table is copied; see README step 5):
--   CALL ts_migration.copy_table('frequency_table');
--   CALL ts_migration.copy_table('lines_table');
--   SELECT * FROM ts_migration.progress;
-- =====================================================================================================

CREATE OR REPLACE PROCEDURE ts_migration.copy_table(
    p_table    text,
    p_batch    bigint  DEFAULT 1000000,  -- ids per batch (one transaction)
    p_final    boolean DEFAULT false,    -- true only at the switch-over, with the backend stopped
    p_lag      bigint  DEFAULT 10000,    -- newest ids left for later while the old server is live
    p_compress boolean DEFAULT true)
LANGUAGE plpgsql AS $$
DECLARE
  tc        text;
  cols      text;
  src_cols  text;
  nullable  boolean;
  aside     text;
  last      bigint;
  src_max   bigint;
  target    bigint;
  hi        bigint;
  n         bigint;
  nn        bigint;
  total     bigint := 0;
  t0        timestamptz;
  started   timestamptz := clock_timestamp();
  has_ts    boolean := EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb');
  cutoff    bigint;
  chunks    text[];
  c         text;
BEGIN
  IF p_table NOT IN ('lines_table', 'genco_units_table', 'bilateral_table', 'frequency_table') THEN
    RAISE EXCEPTION 'unknown table %', p_table;
  END IF;
  tc := CASE p_table WHEN 'frequency_table' THEN 'time_epoch' ELSE 'time' END;
  aside := p_table || '_null_time';

  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name) INTO cols
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name = p_table;
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name) INTO src_cols
    FROM information_schema.columns WHERE table_schema = 'ts_src' AND table_name = p_table;
  IF src_cols IS NULL THEN
    RAISE EXCEPTION 'ts_src.% not found: run 03_link_old_db.sql first', p_table;
  END IF;
  IF cols IS DISTINCT FROM src_cols THEN
    RAISE EXCEPTION 'columns differ between tcn_nas and the new %: old (%) new (%)', p_table, src_cols, cols;
  END IF;
  SELECT is_nullable = 'YES' INTO nullable FROM information_schema.columns
    WHERE table_schema = 'ts_src' AND table_name = p_table AND column_name = tc;

  INSERT INTO ts_migration.progress (table_name) VALUES (p_table) ON CONFLICT (table_name) DO NOTHING;
  IF nullable THEN
    EXECUTE format('CREATE TABLE IF NOT EXISTS ts_migration.%I (LIKE public.%I)', aside, p_table);
    EXECUTE format('ALTER TABLE ts_migration.%I ALTER COLUMN %I DROP NOT NULL', aside, tc);
  END IF;
  COMMIT;

  LOOP
    SELECT last_id INTO last FROM ts_migration.progress WHERE table_name = p_table;
    EXECUTE format('SELECT max(id) FROM ts_src.%I', p_table) INTO src_max;
    target := CASE WHEN p_final THEN src_max ELSE src_max - p_lag END;
    EXIT WHEN src_max IS NULL OR last >= target;
    hi := least(last + p_batch, target);
    t0 := clock_timestamp();

    EXECUTE format(
      'INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM ts_src.%1$I WHERE id > %3$s AND id <= %4$s AND %5$I IS NOT NULL ON CONFLICT DO NOTHING',
      p_table, cols, last, hi, tc);
    GET DIAGNOSTICS n = ROW_COUNT;
    nn := 0;
    IF nullable THEN
      EXECUTE format(
        'INSERT INTO ts_migration.%1$I (%2$s) SELECT %2$s FROM ts_src.%3$I WHERE id > %4$s AND id <= %5$s AND %6$I IS NULL',
        aside, cols, p_table, last, hi, tc);
      GET DIAGNOSTICS nn = ROW_COUNT;
    END IF;
    IF n = 0 AND nn = 0 THEN
      -- a gap in the ids (sequence jumps): go straight to the next id that exists
      EXECUTE format('SELECT min(id) - 1 FROM ts_src.%I WHERE id > %s', p_table, hi) INTO cutoff;
      hi := greatest(hi, least(coalesce(cutoff, hi), target));
    END IF;

    UPDATE ts_migration.progress
       SET last_id = hi, rows_copied = rows_copied + n, rows_null_time = rows_null_time + nn, updated_at = now()
     WHERE table_name = p_table;
    COMMIT;  -- the rows and the progress are saved together
    total := total + n;
    RAISE NOTICE '% ids % to %: % rows% in % s, % ids still to read', p_table, last + 1, hi, n,
      CASE WHEN nn > 0 THEN format(' (+%s without time, kept aside)', nn) ELSE '' END,
      round(extract(epoch FROM clock_timestamp() - t0)::numeric, 1), target - hi;

    -- Compress chunks that are complete: ending at least 2 days before the newest row copied so far
    -- (and never in the future, in case a device sent a wrong clock).
    IF p_compress AND has_ts THEN
      EXECUTE format('SELECT max(%I) FROM public.%I', tc, p_table) INTO cutoff;
      cutoff := least(cutoff, public.nas_now_ms()) - 2 * 86400000;
      EXECUTE format(
          'SELECT array_agg(format(''%%I.%%I'', chunk_schema, chunk_name) ORDER BY range_start_integer)
             FROM timescaledb_information.chunks
            WHERE hypertable_schema = ''public'' AND hypertable_name = %L AND NOT is_compressed
              AND range_end_integer <= %s', p_table, cutoff) INTO chunks;
      FOREACH c IN ARRAY coalesce(chunks, '{}'::text[]) LOOP
        EXECUTE format('SELECT compress_chunk(%L::regclass, if_not_compressed => true)', c);
        COMMIT;
        RAISE NOTICE '% compressed %', p_table, c;
      END LOOP;
    END IF;
  END LOOP;

  IF p_final THEN
    UPDATE ts_migration.progress SET finished_at = now(), updated_at = now() WHERE table_name = p_table;
    COMMIT;
  END IF;
  RAISE NOTICE '% done for now: % rows in % min. Up to id % copied.%', p_table, total,
    round(extract(epoch FROM clock_timestamp() - started)::numeric / 60, 1),
    (SELECT last_id FROM ts_migration.progress WHERE table_name = p_table),
    CASE WHEN p_final THEN ' Final pass complete.' ELSE ' Run it again later to catch up; final pass at the switch-over.' END;
END $$;


-- At the switch-over, after the final pass: new rows continue the old numbering.
CREATE OR REPLACE PROCEDURE ts_migration.set_sequences()
LANGUAGE plpgsql AS $$
DECLARE
  t   text;
  m   bigint;
  seq text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lines_table', 'genco_units_table', 'bilateral_table', 'frequency_table'] LOOP
    EXECUTE format('SELECT greatest((SELECT max(id) FROM ts_src.%I), (SELECT last_id FROM ts_migration.progress WHERE table_name = %L), 1)', t, t) INTO m;
    seq := pg_get_serial_sequence(format('public.%I', t), 'id');
    PERFORM setval(seq, m, true);
    RAISE NOTICE '% next id %', seq, m + 1;
  END LOOP;
END $$;


-- Row counts per id range, old against new. Returns ONLY the ranges that differ: no rows = all good.
-- Reads both tables in full (the old one through its primary-key index): run it at a quiet hour.
CREATE OR REPLACE FUNCTION ts_migration.compare_counts(p_table text, p_bucket bigint DEFAULT 10000000)
RETURNS TABLE (from_id bigint, to_id bigint, old_rows bigint, new_rows bigint, kept_aside bigint)
LANGUAGE plpgsql AS $$
DECLARE
  upto  bigint := (SELECT last_id FROM ts_migration.progress WHERE table_name = p_table);
  aside text := CASE WHEN to_regclass(format('ts_migration.%I', p_table || '_null_time')) IS NULL
                     THEN '(SELECT NULL::bigint AS id WHERE false)'
                     ELSE format('ts_migration.%I', p_table || '_null_time') END;
BEGIN
  IF upto IS NULL THEN RAISE EXCEPTION 'nothing copied yet for %', p_table; END IF;
  RETURN QUERY EXECUTE format($q$
    WITH o AS (SELECT id / %2$s AS b, count(*) AS n FROM ts_src.%1$I WHERE id <= %3$s GROUP BY 1),
         t AS (SELECT id / %2$s AS b, count(*) AS n FROM public.%1$I WHERE id <= %3$s GROUP BY 1),
         q AS (SELECT id / %2$s AS b, count(*) AS n FROM %4$s x WHERE id <= %3$s GROUP BY 1)
    SELECT b * %2$s, b * %2$s + %2$s - 1, coalesce(o.n, 0), coalesce(t.n, 0), coalesce(q.n, 0)
      FROM o FULL JOIN t USING (b) FULL JOIN q USING (b)
     WHERE coalesce(o.n, 0) <> coalesce(t.n, 0) + coalesce(q.n, 0)
     ORDER BY b $q$, p_table, p_bucket, upto, aside);
END $$;


-- Compares p_n random rows (at most 2000 per call; call it again for more) column by column, old
-- against new, or the rows with the ids given in p_ids. No rows returned = all identical.
-- Runs without parallel workers so it stays small in memory next to the live system.
DROP FUNCTION IF EXISTS ts_migration.sample_check(text, integer);
CREATE OR REPLACE FUNCTION ts_migration.sample_check(p_table text, p_n integer DEFAULT 500, p_ids bigint[] DEFAULT NULL)
RETURNS TABLE (id bigint, problem text)
LANGUAGE plpgsql
SET max_parallel_workers_per_gather = 0
AS $$
DECLARE
  tc    text := CASE p_table WHEN 'frequency_table' THEN 'time_epoch' ELSE 'time' END;
  upto  bigint := (SELECT last_id FROM ts_migration.progress WHERE table_name = p_table);
  lo    bigint;
  ids   bigint[];
  times bigint[];
  cols  text;
  aside text := CASE WHEN to_regclass(format('ts_migration.%I', p_table || '_null_time')) IS NULL
                     THEN NULL ELSE format('ts_migration.%I', p_table || '_null_time') END;
BEGIN
  IF upto IS NULL THEN RAISE EXCEPTION 'nothing copied yet for %', p_table; END IF;
  IF p_ids IS NOT NULL THEN
    ids := p_ids[1:2000];
  ELSE
    EXECUTE format('SELECT min(id) FROM ts_src.%I', p_table) INTO lo;
    ids := ARRAY(SELECT DISTINCT (lo + floor(random() * (upto - lo + 1)))::bigint FROM generate_series(1, least(p_n, 2000)));
  END IF;
  -- the times of those rows, so the new side reads only the chunks (and compressed segments) concerned
  EXECUTE format('SELECT array_agg(DISTINCT %I) FROM ts_src.%I WHERE id = ANY (%L::bigint[])', tc, p_table, ids) INTO times;
  -- Columns are listed by name: TimescaleDB cannot take a whole row (to_jsonb(d)) of a compressed chunk.
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name) INTO cols
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name = p_table;
  RETURN QUERY EXECUTE format($q$
    WITH o AS (SELECT x.id, to_jsonb(x) AS j FROM (SELECT %6$s FROM ts_src.%1$I s WHERE s.id = ANY (%2$L::bigint[])) x),
         t AS (SELECT x.id, to_jsonb(x) AS j FROM (SELECT %6$s FROM public.%1$I d WHERE d.%3$I = ANY (%4$L::bigint[]) AND d.id = ANY (%2$L::bigint[])
               %5$s) x)
    SELECT coalesce(o.id, t.id), CASE WHEN t.j IS NULL THEN 'in tcn_nas, missing or different in the new database'
                                      ELSE 'in the new database only, or different' END
      FROM o FULL JOIN t ON o.j = t.j
     WHERE o.j IS NULL OR t.j IS NULL
     ORDER BY 1 $q$,
    p_table, ids, tc, coalesce(times, '{}'::bigint[]),
    CASE WHEN aside IS NULL THEN '' ELSE format('UNION ALL SELECT %s FROM %s a WHERE a.id = ANY (%L::bigint[])', cols, aside, ids) END,
    cols);
END $$;


-- Copies one id range again (after compare_counts showed a difference). Safe to run twice.
CREATE OR REPLACE PROCEDURE ts_migration.recopy_range(p_table text, p_from bigint, p_to bigint)
LANGUAGE plpgsql AS $$
DECLARE
  tc    text := CASE p_table WHEN 'frequency_table' THEN 'time_epoch' ELSE 'time' END;
  cols  text;
  aside text := p_table || '_null_time';
  n     bigint;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name) INTO cols
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name = p_table;
  EXECUTE format('INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM ts_src.%1$I WHERE id BETWEEN %3$s AND %4$s AND %5$I IS NOT NULL ON CONFLICT DO NOTHING',
    p_table, cols, p_from, p_to, tc);
  GET DIAGNOSTICS n = ROW_COUNT;
  IF to_regclass(format('ts_migration.%I', aside)) IS NOT NULL THEN
    EXECUTE format('DELETE FROM ts_migration.%I WHERE id BETWEEN %s AND %s', aside, p_from, p_to);
    EXECUTE format('INSERT INTO ts_migration.%1$I (%2$s) SELECT %2$s FROM ts_src.%3$I WHERE id BETWEEN %4$s AND %5$s AND %6$I IS NULL',
      aside, cols, p_table, p_from, p_to, tc);
  END IF;
  RAISE NOTICE '%: % missing rows added for ids % to %', p_table, n, p_from, p_to;
END $$;


-- ROLLBACK ONLY (README step 8): copies the rows written to the new database since the switch-over
-- back into tcn_nas, so going back to the old server loses nothing. Safe to run twice.
CREATE OR REPLACE PROCEDURE ts_migration.copy_back(p_table text)
LANGUAGE plpgsql AS $$
DECLARE
  cols    text;
  from_id bigint;
  old_max bigint;
  n       bigint;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name) INTO cols
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name = p_table;
  from_id := (SELECT last_id FROM ts_migration.progress WHERE table_name = p_table);
  EXECUTE format('SELECT max(id) FROM ts_src.%I', p_table) INTO old_max;
  from_id := greatest(from_id, coalesce(old_max, 0));  -- rows already copied back are skipped
  EXECUTE format('INSERT INTO ts_src.%1$I (%2$s) SELECT %2$s FROM public.%1$I WHERE id > %3$s ORDER BY id', p_table, cols, from_id);
  GET DIAGNOSTICS n = ROW_COUNT;
  -- (lines_table_id_seq is not owned by its table in tcn_nas, so the sequence is named explicitly.)
  RAISE NOTICE '%: % rows copied back to tcn_nas (ids above %). On the OLD server now run: SELECT setval(''public.%_id_seq'', (SELECT max(id) FROM public.%));',
    p_table, n, from_id, p_table, p_table;
END $$;
