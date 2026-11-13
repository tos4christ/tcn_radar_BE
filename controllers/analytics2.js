/**
 * /api2: data for the *_fix pages (history, average, profile, downtime, uptime, exports) and
 * session-protected, audited wrappers around the existing Excel downloads.
 *
 * Time convention: lines_table.time is written by bin/www as new Date(y, m, d, hour + 1, min, sec)
 * in the server's time zone, and utility/timeConverter applies the same rule to search ranges.
 * Points sent to the browser are "wall clock as UTC" (station time), so the page shows them with
 * timeZone 'UTC' and every user sees the station's own clock whatever their PC is set to.
 *
 * Load safety: read-only transactions, a 25 s statement timeout, at most 3 analytics queries at
 * once, and range limits (31 days for charts, 7 days for raw CSV).
 */
const db = require('../database/db');
const timeConverter = require('../utility/timeConverter');
const S = require('../utility/nasSession');
const lines2 = require('./lines_2');
const freq = require('./freq');
const weather = require('./weather');
const bilateral2 = require('./bilateral_2');

const DAY = 86400000;
const MAX_RANGE = 31 * DAY;
const MAX_CSV_RANGE = 7 * DAY;
const DOWNLOAD_TIMEOUT_MS = Number(process.env.NAS_DOWNLOAD_TIMEOUT_MS) || 90000;
// stored time - station wall clock (as UTC), see header.
const OFFSET = new Date(2020, 0, 1, 1, 0, 0).getTime() - Date.UTC(2020, 0, 1, 0, 0, 0);

