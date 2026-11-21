-- =====================================================================================================
-- 004_axis_layout.sql  -  saved arrangement of the Ikorodu-Sagamu axis flow diagram (/bilaterals_fix).
--
-- One row per diagram. The backend creates this table itself on first use (IF NOT EXISTS). If the
-- database user may not create tables, run it once as the owner:
--   psql -U postgres -d <database> -f database/migrations/004_axis_layout.sql
-- =====================================================================================================
CREATE TABLE IF NOT EXISTS nas_axis_layout (
    name        TEXT        PRIMARY KEY,
    layout      JSONB       NOT NULL,
    version     INTEGER     NOT NULL DEFAULT 1,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_ip  TEXT
);
