/**
 * Service switches set by an administrator on the Admin page (/admin, /admin_fix), kept in the
 * nas_service_settings table (database/migrations/006_service_settings.sql).
 *
 *   weather: { suspended, message, since, by }  - "Weather API subscription expired" switch.
 *     While suspended: weatherGuard answers 503 { code: 'weather_suspended' } on the live weather
 *     endpoints, and the weather engine (weather2/engine.js) makes no provider calls.
 *
 * Reads are cached for 15 s. If the database cannot be read, the last value read is kept (so a
 * database hiccup neither turns weather back on nor off); before the first good read, weather is on.
 */
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const CACHE_MS = 15000;
const MESSAGE_MAX = 300;
const DEFAULT_MESSAGE = 'The weather data subscription has expired. Live weather is paused until the subscription is renewed.';

let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', '006_service_settings.sql'), 'utf8');
    tableReady = db.query(sql).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

const OFF = Object.freeze({ suspended: false, message: null, since: null, by: null });
let weather = OFF;
let readAt = 0;
let reading = null;

function normalise(v) {
  if (!v || typeof v !== 'object' || v.suspended !== true) return OFF;
  const message = typeof v.message === 'string' && v.message.trim() ? v.message.trim().slice(0, MESSAGE_MAX) : DEFAULT_MESSAGE;
  return { suspended: true, message, since: typeof v.since === 'string' ? v.since : null, by: typeof v.by === 'string' ? v.by : null };
}

/** Current weather switch: { suspended, message, since, by }. Never throws. */
async function getWeather() {
  if (Date.now() - readAt < CACHE_MS) return weather;
  if (!reading) {
    reading = db.query("SELECT value FROM nas_service_settings WHERE key = 'weather'")
      .then((r) => { weather = normalise(r.rows[0] && r.rows[0].value); readAt = Date.now(); })
      .catch((err) => {
        // 42P01: the table does not exist yet, so nothing was ever switched off.
        if (err.code === '42P01') { weather = OFF; readAt = Date.now(); return; }
        console.error('service settings read failed (keeping the last value):', err.message);
        readAt = Date.now() - CACHE_MS + 5000; // try again in 5 s
      })
      .finally(() => { reading = null; });
  }
  await reading;
  return weather;
}

async function weatherSuspended() {
  return (await getWeather()).suspended;
}

/** Saves the switch. Throws when it cannot be saved (the caller answers 503). */
async function setWeather({ suspended, message }, by) {
  // Changing only the message of a suspension keeps its start time.
  const prev = suspended ? await getWeather() : OFF;
  const value = suspended
    ? {
      suspended: true,
      message: typeof message === 'string' && message.trim() ? message.trim().slice(0, MESSAGE_MAX) : DEFAULT_MESSAGE,
      since: prev.suspended && prev.since ? prev.since : new Date().toISOString(),
      by: by || null,
    }
    : { suspended: false };
  await ensureTable();
  await db.query(
    `INSERT INTO nas_service_settings (key, value, updated_at, updated_by) VALUES ('weather', $1::jsonb, now(), $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
    [JSON.stringify(value), by || null],
  );
  weather = normalise(value);
  readAt = Date.now();
  return weather;
}

/** Express middleware for the live weather endpoints. */
function weatherGuard(req, res, next) {
  getWeather().then((w) => {
    if (!w.suspended) return next();
    return res.status(503).json({ status: 'error', code: 'weather_suspended', error: w.message, since: w.since });
  }, next);
}

/** What any visitor may see (no e-mail of who switched it). */
function publicWeather(w) {
  return { suspended: w.suspended, message: w.suspended ? w.message : null, since: w.suspended ? w.since : null };
}

module.exports = { getWeather, weatherSuspended, setWeather, weatherGuard, publicWeather, MESSAGE_MAX, DEFAULT_MESSAGE };
