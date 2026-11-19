/**
 * OpenWeatherMap current conditions (uses the existing WEATHER_API key). These station-blended
 * observations anchor the nowcast correction and feed the rainfall timeline report.
 */
const { getJson, sleep } = require('../http');
const { fromOwmId } = require('../codes');

async function fetchCurrent(lat, lon, apiKey) {
  const params = new URLSearchParams({ lat, lon, appid: apiKey, units: 'metric' });
  const d = await getJson(`https://api.openweathermap.org/data/2.5/weather?${params}`, { label: 'openweathermap', retries: 1 });
  const w = (d.weather && d.weather[0]) || {};
  return {
    observedAt: new Date((d.dt || Date.now() / 1000) * 1000),
    dt: d.dt,
    lat: d.coord?.lat ?? lat,
    lon: d.coord?.lon ?? lon,
    condition: w.main || null,
    conditionId: w.id ?? null,
    weatherCode: w.id != null ? fromOwmId(w.id) : null,
    description: w.description || null,
    icon: w.icon || null,
    temperature: d.main?.temp ?? null,
    feelsLike: d.main?.feels_like ?? null,
    pressure: d.main?.pressure ?? null,
    humidity: d.main?.humidity ?? null,
    windSpeed: d.wind?.speed ?? null,
    windDeg: d.wind?.deg ?? null,
    windGust: d.wind?.gust ?? null,
    rain1h: d.rain?.['1h'] ?? 0,
    rain3h: d.rain?.['3h'] ?? 0,
    cloudiness: d.clouds?.all ?? null,
    visibility: d.visibility ?? null,
  };
}

/**
 * Sequential with spacing so we stay under the free tier's 60 calls/minute.
 * Failures for individual sites are returned as { error } and do not abort the batch.
 */
async function fetchCurrentMany(sites, apiKey, { spacingMs = 1100 } = {}) {
  const out = new Map();
  for (const site of sites) {
    try {
      out.set(site.key, await fetchCurrent(site.lat, site.lon, apiKey));
    } catch (err) {
      out.set(site.key, { error: err.message });
    }
    await sleep(spacingMs);
  }
  return out;
}

module.exports = { fetchCurrent, fetchCurrentMany };
