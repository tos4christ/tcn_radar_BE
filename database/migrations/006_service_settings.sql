-- =====================================================================================================
-- 006_service_settings.sql  -  switches an administrator turns on and off from the Admin page
--
-- One row per switch. Today only 'weather': { "suspended": true|false, "message": "...", "since": "..." }
-- While weather is suspended, the live weather endpoints answer 503 with code 'weather_suspended',
-- the weather engine makes no calls to the weather providers, and the home, weather and sign-in
-- pages show "Weather API subscription expired". Recorded weather reports still download.
--
-- The backend creates this table itself the first time a switch is changed; if the database user
-- may not create tables, run it once as the owner:
--   psql -h <db ip> -U <owner> -d <database> -f database/migrations/006_service_settings.sql
--   and: GRANT SELECT, INSERT, UPDATE ON nas_service_settings TO <app user>;
--
-- Turn weather back on without the page:
--   UPDATE nas_service_settings SET value = '{"suspended": false}' WHERE key = 'weather';
-- (the server picks it up within 15 seconds)
-- =====================================================================================================
CREATE TABLE IF NOT EXISTS nas_service_settings (
    key         TEXT        PRIMARY KEY,
    value       JSONB       NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT
);
