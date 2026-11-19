/**
 * Database side of the weather engine.
 *   - Stations: the existing station_coords_2 table (read only), as the old /nccweather page.
 *   - Own tables: weather2_* (database/migrations/002_weather2.sql), created on start when allowed.
 * Every call except node editing tolerates a missing table or a database that is down: the engine
 * keeps working from memory and the page keeps showing the forecast.
 */
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const config = require('./config');
const logger = require('./log');

const log = logger.child('weather2:db');
const HYDRO_RE = /kainji|jebba|shiroro|zungeru|dadin\s*kowa|dadinkowa/i;

let tablesOk = false;

async function safe(label, fn, fallback = null) {
  try {
    return await fn();
  } catch (err) {
    if (logger.every(`repo:${label}:${err.code || err.message}`, 10 * 60000)) log.error(`${label}:`, err.message);
    return fallback;
  }
}

/** Creates the weather2_* tables if they are missing. Never throws. */
async function ensureTables() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', '002_weather2.sql'), 'utf8');
    await db.query(sql);
    tablesOk = true;
  } catch (err) {
    tablesOk = false;
    log.warn(`weather2 tables not ready (${err.message}). The forecast works; run database/migrations/002_weather2.sql as the table owner to keep nodes, bias and alert history.`);
  }
  return tablesOk;
}

function stationsFromFile() {
  const file = config.stationsFile;
  if (!file) return [];
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'));
  } catch (err) {
    log.error(`WEATHER2_STATIONS_FILE unreadable: ${err.message}`);
    return [];
  }
}

/** Stations with coordinates; duplicate names keep the first row. */
async function listStations() {
  const dbRows = await safe('listStations', async () => {
    const { rows } = await db.query('SELECT id, name, type, lat, long FROM station_coords_2 ORDER BY name, id');
    return rows;
  }, null);
  const rows = dbRows && dbRows.length ? dbRows : stationsFromFile();
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const lat = Number(r.lat);
    const lon = Number(r.lon !== undefined && r.lon !== null ? r.lon : r.long);
    const name = String(r.name || '').trim();
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    if (lat === 0 && lon === 0) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      id: r.id === undefined ? null : r.id, key: name, name,
      type: String(r.type || 'transmission').trim().toUpperCase() || 'TRANSMISSION',
      lat, lon, isHydro: HYDRO_RE.test(name),
    });
  }
  return out;
}

async function listCustomNodes() {
  if (!tablesOk) return [];
  return safe('listCustomNodes', async () => {
    const { rows } = await db.query(
      `SELECT id, station_name, label, lat, lon, weight, role FROM weather2_nodes
        WHERE active ORDER BY station_name, id`,
    );
    return rows;
  }, []);
}

function needTables() {
  if (!tablesOk) {
    const err = new Error('Extra nodes need the weather2 tables. Run database/migrations/002_weather2.sql as the table owner.');
    err.status = 503;
    throw err;
  }
}

async function createNode({ station, label, lat, lon, weight = 1, role = 'area', createdBy }) {
  needTables();
  const { rows } = await db.query(
    `INSERT INTO weather2_nodes (station_name, label, lat, lon, weight, role, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, station_name, label, lat, lon, weight, role`,
    [station, label, lat, lon, weight, role, createdBy || null],
  );
  return rows[0];
}

/** Hides the node (kept for the record). Returns the station name, or null if there is no such node. */
async function deleteNode(id) {
  needTables();
  const { rows } = await db.query('UPDATE weather2_nodes SET active = false WHERE id = $1 AND active RETURNING station_name', [id]);
  return rows[0] ? rows[0].station_name : null;
}

/* ------------------------------------------------------------------ observations */
async function saveObservations(entries) {
  if (!tablesOk || !entries.length) return;
  await safe('saveObservations', async () => {
    const cols = ['station_name', 'observed_at', 'source', 'condition', 'condition_code', 'description',
      'temperature', 'feels_like', 'humidity', 'pressure', 'wind_speed', 'wind_deg', 'wind_gust', 'rain_1h',
      'rain_3h', 'cloudiness', 'visibility'];
    const values = [];
    const tuples = entries.map(({ station, obs }, i) => {
      values.push(station, obs.observedAt, 'openweathermap', obs.condition, obs.weatherCode, obs.description,
        obs.temperature, obs.feelsLike, obs.humidity, obs.pressure, obs.windSpeed, obs.windDeg,
        obs.windGust, obs.rain1h, obs.rain3h, obs.cloudiness, obs.visibility);
      return `(${cols.map((_, c) => `$${i * cols.length + c + 1}`).join(',')})`;
    });
    await db.query(`INSERT INTO weather2_observations (${cols.join(',')}) VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`, values);
  });
}

/* ------------------------------------------------------------------ verification */
async function saveVerification(pairs) {
  if (!tablesOk || !pairs.length) return;
  await safe('saveVerification', async () => {
    const values = [];
    const tuples = pairs.map((p, i) => {
      values.push(p.station, p.validAt, p.variable, p.forecast, p.observed, p.leadHours);
      return `($${i * 6 + 1},$${i * 6 + 2},$${i * 6 + 3},$${i * 6 + 4},$${i * 6 + 5},$${i * 6 + 6})`;
    });
    await db.query(
      `INSERT INTO weather2_verification (station_name, valid_at, variable, forecast, observed, lead_hours)
       VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`,
      values,
    );
  });
}

