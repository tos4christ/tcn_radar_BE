/** Geodesy helpers for multi-node sampling. */
const R_KM = 6371.0088;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/** Great-circle distance in km. */
function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Point reached travelling `distKm` from (lat, lon) on initial bearing `bearingDeg`. */
function destination(lat, lon, bearingDeg, distKm) {
  const δ = distKm / R_KM;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: toDeg(φ2), lon: ((toDeg(λ2) + 540) % 360) - 180 };
}

const round4 = (v) => Math.round(v * 1e4) / 1e4;

/**
 * Sampling nodes for a site: the centre plus `count` nodes evenly spaced on a ring of
 * `radiusKm` (first node due north), plus any custom nodes supplied by operators.
 * Each node: { id, label, lat, lon, kind: 'center'|'ring'|'custom', role, weightFactor, distanceKm }
 */
function buildNodes(site, { radiusKm, count, custom = [] }) {
  const nodes = [{
    id: `${site.key}#c`, label: 'Centre', lat: round4(site.lat), lon: round4(site.lon),
    kind: 'center', role: 'point', weightFactor: 1, distanceKm: 0,
  }];
  const compass = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  for (let i = 0; i < count; i += 1) {
    const bearing = (360 / count) * i;
    const p = destination(site.lat, site.lon, bearing, radiusKm);
    nodes.push({
      id: `${site.key}#r${i}`,
      label: `${compass[Math.round(bearing / 22.5) % 16]} ${radiusKm} km`,
      lat: round4(p.lat), lon: round4(p.lon),
      kind: 'ring', role: 'point', weightFactor: 1, distanceKm: radiusKm, bearing,
    });
  }
  for (const c of custom) {
    nodes.push({
      id: `${site.key}#x${c.id}`,
      dbId: c.id,
      label: c.label,
      lat: round4(Number(c.lat)), lon: round4(Number(c.lon)),
      kind: 'custom',
      role: c.role === 'point' ? 'point' : 'area',
      weightFactor: Number(c.weight) > 0 ? Number(c.weight) : 1,
      distanceKm: haversineKm(site.lat, site.lon, Number(c.lat), Number(c.lon)),
    });
  }
  return nodes;
}

/**
 * Inverse-distance weights. d0 (half the ring radius) keeps the centre finite and makes it
 * dominant without drowning the ring: with 4 ring nodes the centre carries ~69 % at p=2.
 */
function idwWeights(nodes, { power = 2, radiusKm = 15 } = {}) {
  const d0 = Math.max(radiusKm / 2, 0.5);
  return nodes.map((n) => n.weightFactor / (n.distanceKm + d0) ** power);
}

module.exports = { haversineKm, destination, buildNodes, idwWeights };
