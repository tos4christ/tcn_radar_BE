/**
 * /api2/weather/* - the weather centre of /nccweather_fix (routes/api2.js).
 * Signed-in NCC users (server session) read; administrators add or remove sampling nodes.
 */
const XLSX = require('xlsx');
const engine = require('./engine');
const repo = require('./repository');
const cfg = require('./config');
const { fmtParts } = require('./rainfall');
const { LABELS, THRESHOLDS } = require('./risk');
const S = require('../utility/nasSession');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ok = (res, data, status = 200) => res.status(status).json({ status: 'Success', data });

/** Wraps a handler: errors become { status: 'error', error } with a safe message. */
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status >= 500 && status !== 502 && status !== 503) console.error('[weather2]', req.method, req.path, err.message);
    if (!res.headersSent) {
      res.status(status).json({ status: 'error', error: status === 500 ? 'The weather service had a problem. Try again.' : err.message });
    }
  }
};

const nameParam = (req) => String(req.params.name || '').slice(0, 200);

async function overview(req, res) {
  ok(res, engine.overview());
}

async function station(req, res) {
  const detail = engine.stationDetail(nameParam(req));
  if (!detail) throw new HttpError(404, 'Unknown station.');
  ok(res, detail);
}

async function alerts(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
  ok(res, { active: engine.alerts, history: await repo.alertHistory(days) });
}

async function status(req, res) {
  ok(res, { ...engine.statusReport(), skill: await repo.verificationStats(7) });
}

async function meta(req, res) {
  ok(res, { levels: LABELS, thresholds: THRESHOLDS, timezone: cfg.timezone });
}

async function point(req, res) {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (req.query.lat === undefined || req.query.lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon)
    || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new HttpError(400, 'lat and lon are required.');
  }
  if (!cfg.enabled) throw new HttpError(503, 'The weather engine is off (WEATHER2_ENABLED=false).');
  const radius = Math.min(Math.max(Number(req.query.radiusKm) || cfg.ringRadiusKm, 2), 60);
  ok(res, await engine.pointForecast(lat, lon, { label: 'Point on the map', radiusKm: radius }));
}

async function refresh(req, res) {
  if (!cfg.enabled) throw new HttpError(503, 'The weather engine is off (WEATHER2_ENABLED=false).');
  engine.forecastCycle().catch(() => {});
  S.audit(req, req.nasSession, 'weather_refresh');
  ok(res, { message: 'Forecast refresh started.' });
}

/* ------------------------------------------------------------ custom nodes */
function validNode(b) {
  const out = {};
  const label = String(b.label === undefined || b.label === null ? '' : b.label).trim();
  if (!label) throw new HttpError(400, 'Give the node a label.');
  out.label = label.slice(0, 80);
  for (const [k, lim] of [['lat', 90], ['lon', 180]]) {
    const v = Number(b[k]);
    if (b[k] === undefined || b[k] === null || b[k] === '' || !Number.isFinite(v) || Math.abs(v) > lim) throw new HttpError(400, `${k} is invalid.`);
    out[k] = v;
  }
  if (b.weight !== undefined && b.weight !== null && b.weight !== '') {
    const w = Number(b.weight);
    if (!(w > 0 && w <= 10)) throw new HttpError(400, 'Weight must be more than 0 and at most 10.');
    out.weight = w;
  }
  if (b.role !== undefined) {
    if (!['point', 'area'].includes(b.role)) throw new HttpError(400, "Role must be 'point' or 'area'.");
    out.role = b.role;
  }
  return out;
}

async function createNode(req, res) {
  const st = engine.station(nameParam(req));
  if (!st) throw new HttpError(404, 'Unknown station.');
  const fields = validNode(req.body || {});
  const node = await repo.createNode({ station: st.name, ...fields, createdBy: req.nasSession.email });
  S.audit(req, req.nasSession, 'weather_node_add', { detail: { station: st.name, id: node.id, label: node.label, lat: node.lat, lon: node.lon } });
  const detail = await engine.refreshStation(st.key);
  ok(res, { node, station: detail }, 201);
}

async function deleteNode(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid node.');
  const stationName = await repo.deleteNode(id);
  if (!stationName) throw new HttpError(404, 'Unknown node.');
  S.audit(req, req.nasSession, 'weather_node_remove', { detail: { station: stationName, id } });
  ok(res, { station: await engine.refreshStation(stationName) });
}

/* ------------------------------------------------------------------ report */
/** Next hours of risk, rain windows and hourly values for every station, as an Excel file. */
async function forecastReport(req, res) {
  const tz = cfg.timezone;
  const hours = Math.min(Math.max(Number((req.body || {}).hours) || 72, 6), 168);
  const summary = [];
  const windows = [];
  const hourly = [];
  const nowSec = Date.now() / 1000;
  for (const s of engine.stations) {
    const p = engine.products.get(s.key);
    if (!p) continue;
    summary.push({
      STATION: s.name, TYPE: s.type, RISK_24H: p.summary.label24h, DRIVERS: p.summary.drivers24h.join(', '),
      MAX_24H_RAIN_MM: p.summary.rain24hMax.total, MAX_THUNDER_SCORE: p.summary.maxThunderScore24h,
      TEMP_NOW: p.current.temperature, CONDITION_NOW: p.current.condition, ALERTS: p.summary.alerts.length,
    });
    for (const w of p.rainWindows) {
      const a = fmtParts(w.start, tz);
      const b = fmtParts(w.end, tz);
      windows.push({
        STATION: s.name, START: `${a.date} ${a.time}`, END: `${b.date} ${b.time}`, HOURS: w.hours,
        TOTAL_MM: w.total, PEAK_MM_H: w.peakRate, MAX_POP: w.maxPop, MAX_POP_AREA: w.maxPopArea, THUNDER: w.thunder ? 'yes' : 'no',
      });
    }
    for (const h of p.hourly.filter((x) => x.t >= nowSec - 3600).slice(0, hours)) {
      const t = fmtParts(h.t, tz);
      hourly.push({
        STATION: s.name, DATE: t.date, TIME: t.time, TEMP_C: h.temperature, RH: h.humidity, RAIN_MM: h.precipitation,
        RAIN_AREA_MAX_MM: h.precipAreaMax, POP: h.pop, POP_AREA: h.popArea, WIND_MS: h.windSpeed, GUST_AREA_MAX: h.gustAreaMax,
        CAPE: h.cape, CONDITION: h.condition, RISK: LABELS[h.riskLevel], DRIVERS: h.riskDrivers.join(', '), CONFIDENCE: h.confidence,
      });
    }
  }
  if (!summary.length) throw new HttpError(503, 'No forecast yet. The first forecast run is still going; try again in a minute.');
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of [['Summary', summary], ['Rain windows', windows], ['Hourly', hourly]]) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ NOTE: 'Nothing in this period' }]), name);
  }
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  S.audit(req, req.nasSession, 'download', { detail: { kind: 'weather_forecast', hours } });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="weather_forecast_${day}.xlsx"`);
  res.send(buf);
}

module.exports = {
  overview: wrap(overview),
  station: wrap(station),
  alerts: wrap(alerts),
  status: wrap(status),
  meta: wrap(meta),
  point: wrap(point),
  refresh: wrap(refresh),
  createNode: wrap(createNode),
  deleteNode: wrap(deleteNode),
  forecastReport: wrap(forecastReport),
};
