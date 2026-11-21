-- =====================================================================================================
-- 005_axis_lock.sql  -  lock password of the Ikorodu-Sagamu axis diagram (/bilaterals, /bilaterals_fix)
--
-- Holds only a salted scrypt hash, written by "Change lock password" on the page. While this table
-- has no row, the password is AXIS_LOCK_HASH from .env (or the built-in one). Once a row exists it
-- wins over both. The backend creates this table itself the first time the password is changed; if
-- the database user may not create tables, run it once as the owner:
--   psql -h <db ip> -U <owner> -d <database> -f database/migrations/005_axis_lock.sql
--   and: GRANT SELECT, INSERT, UPDATE ON nas_axis_lock TO <app user>;
--
-- Forgotten password: delete the row (DELETE FROM nas_axis_lock WHERE name = 'ikorodu-sagamu';)
-- and the .env / built-in password applies again.
-- =====================================================================================================
CREATE TABLE IF NOT EXISTS nas_axis_lock (
    name        TEXT        PRIMARY KEY,
    hash        TEXT        NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_ip  TEXT
);
