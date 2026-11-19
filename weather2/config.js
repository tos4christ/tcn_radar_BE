/**
 * Settings of the weather engine used by /nccweather_fix (read from .env, all optional).
 *
 *   WEATHER2_ENABLED              true   - false stops the engine (the page then says it is off)
 *   WEATHER_API                          - the existing OpenWeatherMap key: live observations that
 *                                          correct the forecast. Without it the forecast still works.
 *   OPEN_METEO_API_KEY                   - only for a paid Open-Meteo plan; the free tier needs no key
 *   WEATHER2_MODELS               best_match  e.g. "ecmwf_ifs025,gfs_seamless,icon_seamless"
 *   WEATHER2_MODEL_WEIGHTS               - e.g. "ecmwf_ifs025:1.2,gfs_seamless:0.8"
 *   WEATHER2_FORECAST_DAYS        7
 *   WEATHER2_FORECAST_REFRESH_MIN 120
 *   WEATHER2_NOWCAST_REFRESH_MIN  15
 *   WEATHER2_RING_RADIUS_KM       15     - sampling ring around each station
 *   WEATHER2_RING_NODES           4
 *   WEATHER2_POINT_LIMIT          30     - new map-click point forecasts per 10 minutes (all users)
 *   WEATHER2_POINT_DAILY_LIMIT    200    - and per 24 hours
 *   WEATHER2_STATIONS_FILE               - JSON [{name,lat,lon,type}], used only when station_coords_2
 *                                          cannot be read (testing)
 */
const str = (name, fallback) => {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
};
const num = (name, fallback, min, max) => {
  const raw = process.env[name];
  const v = Number(raw);
  if (raw === undefined || raw === '' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
};
const bool = (name, fallback) => {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};
const list = (name, fallback) => {
  const v = process.env[name];
  if (!v) return fallback;
  const out = v.split(',').map((s) => s.trim()).filter(Boolean);
  return out.length ? out : fallback;
};

const modelWeights = {};
list('WEATHER2_MODEL_WEIGHTS', []).forEach((kv) => {
  const [k, w] = kv.split(':');
  if (k) modelWeights[k.trim()] = Number(w) > 0 ? Number(w) : 1;
});

const openMeteoKey = str('OPEN_METEO_API_KEY');

module.exports = {
  enabled: bool('WEATHER2_ENABLED', true),
  timezone: 'Africa/Lagos',
  openMeteoKey,
  models: list('WEATHER2_MODELS', ['best_match']),
  modelWeights,
  forecastDays: num('WEATHER2_FORECAST_DAYS', 7, 1, 16),
  forecastRefreshMin: num('WEATHER2_FORECAST_REFRESH_MIN', 120, 15, 1440),
  // Open-Meteo free tier: 600 calls a minute. Paced below that unless a paid key is set.
  openMeteoCallsPerMin: num('OPEN_METEO_CALLS_PER_MIN', openMeteoKey ? 0 : 500, 0, 100000),
  openWeatherKey: str('WEATHER_API'),
  nowcastRefreshMin: num('WEATHER2_NOWCAST_REFRESH_MIN', 15, 5, 1440),
  ringRadiusKm: num('WEATHER2_RING_RADIUS_KM', 15, 2, 60),
  ringNodeCount: Math.round(num('WEATHER2_RING_NODES', 4, 0, 12)),
  idwPower: num('WEATHER2_IDW_POWER', 2, 0.5, 4),
  biasDecayHours: num('WEATHER2_BIAS_DECAY_HOURS', 6, 1, 48),
  stationsFile: str('WEATHER2_STATIONS_FILE'),
  requestConcurrency: Math.round(num('WEATHER2_REQUEST_CONCURRENCY', 4, 1, 10)),
  // Uncached point forecasts (map clicks) allowed per 10 minutes, all users together.
  pointLimitPer10Min: Math.round(num('WEATHER2_POINT_LIMIT', 30, 1, 1000)),
  // ... and per 24 hours (about 10 Open-Meteo calls each; 60 stations use about 7 200 of the 10 000 a day).
  pointLimitPerDay: Math.round(num('WEATHER2_POINT_DAILY_LIMIT', 200, 1, 100000)),
};
