-- =====================================================================================================
-- 01_tables.sql  -  the four reading tables in the new database (tcn_nas_ts), before TimescaleDB.
--
-- Run in the NEW database:   psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 01_tables.sql
--
-- Same table names, column names, column order and types as tcn_nas (nas_schema.sql), so the backend
-- and every report work without a code change. What differs:
--   * The time column is NOT NULL and part of the primary key. A hypertable needs both. The key stays
--     a PRIMARY KEY (not just a unique index) on purpose: several reports run
--        SELECT * FROM lines_table ... GROUP BY station, line_name, id, ..., time
--     without hour/minute/seconds, which PostgreSQL accepts only when the GROUP BY contains the whole
--     primary key. (id, time) keeps those queries valid; a unique index would not.
--   * The single-column indexes are replaced by one composite index per table in 02_timescale.sql.
-- The small tables (users, bilateral_users, station_coords, ...) are copied as they are with pg_dump,
-- see README.md step 4.
-- =====================================================================================================

CREATE SEQUENCE IF NOT EXISTS public.lines_table_id_seq;
CREATE TABLE public.lines_table (
    id bigint DEFAULT nextval('public.lines_table_id_seq'::regclass) NOT NULL,
    station text NOT NULL,
    date date NOT NULL,
    line_name text NOT NULL,
    mw double precision NOT NULL,
    amp double precision NOT NULL,
    kv double precision NOT NULL,
    mvar double precision NOT NULL,
    variant text NOT NULL,
    hour integer NOT NULL,
    minute integer NOT NULL,
    seconds integer NOT NULL,
    level integer NOT NULL,
    equipment_id text NOT NULL,
    "time" bigint NOT NULL,
    CONSTRAINT lines_table_pkey PRIMARY KEY (id, "time")
);
ALTER SEQUENCE public.lines_table_id_seq OWNED BY public.lines_table.id;

CREATE SEQUENCE IF NOT EXISTS public.genco_units_table_id_seq;
CREATE TABLE public.genco_units_table (
    id bigint DEFAULT nextval('public.genco_units_table_id_seq'::regclass) NOT NULL,
    genco_name text NOT NULL,
    "time" bigint NOT NULL,
    unit_name text NOT NULL,
    active_power double precision NOT NULL,
    reactive_power double precision NOT NULL,
    power_factor double precision NOT NULL,
    voltage double precision NOT NULL,
    frequency double precision NOT NULL,
    current double precision,
    hour integer,
    minute integer,
    seconds integer,
    date date NOT NULL,
    CONSTRAINT genco_units_table_pkey PRIMARY KEY (id, genco_name, unit_name, "time")
);
ALTER SEQUENCE public.genco_units_table_id_seq OWNED BY public.genco_units_table.id;

CREATE SEQUENCE IF NOT EXISTS public.bilateral_table_id_seq;
CREATE TABLE public.bilateral_table (
    name text NOT NULL,
    date date NOT NULL,
    line_name text,
    mw double precision,
    amp double precision,
    kv double precision,
    mvar double precision,
    pf double precision,
    f double precision,
    hour double precision NOT NULL,
    minute double precision NOT NULL,
    seconds double precision NOT NULL,
    "time" bigint NOT NULL,
    id bigint DEFAULT nextval('public.bilateral_table_id_seq'::regclass) NOT NULL,
    CONSTRAINT bilateral_table_pkey PRIMARY KEY (id, name, "time")
);
ALTER SEQUENCE public.bilateral_table_id_seq OWNED BY public.bilateral_table.id;

CREATE SEQUENCE IF NOT EXISTS public.frequency_table_id_seq;
CREATE TABLE public.frequency_table (
    date date NOT NULL,
    "time" text NOT NULL,
    time_epoch bigint NOT NULL,
    id bigint DEFAULT nextval('public.frequency_table_id_seq'::regclass) NOT NULL,
    hz double precision NOT NULL,
    CONSTRAINT frequency_table_pkey PRIMARY KEY (id, time_epoch)
);
ALTER SEQUENCE public.frequency_table_id_seq OWNED BY public.frequency_table.id;

-- "Now" in the stored time convention. bin/www stores new Date(y, m, d, hour + 1, min, sec).getTime()
-- on a server set to West Africa Time, so a stored value is the real epoch in ms plus one hour.
-- TimescaleDB needs this for the compression policy on an integer time column (02_timescale.sql).
CREATE OR REPLACE FUNCTION public.nas_now_ms() RETURNS bigint
LANGUAGE sql STABLE AS $$ SELECT (extract(epoch FROM now()) * 1000)::bigint + 3600000 $$;

-- Book-keeping for the copy from tcn_nas (04_copy.sql). Dropped at the end (README step 9).
CREATE SCHEMA IF NOT EXISTS ts_migration;
CREATE TABLE IF NOT EXISTS ts_migration.progress (
    table_name      text PRIMARY KEY,
    last_id         bigint NOT NULL DEFAULT 0,     -- every source row with id <= last_id has been copied
    rows_copied     bigint NOT NULL DEFAULT 0,
    rows_null_time  bigint NOT NULL DEFAULT 0,     -- rows kept aside because their time was empty
    started_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    finished_at     timestamptz                    -- set by the final pass (switch-over)
);