async function recentVerification(days = 7) {
  if (!tablesOk) return [];
  return safe('recentVerification', async () => {
    const { rows } = await db.query(
      `SELECT station_name, variable, forecast, observed FROM weather2_verification
        WHERE valid_at > now() - ($1::int * interval '1 day')`,
      [days],
    );
    return rows;
  }, []);
}

async function verificationStats(days = 7) {
  if (!tablesOk) return [];
  return safe('verificationStats', async () => {
    const { rows } = await db.query(
      `SELECT station_name, variable, count(*)::int AS n,
              round(avg(abs(forecast - observed))::numeric, 2)::float8 AS mae,
              round(avg(forecast - observed)::numeric, 2)::float8 AS bias
         FROM weather2_verification
        WHERE valid_at > now() - ($1::int * interval '1 day')
        GROUP BY 1, 2 ORDER BY 1, 2`,
      [days],
    );
    return rows;
  }, []);
}

/** Verification pairs are only needed for the last 7 days; keep 60 for reference. */
async function pruneVerification() {
  if (!tablesOk) return;
  await safe('pruneVerification', () => db.query("DELETE FROM weather2_verification WHERE valid_at < now() - interval '60 days'"));
}

/* ------------------------------------------------------------------------ alerts */
async function saveAlerts(alerts, timeZone) {
  if (!tablesOk || !alerts.length) return;
  await safe('saveAlerts', async () => {
    const fmtDay = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    for (const a of alerts) {
      const onset = new Date(a.onset * 1000);
      await db.query(
        `INSERT INTO weather2_alerts (station_name, hazard, level, onset_at, onset_day, peak_at, ends_at, peak_value, message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (station_name, hazard, onset_day) DO UPDATE SET
           level = GREATEST(weather2_alerts.level, EXCLUDED.level), peak_at = EXCLUDED.peak_at,
           ends_at = EXCLUDED.ends_at, peak_value = EXCLUDED.peak_value, message = EXCLUDED.message, updated_at = now()`,
        [a.station, a.hazard, a.level, onset, fmtDay.format(onset), new Date(a.peak * 1000), new Date(a.ends * 1000), a.peakValue, a.message],
      );
    }
  });
}

async function alertHistory(days = 14) {
  if (!tablesOk) return [];
  return safe('alertHistory', async () => {
    const { rows } = await db.query(
      `SELECT station_name, hazard, level, onset_at, peak_at, ends_at, peak_value, message, issued_at
         FROM weather2_alerts
        WHERE onset_at > now() - ($1::int * interval '1 day') ORDER BY onset_at DESC LIMIT 500`,
      [days],
    );
    return rows;
  }, []);
}

/* ------------------------------------------------------------------ observed weather report */
/**
 * Observations for one local day, in the row shape observedRainEvents() takes.
 * New readings come from weather2_observations (written by this engine). The old collector's
 * weather_table is read as well, for days before the switch; a station uses the old rows only on
 * a day the engine has nothing for it, so the two sources are never interleaved.
 * Tables that do not exist are skipped. Returns { rows, sources }.
 */
async function observationsForDay(day, timeZone = config.timezone) {
  const { rows: [have] } = await db.query(
    "SELECT to_regclass('public.weather2_observations') IS NOT NULL AS new_t, to_regclass('public.weather_table') IS NOT NULL AS old_t",
  );
  let fresh = [];
  if (have.new_t) {
    ({ rows: fresh } = await db.query(
      `SELECT station_name, EXTRACT(EPOCH FROM observed_at)::bigint AS time, condition AS main_weather,
              temperature AS main_temperature, rain_1h AS rain_volume_1h, humidity AS main_humidity, wind_speed
         FROM weather2_observations
        WHERE observed_at >= ($1::date::timestamp AT TIME ZONE $2)
          AND observed_at <  (($1::date + 1)::timestamp AT TIME ZONE $2)
        ORDER BY station_name, observed_at`,
      [day, timeZone],
    ));
  }
  let old = [];
  if (have.old_t) {
    ({ rows: old } = await db.query(
      `SELECT DISTINCT station_name, time, main_weather, main_temperature, rain_volume_1h, main_humidity, wind_speed
         FROM weather_table WHERE date = $1`,
      [day],
    ));
    const covered = new Set(fresh.map((r) => r.station_name));
    old = old.filter((r) => !covered.has(r.station_name) && Number.isFinite(Number(r.time)));
  }
  const rows = [...fresh, ...old].map((r) => ({ ...r, time: Number(r.time) }));
  return { rows, sources: { engine: fresh.length, legacy: old.length, engineTable: have.new_t, legacyTable: have.old_t } };
}

module.exports = {
  observationsForDay,
  ensureTables, tablesReady: () => tablesOk,
  listStations, listCustomNodes, createNode, deleteNode,
  saveObservations, saveVerification, recentVerification, verificationStats, pruneVerification,
  saveAlerts, alertHistory, HYDRO_RE,
};
