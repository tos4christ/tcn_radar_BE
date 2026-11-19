/**
 * Open-Meteo forecast provider. One HTTP request covers up to CHUNK coordinates for one
 * NWP model, so every node of every station is fetched with a handful of calls.
 * Docs: https://open-meteo.com/en/docs
 */
const { getJson, mapLimit } = require('../http');

const HOURLY = [
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
  'precipitation_probability', 'precipitation', 'weather_code', 'pressure_msl', 'cloud_cover',
  'visibility', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'cape', 'lifted_index',
  'is_day',
];
const DAILY = ['sunrise', 'sunset', 'uv_index_max'];

/** Canonical field names used by the fusion engine. */
const FIELD_MAP = {
  temperature_2m: 'temperature',
  relative_humidity_2m: 'humidity',
  dew_point_2m: 'dewPoint',
  apparent_temperature: 'apparent',
  precipitation_probability: 'pop',
  precipitation: 'precipitation',
  weather_code: 'weatherCode',
  pressure_msl: 'pressure',
  cloud_cover: 'cloudCover',
  visibility: 'visibility',
  wind_speed_10m: 'windSpeed',
  wind_direction_10m: 'windDeg',
  wind_gusts_10m: 'windGust',
  cape: 'cape',
  lifted_index: 'liftedIndex',
  is_day: 'isDay',
};

const CHUNK = 40;

/*
 * Open-Meteo counts every coordinate as a call (x2 when more than 10 variables are asked
 * for), and the free tier allows 600 calls per minute. 60 stations x 5 nodes = 300
 * coordinates = ~600 calls per cycle, so requests are paced through a rolling one-minute
 * budget instead of being fired all at once. Shared by forecast cycles and point forecasts.
 */
const spent = []; // [{ at, cost }]
async function takeBudget(cost, perMinute) {
  if (!perMinute) return;
  for (;;) {
    const now = Date.now();
    while (spent.length && now - spent[0].at >= 60000) spent.shift();
    const used = spent.reduce((a, s) => a + s.cost, 0);
    if (!spent.length || used + cost <= perMinute) {
      spent.push({ at: now, cost });
      return;
    }
    await new Promise((r) => setTimeout(r, 60000 - (now - spent[0].at) + 250));
  }
}
const callWeight = (days) => Math.ceil((HOURLY.length + DAILY.length) / 10) * Math.max(1, Math.ceil(days / 14));

function baseUrl(apiKey) {
  return apiKey ? 'https://customer-api.open-meteo.com/v1/forecast' : 'https://api.open-meteo.com/v1/forecast';
}

/** Normalise one location's response into { time: number[] (unix s), fields: {canonical: array} , daily } */
function normalise(loc) {
  const hourly = loc.hourly || {};
  const fields = {};
  for (const [api, name] of Object.entries(FIELD_MAP)) fields[name] = hourly[api] || null;
  return {
    time: hourly.time || [],
    fields,
    daily: loc.daily ? { time: loc.daily.time || [], sunrise: loc.daily.sunrise, sunset: loc.daily.sunset, uvMax: loc.daily.uv_index_max } : null,
    elevation: loc.elevation,
  };
}

/**
 * Fetch forecasts for many nodes with one model.
 * @param nodes  [{ id, lat, lon }]
 * @returns Map(nodeId -> normalised series)
 */
async function fetchModel(nodes, { model, days, timezone, apiKey, concurrency = 3, callsPerMin = 0 }) {
  const chunks = [];
  for (let i = 0; i < nodes.length; i += CHUNK) chunks.push(nodes.slice(i, i + CHUNK));
  const out = new Map();
  await mapLimit(chunks, concurrency, async (chunk) => {
    await takeBudget(chunk.length * callWeight(days), callsPerMin);
    const params = new URLSearchParams({
      latitude: chunk.map((n) => n.lat).join(','),
      longitude: chunk.map((n) => n.lon).join(','),
      hourly: HOURLY.join(','),
      daily: DAILY.join(','),
      timezone,
      // With past_hours set, the API ignores forecast_days for hourly data, so pass both.
      forecast_days: String(days),
      forecast_hours: String(days * 24),
      past_hours: '3',
      wind_speed_unit: 'ms',
      timeformat: 'unixtime',
      models: model,
    });
    if (apiKey) params.set('apikey', apiKey);
    const json = await getJson(`${baseUrl(apiKey)}?${params}`, { label: `open-meteo:${model}`, timeoutMs: 30000 });
    const locations = Array.isArray(json) ? json : [json];
    locations.forEach((loc, idx) => {
      if (chunk[idx]) out.set(chunk[idx].id, normalise(loc));
    });
  });
  return out;
}

/** Rough daily call cost, for the /status budget readout (Open-Meteo counts per location and weights >10 variables). */
function estimateDailyCalls({ locations, models, refreshMin, days }) {
  const variableWeight = Math.ceil((HOURLY.length + DAILY.length) / 10);
  const dayWeight = Math.max(1, Math.ceil(days / 14));
  return Math.round(locations * models * variableWeight * dayWeight * (1440 / refreshMin));
}

module.exports = { fetchModel, estimateDailyCalls, HOURLY, FIELD_MAP };
