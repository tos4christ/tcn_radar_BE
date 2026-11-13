-- Server-side sign-in sessions and the audit trail for the *_fix pages (/auth2, /api2).
-- Safe to run more than once. The server also runs it on first use of /auth2, so running it by
-- hand is only needed when the database user the app connects with may not CREATE tables.
--
--   psql "<connection>" -f database/migrations/001_nas_auth_audit.sql

-- One row per sign-in. The browser only holds a random id in an HttpOnly cookie; this table
-- holds a SHA-256 of it, so a leaked table cannot be replayed as a cookie.
CREATE TABLE IF NOT EXISTS nas_sessions (
    id              BIGSERIAL PRIMARY KEY,
    token_hash      TEXT        NOT NULL UNIQUE,
    realm           TEXT        NOT NULL,                 -- 'ncc' (users) | 'bilateral' (bilateral_users)
    kind            TEXT        NOT NULL DEFAULT 'user',  -- 'user' | 'kiosk' (grid page one/two: never expires)
    email           TEXT        NOT NULL,
    name            TEXT,
    role            TEXT,
    ip              TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,                          -- NULL = no expiry (kiosk)
    revoked_at      TIMESTAMPTZ,
    revoked_reason  TEXT
);
CREATE INDEX IF NOT EXISTS nas_sessions_open_idx ON nas_sessions (email) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS nas_sessions_created_idx ON nas_sessions (created_at DESC);

-- Everything people do: sign in, failed sign in, sign out, pages opened, queries, downloads.
CREATE TABLE IF NOT EXISTS nas_audit_log (
    id          BIGSERIAL PRIMARY KEY,
    at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_id  BIGINT,
    realm       TEXT,
    email       TEXT,
    name        TEXT,
    action      TEXT        NOT NULL,
    path        TEXT,
    detail      JSONB,
    ip          TEXT,
    user_agent  TEXT
);
CREATE INDEX IF NOT EXISTS nas_audit_log_at_idx       ON nas_audit_log (at DESC);
CREATE INDEX IF NOT EXISTS nas_audit_log_email_at_idx ON nas_audit_log (email, at DESC);
CREATE INDEX IF NOT EXISTS nas_audit_log_action_at_idx ON nas_audit_log (action, at DESC);
