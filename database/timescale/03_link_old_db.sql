-- =====================================================================================================
-- 03_link_old_db.sql  -  lets the new database read tcn_nas (PostgreSQL 14) directly, with postgres_fdw.
--
-- Run in the NEW database:   psql -p 5433 -U postgres -d tcn_nas_ts -v ON_ERROR_STOP=1 -f 03_link_old_db.sql
-- psql asks for the password of the old server's postgres user; it is not written in any file.
-- (It is kept in the new server's catalogue until README step 9 removes the link.)
--
-- The old database is only read (and written to only by the optional copy_back in 04_copy.sql).
-- Change host/port/dbname below if the old server is not on this machine at 5432.
-- =====================================================================================================

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER IF NOT EXISTS nas_old FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'localhost', port '5432', dbname 'tcn_nas', fetch_size '50000');

\prompt 'Password of user postgres on the OLD server (tcn_nas, port 5432): ' old_password
CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER SERVER nas_old
  OPTIONS (user 'postgres', password :'old_password');
\unset old_password

CREATE SCHEMA IF NOT EXISTS ts_src;
IMPORT FOREIGN SCHEMA public LIMIT TO (lines_table, genco_units_table, bilateral_table, frequency_table)
  FROM SERVER nas_old INTO ts_src;

-- Quick check: one cheap query per table on the old server (uses its primary-key index).
SELECT 'lines_table' AS table_name, max(id) AS max_id FROM ts_src.lines_table
UNION ALL SELECT 'genco_units_table', max(id) FROM ts_src.genco_units_table
UNION ALL SELECT 'bilateral_table',   max(id) FROM ts_src.bilateral_table
UNION ALL SELECT 'frequency_table',   max(id) FROM ts_src.frequency_table;
