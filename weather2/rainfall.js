/**
 * Rainfall event timelines.
 *
 * observedRainEvents(): rebuild of the old sortWeather() behind the "Weather report" Excel.
 * Output columns are kept identical (plus PEAK_RAIN_1H / STATUS appended). Fixed:
 *   - the sort comparator returned a boolean, so rows were effectively unsorted
 *   - rain still falling at the last sample of the day was silently dropped
 *   - END_DATE always repeated the start date
 *   - drizzle and thunderstorm observations now count as rain
 *
 * forecastRainWindows(): contiguous forecast hours likely to be wet.
 */
const { isNum } = require('./fusion');

const RAINY = new Set(['Rain', 'Drizzle', 'Thunderstorm']);
const pad = (n) => String(n).padStart(2, '0');

function fmtParts(epochSec, timeZone) {
  const d = new Date(epochSec * 1000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d).map((p) => [p.type, p.value]));
  // Unpadded d-m-yyyy / h:m:s — the exact format the v1 report produced.
  return {
    date: `${Number(parts.day)}-${Number(parts.month)}-${parts.year}`,
    time: `${Number(parts.hour) % 24}:${Number(parts.minute)}:${Number(parts.second)}`,
  };
}

/**
 * @param rows  [{ station_name, time (epoch s), main_weather, main_temperature, rain_volume_1h, main_humidity, wind_speed }]
 * @returns     [{ [station]: [event rows] }]  — same shape the Excel writer used before
 */
function observedRainEvents(rows, { timeZone = 'Africa/Lagos', stationOrder = null } = {}) {
  const byStation = new Map();
  for (const r of rows) {
    if (!byStation.has(r.station_name)) byStation.set(r.station_name, []);
    byStation.get(r.station_name).push(r);
  }
  const names = stationOrder ? stationOrder.filter((n) => byStation.has(n)) : [...byStation.keys()].sort();
  const out = [];
  for (const name of names) {
    const list = byStation.get(name).sort((a, b) => Number(a.time) - Number(b.time));
    const events = [];
    let open = null;
    list.forEach((r, i) => {
      const wet = RAINY.has(r.main_weather);
      if (wet && !open) open = { start: Number(r.time), peak: Number(r.rain_volume_1h) || 0, last: r };
      if (wet && open) {
        open.peak = Math.max(open.peak, Number(r.rain_volume_1h) || 0);
        open.last = r;
      }
      const ended = open && !wet;
      const lastSample = open && i === list.length - 1;
      if (ended || lastSample) {
        const end = ended ? Number(r.time) : Number(open.last.time);
        const s = fmtParts(open.start, timeZone);
        const e = fmtParts(end, timeZone);
        events.push({
          START_DATE: s.date,
          START_TIME: s.time,
          START_MW: ' ',
          END_DATE: e.date,
          END_TIME: e.time,
          END_MW: ' ',
          duration_of_rainfall: `${Math.round((end - open.start) / 60)} minutes`,
          MAIN_TEMP: open.last.main_temperature,
          RAIN_VOLUME_1H: open.last.rain_volume_1h,
          HUMIDITY: open.last.main_humidity,
          WIND_SPEED: open.last.wind_speed,
          MW_INTERRUPTED: ' ',
          PEAK_RAIN_1H: Math.round(open.peak * 100) / 100,
          STATUS: ended ? 'ended' : 'ongoing at last observation',
        });
        open = null;
      }
    });
    out.push({ [name]: events });
  }
  return out;
}

/** Contiguous wet windows in a forecast (pop ≥ popMin or precip ≥ mmMin). */
function forecastRainWindows(times, s, { popMin = 50, mmMin = 0.5, fromSec = Date.now() / 1000 } = {}) {
  const windows = [];
  let cur = null;
  times.forEach((t, i) => {
    if (t < fromSec - 3600) return;
    const wet = (isNum(s.pop[i]) && s.pop[i] >= popMin) || (isNum(s.precipitation[i]) && s.precipitation[i] >= mmMin);
    if (wet) {
      if (!cur) cur = { start: t, end: t + 3600, total: 0, peakRate: 0, maxPop: 0, maxPopArea: 0, thunder: false };
      cur.end = t + 3600;
      cur.total += s.precipitation[i] || 0;
      cur.peakRate = Math.max(cur.peakRate, s.precipitation[i] || 0);
      cur.maxPop = Math.max(cur.maxPop, s.pop[i] || 0);
      cur.maxPopArea = Math.max(cur.maxPopArea, s.popArea[i] || 0);
      cur.thunder = cur.thunder || (s.weatherCode[i] >= 95);
    } else if (cur) {
      windows.push(cur);
      cur = null;
    }
  });
  if (cur) windows.push(cur);
  return windows.map((w) => ({
    ...w,
    total: Math.round(w.total * 10) / 10,
    peakRate: Math.round(w.peakRate * 10) / 10,
    maxPop: Math.round(w.maxPop),
    maxPopArea: Math.round(w.maxPopArea),
    hours: Math.round((w.end - w.start) / 3600),
  }));
}

module.exports = { observedRainEvents, forecastRainWindows, fmtParts, RAINY, pad };
