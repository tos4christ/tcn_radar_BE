/**
 * Forecast corrections applied on top of the fused NWP forecast.
 *
 * 1. Learned station bias (MOS-lite): NWP models are systematically off at specific sites
 *    (terrain, lakes, urban heat). From the last days of verification pairs we learn
 *    mean(forecast − observed) per variable and remove a damped share of it everywhere.
 * 2. Nowcast anchoring: the latest live observation at the station is compared with the
 *    forecast for that moment; the residual is added and decays exponentially with lead
 *    time (τ = WEATHER_BIAS_DECAY_HOURS). Rain observed right now lifts short-range PoP.
 * Both are clamped so a faulty observation cannot wreck the forecast.
 */
const { isNum } = require('./fusion');

const CLAMP = { temperature: 6, humidity: 25, windSpeed: 6, pressure: 6 };
const LEARN_DAMPING = 0.7;
const MIN_PAIRS = 12;

const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

/** Magnus-formula dew point (°C) from temperature (°C) and relative humidity (%). */
function dewPoint(t, rh) {
  if (!isNum(t) || !isNum(rh) || rh <= 0) return null;
  const a = 17.62;
  const b = 243.12;
  const g = Math.log(Math.min(rh, 100) / 100) + (a * t) / (b + t);
  return (b * g) / (a - g);
}

/** Linear interpolation of a series at unix-seconds `ts`. */
function valueAt(times, values, ts) {
  if (!times.length) return null;
  if (ts <= times[0]) return values[0];
  for (let i = 1; i < times.length; i += 1) {
    if (ts <= times[i]) {
      const a = values[i - 1];
      const b = values[i];
      if (!isNum(a) || !isNum(b)) return isNum(b) ? b : a;
      const f = (ts - times[i - 1]) / (times[i] - times[i - 1]);
      return a + (b - a) * f;
    }
  }
  return values[values.length - 1];
}

/**
 * Learned biases from verification rows [{ variable, forecast, observed }].
 * Returns { temperature: meanError, ... , pairs: n } (only variables with enough pairs).
 */
function learnBias(pairs) {
  const acc = {};
  for (const p of pairs) {
    if (!isNum(p.forecast) || !isNum(p.observed)) continue;
    (acc[p.variable] ||= []).push(p.forecast - p.observed);
  }
  const out = {};
  for (const [variable, errs] of Object.entries(acc)) {
    if (errs.length < MIN_PAIRS) continue;
    // Trim the 10 % most extreme errors each side before averaging.
    const sorted = [...errs].sort((a, b) => a - b);
    const cut = Math.floor(sorted.length * 0.1);
    const core = sorted.slice(cut, sorted.length - cut);
    const mean = core.reduce((a, v) => a + v, 0) / core.length;
    out[variable] = { bias: Math.round(mean * 100) / 100, pairs: errs.length };
  }
  return out;
}

/**
 * Returns a corrected copy of fused.series.
 * @param obs   latest observation { observedAt: Date, temperature, humidity, windSpeed, pressure, rain1h, weatherCode }
 * @param learned output of learnBias
 */
function applyCorrections(fused, { obs = null, learned = {}, decayHours = 6, now = new Date() } = {}) {
  const s = Object.fromEntries(Object.entries(fused.series).map(([k, v]) => [k, [...v]]));
  const applied = { learned: {}, nowcast: {} };

  // 1) learned constant bias
  for (const variable of ['temperature', 'humidity', 'windSpeed']) {
    const b = learned[variable];
    if (!b) continue;
    const delta = clamp(-LEARN_DAMPING * b.bias, CLAMP[variable]);
    if (Math.abs(delta) < 0.05) continue;
    s[variable] = s[variable].map((v) => (isNum(v) ? v + delta : v));
    if (variable === 'temperature') s.apparent = s.apparent.map((v) => (isNum(v) ? v + delta : v));
    applied.learned[variable] = Math.round(delta * 100) / 100;
  }

  // 2) nowcast anchoring (only if the observation is fresh)
  const obsAgeMin = obs && obs.observedAt ? (now - new Date(obs.observedAt)) / 60000 : Infinity;
  if (obs && obsAgeMin <= 90) {
    const t0 = new Date(obs.observedAt).getTime() / 1000;
    for (const variable of ['temperature', 'humidity', 'windSpeed', 'pressure']) {
      if (!isNum(obs[variable])) continue;
      const fc = valueAt(fused.times, s[variable], t0);
      if (!isNum(fc)) continue;
      const residual = clamp(obs[variable] - fc, CLAMP[variable]);
      s[variable] = s[variable].map((v, i) => {
        if (!isNum(v)) return v;
        const lead = (fused.times[i] - t0) / 3600;
        if (lead < -1) return v;
        return v + residual * Math.exp(-Math.max(lead, 0) / decayHours);
      });
      if (variable === 'temperature') {
        s.apparent = s.apparent.map((v, i) => {
          const lead = (fused.times[i] - t0) / 3600;
          return isNum(v) && lead >= -1 ? v + residual * Math.exp(-Math.max(lead, 0) / decayHours) : v;
        });
      }
      applied.nowcast[variable] = Math.round(residual * 100) / 100;
    }
    if (s.humidity) s.humidity = s.humidity.map((v) => (isNum(v) ? Math.max(0, Math.min(100, v)) : v));
    if (s.windSpeed) s.windSpeed = s.windSpeed.map((v) => (isNum(v) ? Math.max(0, v) : v));

    // Rain happening now that the models missed: lift the next hours.
    const raining = (isNum(obs.rain1h) && obs.rain1h > 0) || (isNum(obs.weatherCode) && obs.weatherCode >= 51);
    if (raining) {
      fused.times.forEach((ts, i) => {
        const lead = (ts - t0) / 3600;
        if (lead < 0 || lead > 3) return;
        const k = Math.exp(-lead / 1.5);
        s.pop[i] = Math.max(isNum(s.pop[i]) ? s.pop[i] : 0, 85 * k);
        s.popArea[i] = Math.max(isNum(s.popArea[i]) ? s.popArea[i] : 0, 95 * k);
        if (isNum(obs.rain1h) && obs.rain1h > 0) {
          s.precipitation[i] = Math.max(isNum(s.precipitation[i]) ? s.precipitation[i] : 0, obs.rain1h * k);
        }
        if (isNum(obs.weatherCode) && (!isNum(s.weatherCode[i]) || s.weatherCode[i] < 51)) s.weatherCode[i] = obs.weatherCode;
      });
      applied.nowcast.rain = true;
    }
  }

  s.dewPoint = s.temperature.map((t, i) => {
    const d = dewPoint(t, s.humidity[i]);
    return isNum(d) ? d : s.dewPoint[i];
  });
  return { series: s, applied };
}

module.exports = { applyCorrections, learnBias, valueAt, dewPoint };
