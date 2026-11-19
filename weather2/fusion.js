/**
 * Multi-node, multi-model forecast fusion.
 *
 * For every hour we have a small ensemble: (sampling node) × (NWP model). Each member is
 * weighted by  w = idw(node distance) × node factor × model trust. From that ensemble:
 *   point estimate  - weighted mean over 'point' nodes (centre + ring + custom point nodes)
 *   area statistics - over *all* nodes (incl. custom 'area' nodes such as line corridors
 *                     or hydro catchments): max rain rate, max gust, max CAPE, rain coverage,
 *                     probability of rain anywhere in the area
 *   spread          - weighted std-dev of temperature and wet/dry disagreement, turned into
 *                     a 0–100 confidence that also decays with lead time
 */
const { describe, isThunder } = require('./codes');

const SCALARS = [
  'temperature', 'humidity', 'dewPoint', 'apparent', 'pressure', 'cloudCover', 'visibility',
  'cape', 'liftedIndex', 'precipitation', 'pop', 'windSpeed', 'windGust',
];
const WET_MM = 0.1;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const r1 = (v) => (isNum(v) ? Math.round(v * 10) / 10 : null);
const r2 = (v) => (isNum(v) ? Math.round(v * 100) / 100 : null);

function weightedMean(values, weights) {
  let s = 0;
  let w = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (isNum(values[i]) && weights[i] > 0) { s += values[i] * weights[i]; w += weights[i]; }
  }
  return w > 0 ? s / w : null;
}

function weightedStd(values, weights, mean) {
  if (!isNum(mean)) return null;
  let s = 0;
  let w = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (isNum(values[i]) && weights[i] > 0) { s += weights[i] * (values[i] - mean) ** 2; w += weights[i]; }
  }
  return w > 0 ? Math.sqrt(s / w) : null;
}

/** Speed-weighted vector mean of wind direction (degrees, meteorological). */
function vectorMeanDir(speeds, dirs, weights) {
  let u = 0;
  let v = 0;
  for (let i = 0; i < dirs.length; i += 1) {
    if (!isNum(dirs[i]) || !(weights[i] > 0)) continue;
    const s = isNum(speeds[i]) ? Math.max(speeds[i], 0.1) : 1;
    const rad = (dirs[i] * Math.PI) / 180;
    u += weights[i] * s * Math.sin(rad);
    v += weights[i] * s * Math.cos(rad);
  }
  if (u === 0 && v === 0) return null;
  return (((Math.atan2(u, v) * 180) / Math.PI) + 360) % 360;
}

/**
 * "Significant weather": the most severe code whose members (codes at least that severe)
 * carry ≥ 35 % of the weight. Stops one outlier member from painting a thunderstorm while
 * still surfacing a real convective signal that a plain majority vote would hide.
 */
function significantCode(codes, weights, share = 0.35) {
  const entries = [];
  let total = 0;
  codes.forEach((c, i) => {
    if (isNum(c) && weights[i] > 0) { entries.push([c, weights[i]]); total += weights[i]; }
  });
  if (!entries.length) return null;
  entries.sort((a, b) => describe(b[0]).severity - describe(a[0]).severity);
  let acc = 0;
  for (const [code, w] of entries) {
    acc += w;
    if (acc / total >= share) return code;
  }
  return entries[entries.length - 1][0];
}

/** Align a provider series to master timestamps. */
function align(series, masterTimes) {
  const idx = new Map(series.time.map((t, i) => [t, i]));
  const out = {};
  for (const [field, arr] of Object.entries(series.fields)) {
    out[field] = arr ? masterTimes.map((t) => {
      const i = idx.get(t);
      return i === undefined ? null : arr[i];
    }) : null;
  }
  return out;
}

/**
 * @param nodes        station nodes (from geo.buildNodes)
 * @param nodeWeights  idw weights aligned with nodes
 * @param modelSeries  Map(model -> Map(nodeId -> normalised series))
 * @param modelWeights { model: trust }
 * @param now          Date used for lead-time confidence decay
 */