// A column read as a number whatever its SQL type; text that is not a number becomes NULL.
const NUM = (c) => `(CASE WHEN ${c}::text ~ '^\\s*[-+]?([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE][-+]?[0-9]+)?\\s*$' THEN ${c}::text::float8 END)`;
const PARAMS = { mw: NUM('mw'), kv: NUM('kv'), amp: NUM('amp'), mvar: NUM('mvar') };
// In tcn_nas these columns are double precision, so the text test above (a cast to text and a
// regular expression on every row) is not needed: only NaN and +/-Infinity must become NULL, as
// they did above. Swap to the cheap form once the column types are known; until then, or if the
// lookup fails, or for a column that is text, the safe form stays.
const FLOAT = (c) => `NULLIF(NULLIF(NULLIF(${c}::float8, 'NaN'::float8), 'Infinity'::float8), '-Infinity'::float8)`;
const NUMERIC_TYPES = ['double precision', 'real', 'numeric', 'integer', 'bigint', 'smallint'];
let typesChecked = null;
function columnTypes() {
  if (!typesChecked) {
    typesChecked = db.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'lines_table' AND table_schema = ANY (current_schemas(false)) AND column_name = ANY ($1)`,
      [Object.keys(PARAMS)],
    ).then(({ rows }) => {
      rows.forEach((r) => { if (NUMERIC_TYPES.includes(r.data_type)) PARAMS[r.column_name] = FLOAT(r.column_name); });
    }).catch((err) => console.error('analytics2: column type lookup failed, using the text-safe form:', err.message));
  }
  return typesChecked; // never rejects
}

class BadRequest extends Error {}

// ---- input --------------------------------------------------------------------------------
const WALL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
function parseRange(q, maxRange) {
  const f = WALL.exec(String(q.from || ''));
  const t = WALL.exec(String(q.to || ''));
  if (!f || !t) throw new BadRequest('Choose a start and end date and time.');
  const { start, end } = timeConverter(`${f[1]}-${f[2]}-${f[3]}`, `${t[1]}-${t[2]}-${t[3]}`, `${f[4]}:${f[5]}`, `${t[4]}:${t[5]}`);
  const s = start.getTime();
  const e = end.getTime() + 59999; // the whole end minute
  if (!Number.isFinite(s) || !Number.isFinite(e)) throw new BadRequest('That date is not valid.');
  if (e - s > maxRange) throw new BadRequest(`Choose at most ${Math.round(maxRange / DAY)} days.`);
  return { s, e };
}
function equipment(q) {
  const station = typeof q.station === 'string' ? q.station.trim() : '';
  const line = typeof q.line === 'string' ? q.line.trim() : '';
  if (!station || !line || station.length > 80 || line.length > 80) throw new BadRequest('Choose a station and an equipment.');
  return { station, line };
}
const wall = (stored) => Number(stored) - OFFSET;

// ---- database access ----------------------------------------------------------------------
let running = 0;
const MAX_RUNNING = 3;
async function readOnly(fn) {
  if (running >= MAX_RUNNING) {
    const err = new Error('busy');
    err.status = 429;
    throw err;
  }
  running += 1;
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '25s'");
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    if (client) client.release();
    running -= 1;
  }
}

function fail(res, err, what) {
  if (err instanceof BadRequest) return res.status(400).json({ status: 'error', error: err.message });
  if (err.status === 429) return res.status(429).json({ status: 'error', error: 'The server is busy with other reports. Try again in a few seconds.' });
  if (err.code === '57014') return res.status(504).json({ status: 'error', error: 'That took too long. Choose a shorter period.' });
  console.error(`api2 ${what} failed:`, err.message);
  return res.status(500).json({ status: 'error', error: 'Could not read the data. Please try again.' });
}

// ---- catalog: stations and equipment that reported in the last 3 days ----------------------
let catalogCache = null;
const api2 = {};

api2.catalog = async (req, res) => {
  try {
    if (!catalogCache || Date.now() - catalogCache.at > 10 * 60000) {
      const rows = await readOnly(async (c) => (await c.query(
        'SELECT station, line_name, max(time) AS last FROM lines_table WHERE time > $1 GROUP BY station, line_name ORDER BY station, line_name',
        [Date.now() - 3 * DAY])).rows);
      const map = new Map();
      rows.forEach((r) => {
        if (!r.station || !r.line_name) return;
        if (!map.has(r.station)) map.set(r.station, []);
        map.get(r.station).push({ line: r.line_name, last: wall(r.last) });
      });
      catalogCache = { at: Date.now(), stations: [...map].map(([station, lines]) => ({ station, lines })) };
    }
    return res.json({ status: 'Success', data: { stations: catalogCache.stations } });
  } catch (err) {
    return fail(res, err, 'catalog');
  }
};

// ---- series: bucketed min / avg / max for history, average and profile ----------------------
const BUCKETS = [5, 10, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400];
function chooseBucket(s, e, requested) {
  const span = (e - s) / 1000;
  const min = BUCKETS.find((b) => span / b <= 5000) || 86400; // never more than 5000 points
  const r = Number(requested);
  if (BUCKETS.includes(r)) return Math.max(r, min);
  return BUCKETS.find((b) => span / b <= 600) || 86400; // auto: about 600 points
}

api2.series = async (req, res) => {
  try {
    await columnTypes();
    const { station, line } = equipment(req.query);
    const { s, e } = parseRange(req.query, MAX_RANGE);
    const bucket = chooseBucket(s, e, req.query.bucket);
    const cols = Object.entries(PARAMS).map(([k, x]) => `avg(${x}) AS ${k}_avg, min(${x}) AS ${k}_min, max(${x}) AS ${k}_max`).join(', ');
    const rows = await readOnly(async (c) => (await c.query(
      `SELECT floor((time - $5::float8) / $6::float8) * $6::float8 AS b, count(*)::int AS n, ${cols}
       FROM lines_table WHERE station = $1 AND line_name = $2 AND time BETWEEN $3 AND $4
       GROUP BY 1 ORDER BY 1`,
      [station, line, s, e, OFFSET, bucket * 1000])).rows);
    const r2 = (v) => (v === null || v === undefined ? null : Math.round(Number(v) * 1000) / 1000);
    const points = rows.map((r) => {
      const p = { t: Number(r.b), n: r.n };
      Object.keys(PARAMS).forEach((k) => { p[k] = [r2(r[`${k}_avg`]), r2(r[`${k}_min`]), r2(r[`${k}_max`])]; });
      return p;
    });
    S.audit(req, req.nasSession, 'query', { detail: { kind: req.query.kind || 'series', station, line, from: req.query.from, to: req.query.to, bucket } });
    return res.json({ status: 'Success', data: { station, line, from: wall(s), to: wall(e), bucket, points } });
  } catch (err) {
    return fail(res, err, 'series');
  }
};

// ---- stats: exact minimum / maximum (with time) and average of each parameter ---------------
api2.stats = async (req, res) => {
  try {
    await columnTypes();
    const { station, line } = equipment(req.query);
    const { s, e } = parseRange(req.query, MAX_RANGE);
    const pick = (k, dir) => `(SELECT json_build_object('v', v.${k}, 't', v.time) FROM s v WHERE v.${k} IS NOT NULL ORDER BY v.${k} ${dir}, v.time LIMIT 1) AS ${k}_${dir === 'ASC' ? 'min' : 'max'}`;
    const keys = Object.keys(PARAMS);
    // A CTE used more than once is computed once (every PostgreSQL version), so this is one scan.
    const row = await readOnly(async (c) => (await c.query(
      `WITH s AS (
         SELECT time, ${keys.map((k) => `${PARAMS[k]} AS ${k}`).join(', ')}
         FROM lines_table WHERE station = $1 AND line_name = $2 AND time BETWEEN $3 AND $4)
       SELECT (SELECT count(*)::int FROM s) AS n,
              ${keys.map((k) => `(SELECT avg(${k}) FROM s) AS ${k}_avg`).join(', ')},
              ${keys.map((k) => `${pick(k, 'ASC')}, ${pick(k, 'DESC')}`).join(', ')}`,
      [station, line, s, e])).rows[0]);
    const at = (o) => (o ? { v: Number(o.v), t: wall(o.t) } : null);
    const stats = {};
    keys.forEach((k) => {
      stats[k] = { avg: row[`${k}_avg`] === null ? null : Number(row[`${k}_avg`]), min: at(row[`${k}_min`]), max: at(row[`${k}_max`]) };
    });
    S.audit(req, req.nasSession, 'query', { detail: { kind: 'profile', station, line, from: req.query.from, to: req.query.to } });
    return res.json({ status: 'Success', data: { station, line, from: wall(s), to: wall(e), samples: row.n, stats } });
  } catch (err) {
    return fail(res, err, 'stats');
  }
};

// ---- availability: equipment in service, out of service, or not reporting --------------------
// Out of service = MW and kV both zero (the rule the old /downtime used). A silence longer than
// the gap setting is "no data" (meter or link down), reported separately from an outage.
api2.availability = async (req, res) => {
  try {
    await columnTypes();
    const { station, line } = equipment(req.query);
    const { s, e } = parseRange(req.query, MAX_RANGE);
    const gapSec = [15, 30, 60, 120, 300, 900].includes(Number(req.query.gap)) ? Number(req.query.gap) : 60;
    const gap = gapSec * 1000;
    const runs = await readOnly(async (c) => (await c.query(
      `WITH s AS (
         SELECT time, (coalesce(abs(${PARAMS.mw}), 0) < 0.001 AND coalesce(abs(${PARAMS.kv}), 0) < 0.001) AS out
         FROM lines_table WHERE station = $1 AND line_name = $2 AND time BETWEEN $3 AND $4),
       g AS (SELECT time, out, lag(time) OVER w AS pt, lag(out) OVER w AS pout FROM s WINDOW w AS (ORDER BY time)),
       r AS (SELECT time, out, sum(CASE WHEN pt IS NULL OR out IS DISTINCT FROM pout OR time - pt > $5 THEN 1 ELSE 0 END) OVER (ORDER BY time) AS grp FROM g)
       SELECT out, min(time) AS t0, max(time) AS t1, count(*)::int AS n FROM r GROUP BY grp, out ORDER BY 2 LIMIT 20001`,
      [station, line, s, e, gap])).rows);
    if (runs.length > 20000) throw new BadRequest('This equipment changed state too often in that period to list. Choose a shorter period.');

    // Build a gap-free timeline from s to end. A state lasts until the next reading, unless the
    // silence before that reading is longer than the gap setting, which becomes "no data".
    // "now" as bin/www would store it (local clock with the hour + 1): the future is not "no data"
    const end = Math.max(s, Math.min(e, Date.now() + 3600000));
    const segs = [];
    let cursor = s;
    runs.forEach((r) => {
      const state = r.out ? 'out' : 'up';
      const t0 = Number(r.t0);
      const t1 = Number(r.t1);
      let from = t0;
      if (t0 - cursor > gap) segs.push({ state: 'nodata', from: cursor, to: t0 });
      else if (segs.length) segs[segs.length - 1].to = t0; // the previous state lasted until now
      else from = s; // first reading arrived within the gap of the start
      segs.push({ state, from, to: t1 });
      cursor = t1;
    });
    if (!segs.length) segs.push({ state: 'nodata', from: s, to: end });
    else if (end - cursor > gap) segs.push({ state: 'nodata', from: cursor, to: end });
    else segs[segs.length - 1].to = Math.max(segs[segs.length - 1].to, end);

    // Join neighbours in the same state; drop zero-length pieces (a lone reading before a silence).
    const final = [];
    segs.filter((g) => g.to > g.from).forEach((g) => {
      const last = final[final.length - 1];
      if (last && last.state === g.state && g.from <= last.to) last.to = Math.max(last.to, g.to);
      else final.push({ ...g });
    });
    const totals = { up: 0, out: 0, nodata: 0 };
    final.forEach((g) => { totals[g.state] += g.to - g.from; });
    S.audit(req, req.nasSession, 'query', { detail: { kind: req.query.kind || 'availability', station, line, from: req.query.from, to: req.query.to, gap: gapSec } });
    return res.json({
      status: 'Success',
      data: {
        station, line, from: wall(s), to: wall(end), gap: gapSec, totals,
        segments: final.map((g) => ({ state: g.state, from: wall(g.from), to: wall(g.to) })),
      },
    });
  } catch (err) {
    return fail(res, err, 'availability');
  }
};

// ---- raw readings as CSV ----------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const wallText = (t) => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
const csvCell = (v) => (v === null || v === undefined ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

api2.exportCsv = async (req, res) => {
  try {
    await columnTypes();
    const { station, line } = equipment(req.query);
    const { s, e } = parseRange(req.query, MAX_CSV_RANGE);
    const rows = await readOnly(async (c) => (await c.query(
      `SELECT time, ${Object.entries(PARAMS).map(([k, x]) => `${x} AS ${k}`).join(', ')}
       FROM lines_table WHERE station = $1 AND line_name = $2 AND time BETWEEN $3 AND $4 ORDER BY time LIMIT 400000`,
      [station, line, s, e])).rows);
    const out = ['station,equipment,station_time,mw,kv,amp,mvar'];
    rows.forEach((r) => out.push([station, line, wallText(wall(r.time)), r.mw, r.kv, r.amp, r.mvar].map(csvCell).join(',')));
    S.audit(req, req.nasSession, 'export', { detail: { kind: 'csv', station, line, from: req.query.from, to: req.query.to, rows: rows.length } });
    const name = `${station}_${line}_${String(req.query.from).slice(0, 10)}.csv`.replace(/[^A-Za-z0-9_.-]/g, '_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    return res.send(out.join('\n'));
  } catch (err) {
    return fail(res, err, 'export');
  }
};

// ---- the existing Excel downloads, behind the session and written to the audit log ------------
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const downloads = {
  tem: (req, res) => lines2.getdaily(req, res),
  voltageprofile: (req, res) => lines2.gethourlyvoltage(req, res),
  frequency: (req, res, next) => freq.getFrequency(req, res, next),
  weather: (req, res, next) => weather.getWeather_report(req, res, next),
  bilateral: (req, res) => bilateral2.hourly(req, res),
  collapse: (req, res) => lines2.getcollapse(req, res),
};
/** Why a download request cannot run, or null. */
function downloadProblem(kind, b) {
  if (kind !== 'collapse') return DATE.test(String(b.startDate || '')) ? null : 'Choose a date.';
  if (![b.startDate, b.endDate].every((d) => DATE.test(String(d || ''))) || ![b.startTime, b.endTime].every((t) => TIME.test(String(t || '')))) {
    return 'Choose a start and end date and time.';
  }
  const { start, end } = timeConverter(b.startDate, b.endDate, b.startTime, b.endTime);
  return end.getTime() - start.getTime() > 2 * 3600000 ? 'Choose at most 2 hours.' : null;
}
api2.download = (req, res, next) => {
  const kind = req.params.kind;
  const run = downloads[kind];
  if (!run) return res.status(404).json({ status: 'error', error: 'Unknown download.' });
  const b = req.body || {};
  const problem = downloadProblem(kind, b);
  if (problem) return res.status(400).json({ status: 'error', error: problem });
  S.audit(req, req.nasSession, 'download', { detail: { kind, startDate: b.startDate, endDate: b.endDate, startTime: b.startTime, endTime: b.endTime } });
  // The old report controllers never answer when their query fails (no .catch): answer for them,
  // so the page shows an error instead of waiting forever.
  const watchdog = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ status: 'error', error: 'The report could not be made. Try again, or choose another date.' });
  }, DOWNLOAD_TIMEOUT_MS);
  const done = () => clearTimeout(watchdog);
  res.on('finish', done);
  res.on('close', done);
  const failed = (err) => {
    done();
    if (!res.headersSent) fail(res, err, `download ${kind}`);
  };
  try {
    return Promise.resolve(run(req, res, next)).catch(failed);
  } catch (err) {
    return failed(err);
  }
};

module.exports = api2;
