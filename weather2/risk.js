/**
 * Grid-operations weather risk.
 *
 * Levels: 0 normal · 1 advisory · 2 watch · 3 warning
 * Hazards and why they matter for a transmission system:
 *   thunderstorm - lightning trips on exposed 330/132 kV corridors (CAPE, lifted index, PoP, codes)
 *   wind         - conductor galloping, clashing, tree/structure contact (area max gust)
 *   rain         - substation flooding, access, hydro inflow (hourly rate) / flood (24 h totals)
 *   heat         - thermal derating of lines and transformers (ambient temperature)
 *   visibility   - harmattan dust + dew → insulator contamination flashover; fog
 * Thresholds are deliberately in one table so operations can tune them.
 */
const { isNum } = require('./fusion');
const { isThunder } = require('./codes');

const THRESHOLDS = {
  wind: [12, 17, 24], // m/s gust
  rain: [2.5, 7.6, 15], // mm/h
  heat: [35, 38, 40], // °C
  visibility: [2000, 1000, 500], // m (lower is worse)
  // CAPE ~1000 J/kg is routine in the Nigerian wet season; lower thresholds cause alarm fatigue.
  thunder: [35, 55, 75], // score 0–100
  flood24h: [30, 50, 80], // mm / 24 h
};

const LABELS = ['Normal', 'Advisory', 'Watch', 'Warning'];

const ADVICE = {
  thunderstorm: 'Lightning risk on exposed corridors — confirm auto-reclose readiness and line-patrol availability.',
  wind: 'Strong gusts — risk of conductor clashing, galloping and vegetation contact.',
  rain: 'Heavy rain — watch substation drainage, cable trenches and access roads.',
  flood: 'Large 24 h rainfall — flooding risk; hydro stations expect rising inflow.',
  heat: 'High ambient temperature — apply thermal derating to lines and transformers.',
  visibility: 'Poor visibility (dust haze / fog) — elevated insulator flashover risk from contamination.',
};

const levelUp = (v, [a, b, c]) => (v >= c ? 3 : v >= b ? 2 : v >= a ? 1 : 0);
const levelDown = (v, [a, b, c]) => (v < c ? 3 : v < b ? 2 : v < a ? 1 : 0);

/** 0–100 thunderstorm score from instability and precipitation signals. */
function thunderScore({ cape, capeAreaMax, liftedIndex, pop, weatherCode }) {
  const c = isNum(capeAreaMax) ? Math.max(capeAreaMax * 0.8, cape || 0) : cape;
  let s = 0;
  if (isNum(c)) s += Math.min(c / 2500, 1) * 45;
  if (isNum(liftedIndex)) s += Math.min(Math.max(-liftedIndex / 6, 0), 1) * 20;
  if (isNum(pop)) s += (pop / 100) * 20;
  if (isThunder(weatherCode)) s += 15;
  return Math.round(Math.min(s, 100));
}

/** Per-hour hazard levels for a corrected series. */
function hourlyRisk(times, s) {
  return times.map((t, i) => {
    const thunder = thunderScore({
      cape: s.cape[i], capeAreaMax: s.capeAreaMax[i], liftedIndex: s.liftedIndex[i],
      pop: s.popArea[i] ?? s.pop[i], weatherCode: s.weatherCode[i],
    });
    const gust = isNum(s.gustAreaMax[i]) ? s.gustAreaMax[i] : s.windGust[i];
    const rainRate = Math.max(s.precipitation[i] || 0, (s.precipAreaMax[i] || 0) * 0.7);
    const hazards = {
      thunderstorm: { level: levelUp(thunder, THRESHOLDS.thunder), value: thunder },
      wind: { level: isNum(gust) ? levelUp(gust, THRESHOLDS.wind) : 0, value: gust },
      rain: { level: levelUp(rainRate, THRESHOLDS.rain), value: Math.round(rainRate * 10) / 10 },
      heat: { level: isNum(s.temperature[i]) ? levelUp(s.temperature[i], THRESHOLDS.heat) : 0, value: s.temperature[i] },
      visibility: { level: isNum(s.visibility[i]) ? levelDown(s.visibility[i], THRESHOLDS.visibility) : 0, value: s.visibility[i] },
    };
    const level = Math.max(...Object.values(hazards).map((h) => h.level));
    const drivers = Object.entries(hazards).filter(([, h]) => h.level === level && level > 0).map(([k]) => k);
    return { t, level, drivers, hazards, thunderScore: thunder };
  });
}

/** Rolling 24 h rainfall maxima for flood / hydro-inflow assessment. */
function rolling24hRain(times, precip, fromIdx = 0) {
  let best = { total: 0, start: null };
  for (let i = fromIdx; i < times.length; i += 1) {
    let sum = 0;
    for (let j = i; j < Math.min(i + 24, times.length); j += 1) sum += precip[j] || 0;
    if (sum > best.total) best = { total: sum, start: times[i] };
  }
  return { total: Math.round(best.total * 10) / 10, start: best.start };
}

/** Summaries + alert candidates for one station. */
function summarise(stationName, times, s, risk, nowSec = Date.now() / 1000) {
  const startIdx = Math.max(0, times.findIndex((t) => t >= nowSec - 1800));
  const window = (hours) => risk.slice(startIdx, startIdx + hours);
  const maxLevel = (list) => list.reduce((m, r) => Math.max(m, r.level), 0);

  const flood = rolling24hRain(times, s.precipitation, startIdx);
  const floodLevel = levelUp(flood.total, THRESHOLDS.flood24h);

  const alerts = [];
  for (const hazard of Object.keys(ADVICE)) {
    if (hazard === 'flood') continue;
    const hours = window(24).filter((r) => r.hazards[hazard].level >= 2);
    if (!hours.length) continue;
    const peak = hours.reduce((a, b) => (b.hazards[hazard].level > a.hazards[hazard].level
      || (b.hazards[hazard].level === a.hazards[hazard].level && (b.hazards[hazard].value || 0) > (a.hazards[hazard].value || 0)) ? b : a));
    alerts.push({
      station: stationName,
      hazard,
      level: peak.hazards[hazard].level,
      levelLabel: LABELS[peak.hazards[hazard].level],
      onset: hours[0].t,
      peak: peak.t,
      ends: hours[hours.length - 1].t + 3600,
      peakValue: peak.hazards[hazard].value,
      message: ADVICE[hazard],
    });
  }
  if (floodLevel >= 2) {
    alerts.push({
      station: stationName, hazard: 'flood', level: floodLevel, levelLabel: LABELS[floodLevel],
      onset: flood.start, peak: flood.start, ends: flood.start + 86400, peakValue: flood.total, message: ADVICE.flood,
    });
  }
  alerts.sort((a, b) => b.level - a.level || a.onset - b.onset);

  const next6 = window(6);
  const next24 = window(24);
  return {
    level6h: Math.max(maxLevel(next6), 0),
    level24h: Math.max(maxLevel(next24), floodLevel),
    label6h: LABELS[maxLevel(next6)],
    label24h: LABELS[Math.max(maxLevel(next24), floodLevel)],
    drivers6h: [...new Set(next6.flatMap((r) => r.drivers))],
    drivers24h: [...new Set(next24.flatMap((r) => r.drivers))],
    maxThunderScore24h: next24.reduce((m, r) => Math.max(m, r.thunderScore), 0),
    rain24hMax: flood,
    alerts,
  };
}

module.exports = { THRESHOLDS, LABELS, ADVICE, thunderScore, hourlyRisk, summarise, rolling24hRain };