function fuseStation({ nodes, nodeWeights, modelSeries, modelWeights = {}, now = new Date() }) {
  const models = [...modelSeries.keys()];
  // Master timeline: the centre node of the first model that returned data.
  let master = null;
  for (const m of models) {
    const s = modelSeries.get(m).get(nodes[0].id);
    if (s && s.time.length) { master = s.time; break; }
  }
  if (!master) return null;

  const members = []; // { node index, model, weight, point, data }
  nodes.forEach((node, ni) => {
    models.forEach((m) => {
      const s = modelSeries.get(m).get(node.id);
      if (!s || !s.time.length) return;
      members.push({
        ni,
        model: m,
        point: node.role === 'point',
        weight: nodeWeights[ni] * (modelWeights[m] ?? 1),
        data: align(s, master),
      });
    });
  });
  if (!members.length) return null;

  const point = members.filter((mb) => mb.point);
  const pw = point.map((mb) => mb.weight);
  const byNode = new Map();
  for (const mb of members) {
    if (!byNode.has(mb.ni)) byNode.set(mb.ni, []);
    byNode.get(mb.ni).push(mb);
  }
  const nowSec = now.getTime() / 1000;
  const series = {
    temperature: [], humidity: [], dewPoint: [], apparent: [], pressure: [], cloudCover: [],
    visibility: [], cape: [], capeAreaMax: [], liftedIndex: [], precipitation: [], precipAreaMax: [],
    rainCoverage: [], pop: [], popArea: [], windSpeed: [], windDeg: [], windGust: [], gustAreaMax: [],
    weatherCode: [], isDay: [], spreadT: [], confidence: [],
  };

  for (let t = 0; t < master.length; t += 1) {
    const col = (list, field) => list.map((mb) => (mb.data[field] ? mb.data[field][t] : null));

    for (const f of SCALARS) {
      if (f === 'pop') continue;
      series[f].push(weightedMean(col(point, f), pw));
    }

    // Per-node model means drive the area statistics.
    const nodeMean = (f) => [...byNode.values()].map((list) => weightedMean(
      list.map((mb) => (mb.data[f] ? mb.data[f][t] : null)), list.map(() => 1),
    ));
    const nodePrecip = nodeMean('precipitation');
    const nodePop = nodeMean('pop');
    const maxOf = (arr) => {
      const v = arr.filter(isNum);
      return v.length ? Math.max(...v) : null;
    };
    series.precipAreaMax.push(maxOf(nodePrecip));
    series.gustAreaMax.push(maxOf(nodeMean('windGust')));
    series.capeAreaMax.push(maxOf(nodeMean('cape')));
    const knownNodes = nodePrecip.filter(isNum);
    series.rainCoverage.push(knownNodes.length ? knownNodes.filter((v) => v >= WET_MM).length / knownNodes.length : null);

    // Probability of precipitation: model PoP if any model supplies it, else ensemble wet fraction.
    const precipCol = col(point, 'precipitation');
    const wetShare = weightedMean(precipCol.map((v) => (isNum(v) ? (v >= WET_MM ? 1 : 0) : null)), pw);
    const pop = weightedMean(col(point, 'pop'), pw);
    series.pop.push(isNum(pop) ? pop : (isNum(wetShare) ? wetShare * 100 : null));
    const popAreaModel = maxOf(nodePop);
    series.popArea.push(isNum(popAreaModel) ? popAreaModel : (knownNodes.length ? Math.max(...knownNodes.map((v) => (v >= WET_MM ? 100 : 0))) : null));

    series.windDeg.push(vectorMeanDir(col(point, 'windSpeed'), col(point, 'windDeg'), pw));
    series.weatherCode.push(significantCode(col(point, 'weatherCode'), pw));
    series.isDay.push(members[0].data.isDay ? members[0].data.isDay[t] : null);

    const temps = col(point, 'temperature');
    const spread = weightedStd(temps, pw, series.temperature[t]);
    series.spreadT.push(spread);
    const disagree = isNum(wetShare) ? 4 * wetShare * (1 - wetShare) : 0;
    const leadH = Math.max(0, (master[t] - nowSec) / 3600);
    const leadFactor = Math.max(0.4, 1 - leadH / 240);
    const spreadFactor = isNum(spread) ? Math.exp(-((spread / 2.5) ** 2)) : 0.8;
    series.confidence.push(Math.round(100 * spreadFactor * (1 - 0.5 * disagree) * leadFactor));
  }

  // Current-hour snapshot per node, for the map.
  let nowIdx = master.findIndex((t) => t > nowSec) - 1;
  if (nowIdx < 0) nowIdx = 0;
  const nodeSnapshots = nodes.map((node, ni) => {
    const list = members.filter((mb) => mb.ni === ni);
    const at = (f) => weightedMean(list.map((mb) => (mb.data[f] ? mb.data[f][nowIdx] : null)), list.map(() => 1));
    const codes = list.map((mb) => (mb.data.weatherCode ? mb.data.weatherCode[nowIdx] : null));
    return {
      ...node,
      now: {
        temperature: r1(at('temperature')),
        precipitation: r2(at('precipitation')),
        pop: r1(at('pop')),
        windGust: r1(at('windGust')),
        cape: r1(at('cape')),
        weatherCode: significantCode(codes, codes.map(() => 1)),
      },
      next6hRain: r1(list.length ? Math.max(0, ...list.map((mb) => (mb.data.precipitation || [])
        .slice(nowIdx, nowIdx + 6).reduce((a, v) => a + (isNum(v) ? v : 0), 0))) : null),
    };
  });

  return {
    times: master,
    series,
    models,
    members: members.length,
    nodes: nodeSnapshots,
    thunderSignal: series.weatherCode.some((c) => isThunder(c)),
  };
}

module.exports = { fuseStation, weightedMean, weightedStd, vectorMeanDir, significantCode, r1, r2, isNum };
