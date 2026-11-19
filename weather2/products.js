/** Builds API-ready station products from corrected series + risk. */
const { describe } = require('./codes');
const { r1, r2, isNum } = require('./fusion');
const { hourlyRisk, summarise } = require('./risk');
const { forecastRainWindows } = require('./rainfall');

function localDay(epochSec, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(epochSec * 1000));
}

function hourlyRows(times, s, risk) {
  return times.map((t, i) => ({
    t,
    temperature: r1(s.temperature[i]),
    apparent: r1(s.apparent[i]),
    humidity: r1(s.humidity[i]),
    dewPoint: r1(s.dewPoint[i]),
    pressure: r1(s.pressure[i]),
    precipitation: r2(s.precipitation[i]),
    precipAreaMax: r2(s.precipAreaMax[i]),
    rainCoverage: isNum(s.rainCoverage[i]) ? Math.round(s.rainCoverage[i] * 100) : null,
    pop: isNum(s.pop[i]) ? Math.round(s.pop[i]) : null,
    popArea: isNum(s.popArea[i]) ? Math.round(s.popArea[i]) : null,
    windSpeed: r1(s.windSpeed[i]),
    windDeg: isNum(s.windDeg[i]) ? Math.round(s.windDeg[i]) : null,
    windGust: r1(s.windGust[i]),
    gustAreaMax: r1(s.gustAreaMax[i]),
    cape: isNum(s.cape[i]) ? Math.round(s.cape[i]) : null,
    capeAreaMax: isNum(s.capeAreaMax[i]) ? Math.round(s.capeAreaMax[i]) : null,
    liftedIndex: r1(s.liftedIndex[i]),
    cloudCover: isNum(s.cloudCover[i]) ? Math.round(s.cloudCover[i]) : null,
    visibility: isNum(s.visibility[i]) ? Math.round(s.visibility[i]) : null,
    weatherCode: s.weatherCode[i],
    condition: describe(s.weatherCode[i]).label,
    isDay: s.isDay[i],
    confidence: s.confidence[i],
    spreadT: r2(s.spreadT[i]),
    riskLevel: risk[i].level,
    riskDrivers: risk[i].drivers,
    thunderScore: risk[i].thunderScore,
  }));
}

function dailyRows(hourly, timeZone, providerDaily) {
  const days = new Map();
  for (const h of hourly) {
    const day = localDay(h.t, timeZone);
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(h);
  }
  const sun = new Map();
  if (providerDaily && providerDaily.time) {
    providerDaily.time.forEach((t, i) => sun.set(localDay(t, timeZone), {
      sunrise: providerDaily.sunrise?.[i] ?? null,
      sunset: providerDaily.sunset?.[i] ?? null,
      uvMax: providerDaily.uvMax?.[i] ?? null,
    }));
  }
  const vals = (list, f) => list.map((h) => h[f]).filter(isNum);
  const out = [];
  for (const [day, list] of days) {
    if (list.length < 12) continue; // skip partial past/future days
    const codes = list.filter((h) => isNum(h.weatherCode));
    const sig = codes.length
      ? codes.reduce((a, b) => (describe(b.weatherCode).severity > describe(a.weatherCode).severity ? b : a)).weatherCode
      : null;
    const temps = vals(list, 'temperature');
    out.push({
      day,
      tempMax: temps.length ? r1(Math.max(...temps)) : null,
      tempMin: temps.length ? r1(Math.min(...temps)) : null,
      precipSum: r1(vals(list, 'precipitation').reduce((a, v) => a + v, 0)),
      precipHours: list.filter((h) => (h.precipitation || 0) >= 0.1).length,
      popMax: vals(list, 'pop').length ? Math.max(...vals(list, 'pop')) : null,
      popAreaMax: vals(list, 'popArea').length ? Math.max(...vals(list, 'popArea')) : null,
      windMax: vals(list, 'windSpeed').length ? r1(Math.max(...vals(list, 'windSpeed'))) : null,
      gustMax: vals(list, 'gustAreaMax').length ? r1(Math.max(...vals(list, 'gustAreaMax'))) : null,
      capeMax: vals(list, 'capeAreaMax').length ? Math.max(...vals(list, 'capeAreaMax')) : null,
      weatherCode: sig,
      condition: describe(sig).label,
      riskLevel: Math.max(...list.map((h) => h.riskLevel)),
      confidence: Math.round(vals(list, 'confidence').reduce((a, v) => a + v, 0) / Math.max(1, vals(list, 'confidence').length)),
      ...(sun.get(day) || {}),
    });
  }
  return out;
}

