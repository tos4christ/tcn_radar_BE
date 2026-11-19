-- =====================================================================================================
-- 002_weather2.sql  -  tables of the weather engine behind /nccweather_fix (weather2/ folder).
--
-- New tables only; nothing existing is changed. The backend runs this file by itself when the
-- engine starts (every statement is IF NOT EXISTS). If the database user may not create tables,
-- run it once as the owner:
--   psql -U postgres -d <database> -f database/migrations/002_weather2.sql
-- Without these tables the weather page still works; only operator nodes, the learned station bias
-- and the alert history are not kept across restarts.
-- Stations come from the existing station_coords_2 table (read only).
-- =====================================================================================================

-- Extra sampling points added by an administrator on the station page.
CREATE TABLE IF NOT EXISTS weather2_nodes (
    id            SERIAL PRIMARY KEY,
    station_name  TEXT             NOT NULL,
    label         TEXT             NOT NULL,
    lat           DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon           DOUBLE PRECISION NOT NULL CHECK (lon BETWEEN -180 AND 180),
    weight        REAL             NOT NULL DEFAULT 1 CHECK (weight > 0 AND weight <= 10),
    role          TEXT             NOT NULL DEFAULT 'area' CHECK (role IN ('point', 'area')),
    active        BOOLEAN          NOT NULL DEFAULT TRUE,
    created_by    TEXT,
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS weather2_nodes_station_idx ON weather2_nodes (station_name) WHERE active;

-- Live observations (OpenWeatherMap), every WEATHER2_NOWCAST_REFRESH_MIN.
CREATE TABLE IF NOT EXISTS weather2_observations (
    station_name    TEXT        NOT NULL,
    observed_at     TIMESTAMPTZ NOT NULL,
    source          TEXT        NOT NULL DEFAULT 'openweathermap',
    condition       TEXT,
    condition_code  SMALLINT,
    description     TEXT,
    temperature     REAL, feels_like REAL, humidity REAL, pressure REAL,
    wind_speed      REAL, wind_deg REAL, wind_gust REAL,
    rain_1h         REAL, rain_3h REAL, cloudiness REAL, visibility REAL,
    PRIMARY KEY (station_name, source, observed_at)
);
CREATE INDEX IF NOT EXISTS weather2_observations_time_idx ON weather2_observations USING BRIN (observed_at);

-- Forecast vs observation pairs: the engine learns each station's bias from the last 7 days.
CREATE TABLE IF NOT EXISTS weather2_verification (
    station_name  TEXT        NOT NULL,
    valid_at      TIMESTAMPTZ NOT NULL,
    variable      TEXT        NOT NULL,
    forecast      REAL        NOT NULL,
    observed      REAL        NOT NULL,
    lead_hours    REAL,
    PRIMARY KEY (station_name, valid_at, variable)
);
CREATE INDEX IF NOT EXISTS weather2_verification_time_idx ON weather2_verification (valid_at);

-- Watches and warnings issued (one row per station, hazard and day).
CREATE TABLE IF NOT EXISTS weather2_alerts (
    id            BIGSERIAL PRIMARY KEY,
    station_name  TEXT        NOT NULL,
    hazard        TEXT        NOT NULL,
    level         SMALLINT    NOT NULL,
    onset_at      TIMESTAMPTZ NOT NULL,
    onset_day     DATE        NOT NULL,
    peak_at       TIMESTAMPTZ,
    ends_at       TIMESTAMPTZ,
    peak_value    REAL,
    message       TEXT,
    issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (station_name, hazard, onset_day)
);
CREATE INDEX IF NOT EXISTS weather2_alerts_onset_idx ON weather2_alerts (onset_at);