/**
 * @param station  { key, name, type, lat, lon, isHydro }
 * @param fused    fusion output
 * @param corrected { series, applied }
 * @param obs      latest observation or null
 */
function buildStationProduct({ station, fused, corrected, obs, providerDaily, timeZone, issuedAt, now = new Date() }) {
  const s = corrected.series;
  const risk = hourlyRisk(fused.times, s);
  const hourly = hourlyRows(fused.times, s, risk);
  const nowSec = now.getTime() / 1000;
  const summary = summarise(station.name, fused.times, s, risk, nowSec);
  let idx = fused.times.findIndex((t) => t > nowSec) - 1;
  if (idx < 0) idx = 0;
  const fc = hourly[idx];
  const obsFresh = obs && !obs.error && (now - new Date(obs.observedAt)) / 60000 <= 90;
  const current = {
    source: obsFresh ? 'observation+fused' : 'fused',
    observedAt: obsFresh ? new Date(obs.observedAt).toISOString() : null,
    temperature: obsFresh && isNum(obs.temperature) ? r1(obs.temperature) : fc.temperature,
    apparent: obsFresh && isNum(obs.feelsLike) ? r1(obs.feelsLike) : fc.apparent,
    humidity: obsFresh && isNum(obs.humidity) ? obs.humidity : fc.humidity,
    pressure: obsFresh && isNum(obs.pressure) ? obs.pressure : fc.pressure,
    windSpeed: obsFresh && isNum(obs.windSpeed) ? r1(obs.windSpeed) : fc.windSpeed,
    windDeg: obsFresh && isNum(obs.windDeg) ? obs.windDeg : fc.windDeg,
    windGust: obsFresh && isNum(obs.windGust) ? r1(obs.windGust) : fc.windGust,
    visibility: obsFresh && isNum(obs.visibility) ? obs.visibility : fc.visibility,
    rain1h: obsFresh ? obs.rain1h : fc.precipitation,
    weatherCode: obsFresh && isNum(obs.weatherCode) ? obs.weatherCode : fc.weatherCode,
    condition: obsFresh && obs.description ? obs.description : fc.condition,
    pop: fc.pop,
    popArea: fc.popArea,
    rainCoverage: fc.rainCoverage,
    cape: fc.cape,
    dewPoint: fc.dewPoint,
    isDay: fc.isDay,
    confidence: fc.confidence,
    riskLevel: fc.riskLevel,
  };
  const rainNow = (obsFresh && (obs.rain1h > 0 || obs.weatherCode >= 51)) || (fc.precipitation || 0) >= 0.2;

  return {
    station: { key: station.key, name: station.name, type: station.type, lat: station.lat, lon: station.lon, isHydro: station.isHydro },
    issuedAt,
    models: fused.models,
    members: fused.members,
    corrections: corrected.applied,
    current,
    rainNow,
    summary,
    rainWindows: forecastRainWindows(fused.times, s, { fromSec: nowSec }).slice(0, 8),
    hourly,
    daily: dailyRows(hourly, timeZone, providerDaily),
    nodes: fused.nodes,
  };
}

/** Compact per-station line for overview lists and the map. */
function compact(product) {
  return {
    key: product.station.key,
    name: product.station.name,
    type: product.station.type,
    lat: product.station.lat,
    lon: product.station.lon,
    isHydro: product.station.isHydro,
    current: product.current,
    rainNow: product.rainNow,
    level6h: product.summary.level6h,
    level24h: product.summary.level24h,
    label24h: product.summary.label24h,
    drivers24h: product.summary.drivers24h,
    rain24hMax: product.summary.rain24hMax,
    nextRain: product.rainWindows[0] || null,
    alerts: product.summary.alerts.length,
  };
}

module.exports = { buildStationProduct, compact, hourlyRows, dailyRows, localDay };
