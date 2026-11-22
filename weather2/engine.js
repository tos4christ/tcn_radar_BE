/**
 * Weather engine of /nccweather_fix (ported from the NISO NAS v2 weather centre).
 *
 *  every WEATHER2_FORECAST_REFRESH_MIN : Open-Meteo, every node of every station x models -> fuse
 *                                        -> correct -> risk and alerts
 *  every WEATHER2_NOWCAST_REFRESH_MIN  : OpenWeatherMap observations -> verification pairs -> learned
 *                                        bias -> re-correct (no forecast calls)
 *  on demand                           : point forecast for any place clicked on the map
 *
 * Everything is kept in memory; the database (weather2_* tables) only keeps operator nodes, the
 * learned bias and the alert history across restarts. The page polls /api2/weather/overview.
 */
const cfg = require('./config');
const repo = require('./repository');
const openMeteo = require('./providers/openMeteo');
const openWeather = require('./providers/openWeather');
const { buildNodes, idwWeights, haversineKm } = require('./geo');
const { fuseStation, isNum } = require('./fusion');
const { applyCorrections, learnBias, valueAt } = require('./corrections');
const { buildStationProduct, compact } = require('./products');
const log = require('./log').child('weather2');
// Admin switch "Weather API subscription expired" (utility/serviceSettings.js): no provider calls while on.
const serviceSettings = require('../utility/serviceSettings');

class WeatherEngine {
  constructor() {
    this.started = false;
    this.stations = [];
    this.nodes = new Map(); // station key -> nodes
    this.raw = new Map(); // station key -> fused (uncorrected)
    this.issued = new Map(); // station key -> ISO time of the forecast run
    this.providerDaily = new Map();
    this.obs = new Map();
    this.learned = new Map();
    this.products = new Map();
    this.pointCache = new Map();
    this.pointCalls = [];
    this.alerts = [];
    this.timers = [];
    this.retryTimer = null;
    this.running = { forecast: false, nowcast: false };
    this.status = {
      enabled: cfg.enabled,
      models: cfg.models,
      stations: 0,
      nodes: 0,
      lastForecastAt: null,
      lastForecastError: null,
      lastForecastDurationMs: null,
      lastNowcastAt: null,
      lastNowcastError: null,
      nowcastEnabled: Boolean(cfg.openWeatherKey),
      observationsOk: 0,
      observationsFailed: 0,
    };
  }

  /** Starts the cycles once. Never throws (errors are logged and shown on the page). */
  async start() {
    if (this.started) return;
    this.started = true;
    if (!cfg.enabled) {
      log.info('weather engine off (WEATHER2_ENABLED=false)');
      return;
    }
    try {
      await repo.ensureTables();
      await this.loadStations();
    } catch (err) {
      log.error('start:', err.message);
    }
    const every = (min, fn) => {
      const t = setInterval(() => { fn().catch((e) => log.error(e.message)); }, min * 60000);
      if (t.unref) t.unref();
      this.timers.push(t);
    };
    // The station list changes rarely; reload it (and retry if the database was down) every 30 min.
    every(30, async () => {
      const before = this.stations.length;
      if (!repo.tablesReady()) await repo.ensureTables();
      await this.loadStations();
      if (!before && this.stations.length) await this.forecastCycle();
    });
    every(24 * 60, () => repo.pruneVerification());
    every(cfg.forecastRefreshMin, () => this.forecastCycle());
    if (cfg.openWeatherKey) every(cfg.nowcastRefreshMin, () => this.nowcastCycle());
    else log.warn('WEATHER_API (OpenWeatherMap key) not set - live observation correction off');
    await this.forecastCycle();
    if (cfg.openWeatherKey) this.nowcastCycle().catch((e) => log.error(e.message));
  }

  /** True while an administrator has suspended weather (subscription expired). */
  async paused() {
    const suspended = await serviceSettings.weatherSuspended();
    this.status.suspended = suspended;
    return suspended;
  }

  /** Called when an administrator turns weather back on: refresh now instead of at the next interval. */
  resume() {
    this.status.suspended = false;
    if (!this.started || !cfg.enabled || !this.timers.length) return;
    this.forecastCycle().catch((e) => log.error(e.message));
    if (cfg.openWeatherKey) this.nowcastCycle().catch((e) => log.error(e.message));
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  /* ------------------------------------------------------------------ stations */
  async loadStations() {
    const [stations, custom] = await Promise.all([repo.listStations(), repo.listCustomNodes()]);
    if (!stations.length) {
      log.warn('no weather stations found (station_coords_2 with lat/long); will retry');
      return;
    }
    this.stations = stations;
    this.nodes.clear();
    for (const st of stations) {
      const extra = custom.filter((c) => c.station_name === st.name);
      this.nodes.set(st.key, buildNodes(st, { radiusKm: cfg.ringRadiusKm, count: cfg.ringNodeCount, custom: extra }));
    }
    // Forget stations that were removed from the table.
    const keys = new Set(stations.map((s) => s.key));
    for (const m of [this.raw, this.issued, this.providerDaily, this.obs, this.learned, this.products]) {
      for (const k of [...m.keys()]) if (!keys.has(k)) m.delete(k);
    }
    this.status.stations = stations.length;
    this.status.nodes = [...this.nodes.values()].reduce((a, n) => a + n.length, 0);
    log.info(`loaded ${stations.length} stations / ${this.status.nodes} sampling nodes`);
  }

  station(key) {
    return this.stations.find((s) => s.key === key || s.name === key) || null;
  }

  /* ------------------------------------------------------------------ forecast */
  async fetchAndFuse(stations) {
    const allNodes = stations.flatMap((st) => this.nodes.get(st.key) || []);
    const modelResults = new Map();
    const errors = [];
    for (const model of cfg.models) {
      try {
        modelResults.set(model, await openMeteo.fetchModel(allNodes, {
          model, days: cfg.forecastDays, timezone: cfg.timezone, apiKey: cfg.openMeteoKey, callsPerMin: cfg.openMeteoCallsPerMin,
          concurrency: cfg.requestConcurrency,
        }));
      } catch (err) {
        errors.push(`${model}: ${err.message}`);
        log.error(`open-meteo ${model} failed:`, err.message);
      }
    }
    if (!modelResults.size) throw new Error(errors.join('; ') || 'no model returned data');

    const now = new Date();
    const issuedAt = now.toISOString();
    let fusedCount = 0;
    for (const st of stations) {
      const nodes = this.nodes.get(st.key) || [];
      if (!nodes.length) continue;
      const perStation = new Map();
      for (const [model, byNode] of modelResults) {
        const m = new Map();
        nodes.forEach((n) => { if (byNode.has(n.id)) m.set(n.id, byNode.get(n.id)); });
        perStation.set(model, m);
      }
      let fused = null;
      try {
        fused = fuseStation({
          nodes,
          nodeWeights: idwWeights(nodes, { power: cfg.idwPower, radiusKm: cfg.ringRadiusKm }),
          modelSeries: perStation,
          modelWeights: cfg.modelWeights,
          now,
        });
      } catch (err) {
        errors.push(`${st.name}: ${err.message}`);
      }
      if (!fused) continue;
      this.raw.set(st.key, fused);
      this.issued.set(st.key, issuedAt);
      const firstModel = [...modelResults.values()][0];
      const centre = firstModel.get(nodes[0].id);
      if (centre) this.providerDaily.set(st.key, centre.daily);
      fusedCount += 1;
    }
    return { fusedCount, errors };
  }

  async forecastCycle() {
    // checked first: the running test and flag below must stay together with no await between them
    if (await this.paused()) return;
    if (this.running.forecast || !this.stations.length) return;
    this.running.forecast = true;
    const t0 = Date.now();
    try {
      const { fusedCount, errors } = await this.fetchAndFuse(this.stations);
      this.status.lastForecastAt = new Date().toISOString();
      this.status.lastForecastError = errors.length ? errors.join('; ').slice(0, 500) : null;
      this.status.lastForecastDurationMs = Date.now() - t0;
      log.info(`forecast cycle: ${fusedCount}/${this.stations.length} stations fused in ${Date.now() - t0} ms`);
      this.rebuild();
    } catch (err) {
      this.status.lastForecastError = String(err.message).slice(0, 500);
      log.error('forecast cycle failed (keeping the last good forecast):', err.message);
      // Retry soon rather than waiting a full refresh interval with no forecast.
      if (!this.retryTimer && this.timers.length) {
        this.retryTimer = setTimeout(() => { this.retryTimer = null; this.forecastCycle(); }, 5 * 60000);
        if (this.retryTimer.unref) this.retryTimer.unref();
      }
    } finally {
      this.running.forecast = false;
    }
  }

  /* ------------------------------------------------------------------- nowcast */
  async nowcastCycle() {
    // checked first: the running test and flag below must stay together with no await between them
    if (await this.paused()) return;
    if (this.running.nowcast || !this.stations.length || !cfg.openWeatherKey) return;
    this.running.nowcast = true;
    try {
      const results = await openWeather.fetchCurrentMany(this.stations, cfg.openWeatherKey);
      const saved = [];
      const pairs = [];
      let ok = 0;
      let failed = 0;
      for (const st of this.stations) {
        const obs = results.get(st.key);
        if (!obs || obs.error) { failed += 1; continue; }
        ok += 1;
        this.obs.set(st.key, obs);
        saved.push({ station: st.name, obs });
        // Verification: compare with the *uncorrected* fused forecast if it was issued >= 1 h earlier.
        const raw = this.raw.get(st.key);
        const issued = this.issued.get(st.key);
        if (raw && issued) {
          const lead = (new Date(obs.observedAt) - new Date(issued)) / 3600000;
          const ts = new Date(obs.observedAt).getTime() / 1000;
          if (lead >= 1) {
            for (const variable of ['temperature', 'humidity', 'windSpeed']) {
              const fc = valueAt(raw.times, raw.series[variable], ts);
              if (isNum(fc) && isNum(obs[variable])) {
                pairs.push({ station: st.name, validAt: obs.observedAt, variable, forecast: fc, observed: obs[variable], leadHours: lead });
              }
            }
          }
        }
      }
      this.status.observationsOk = ok;
      this.status.observationsFailed = failed;
      this.status.lastNowcastAt = new Date().toISOString();
      this.status.lastNowcastError = ok === 0 && failed > 0 ? 'all observation requests failed' : null;
      await repo.saveObservations(saved);
      await repo.saveVerification(pairs);
      await this.refreshLearnedBias();
      this.rebuild();
    } catch (err) {
      this.status.lastNowcastError = String(err.message).slice(0, 500);
      log.error('nowcast cycle failed:', err.message);
    } finally {
      this.running.nowcast = false;
    }
  }

  async refreshLearnedBias() {
    const rows = await repo.recentVerification(7);
    const byStation = new Map();
    for (const r of rows) {
      if (!byStation.has(r.station_name)) byStation.set(r.station_name, []);
      byStation.get(r.station_name).push(r);
    }
    for (const st of this.stations) this.learned.set(st.key, learnBias(byStation.get(st.name) || []));
  }

  /* ------------------------------------------------------------------ products */
  rebuild() {
    const now = new Date();
    const alerts = [];
    for (const st of this.stations) {
      const fused = this.raw.get(st.key);
      if (!fused) continue;
      try {
        const corrected = applyCorrections(fused, {
          obs: this.obs.get(st.key), learned: this.learned.get(st.key) || {}, decayHours: cfg.biasDecayHours, now,
        });
        const product = buildStationProduct({
          station: st, fused, corrected, obs: this.obs.get(st.key), providerDaily: this.providerDaily.get(st.key),
          timeZone: cfg.timezone, issuedAt: this.issued.get(st.key), now,
        });
        this.products.set(st.key, product);
        alerts.push(...product.summary.alerts);
      } catch (err) {
        log.error(`product ${st.name}:`, err.message);
      }
    }
    alerts.sort((a, b) => b.level - a.level || a.onset - b.onset);
    this.alerts = alerts;
    repo.saveAlerts(alerts, cfg.timezone).catch(() => {});
  }

  overview() {
    const list = [...this.products.values()].map(compact);
    const byLevel = [0, 0, 0, 0];
    list.forEach((s) => { byLevel[s.level24h] += 1; });
    const pick = (fn) => list.filter((s) => isNum(fn(s))).sort((a, b) => fn(b) - fn(a))[0] || null;
    const gust = (s) => (isNum(s.current.windGust) ? s.current.windGust : s.current.windSpeed);
    return {
      generatedAt: new Date().toISOString(),
      status: this.statusReport(),
      stations: list,
      alerts: this.alerts,
      raining: list.filter((s) => s.rainNow).map((s) => s.name),
      national: {
        stations: list.length,
        byLevel,
        maxLevel: Math.max(0, ...list.map((s) => s.level24h)),
        raining: list.filter((s) => s.rainNow).length,
        hottest: pick((s) => s.current.temperature),
        windiest: pick(gust),
        wettest24h: pick((s) => s.rain24hMax.total),
      },
    };
  }

  stationDetail(key) {
    const st = this.station(key);
    if (!st) return null;
    const p = this.products.get(st.key);
    return p ? { ...p, observation: this.obs.get(st.key) || null, learnedBias: this.learned.get(st.key) || {} } : {
      station: st, pending: true, nodes: this.nodes.get(st.key) || [],
    };
  }

  statusReport() {
    return {
      ...this.status,
      started: this.started,
      tablesReady: repo.tablesReady(),
      ringRadiusKm: cfg.ringRadiusKm,
      ringNodes: cfg.ringNodeCount,
      forecastRefreshMin: cfg.forecastRefreshMin,
      nowcastRefreshMin: cfg.nowcastRefreshMin,
      provider: cfg.openMeteoKey ? 'Open-Meteo (paid key)' : 'Open-Meteo (free tier)',
      estimatedDailyForecastCalls: openMeteo.estimateDailyCalls({
        locations: this.status.nodes, models: cfg.models.length, refreshMin: cfg.forecastRefreshMin, days: cfg.forecastDays,
      }),
    };
  }

  /* ---------------------------------------------------------------- node admin */
  async refreshStation(key) {
    const st = this.station(key);
    if (!st) return null;
    const custom = (await repo.listCustomNodes()).filter((c) => c.station_name === st.name);
    this.nodes.set(st.key, buildNodes(st, { radiusKm: cfg.ringRadiusKm, count: cfg.ringNodeCount, custom }));
    this.status.nodes = [...this.nodes.values()].reduce((a, n) => a + n.length, 0);
    try {
      await this.fetchAndFuse([st]);
    } catch (err) {
      log.error(`refresh ${st.name}:`, err.message);
    }
    this.rebuild();
    return this.stationDetail(st.key);
  }

  /* ------------------------------------------------------------ point forecast */
  async pointForecast(lat, lon, { label = 'Custom point', radiusKm = cfg.ringRadiusKm } = {}) {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)},${radiusKm}`;
    const cached = this.pointCache.get(key);
    if (cached && Date.now() - cached.at < 30 * 60000) return cached.product;
    // Keeps map clicks from using up the free Open-Meteo quota (10 000 calls a day) that the
    // station forecasts need: each new point costs about 10 calls.
    const now10 = Date.now() - 10 * 60000;
    this.pointCalls = this.pointCalls.filter((t) => t > Date.now() - 24 * 3600000);
    if (this.pointCalls.length >= cfg.pointLimitPerDay) {
      const err = new Error('The daily number of point forecasts is used up. Station forecasts are not affected; try again tomorrow.');
      err.status = 429;
      throw err;
    }
    if (this.pointCalls.filter((t) => t > now10).length >= cfg.pointLimitPer10Min) {
      const err = new Error('Too many point forecasts in the last 10 minutes. Try again in a few minutes.');
      err.status = 429;
      throw err;
    }
    this.pointCalls.push(Date.now());
    const site = { key: `pt:${key}`, name: label, type: 'POINT', lat, lon, isHydro: false };
    const nodes = buildNodes(site, { radiusKm, count: cfg.ringNodeCount });
    const modelSeries = new Map();
    for (const model of cfg.models) {
      try {
        modelSeries.set(model, await openMeteo.fetchModel(nodes, {
          model, days: cfg.forecastDays, timezone: cfg.timezone, apiKey: cfg.openMeteoKey, callsPerMin: cfg.openMeteoCallsPerMin,
        }));
      } catch (err) {
        log.warn(`point forecast ${model} failed:`, err.message);
      }
    }
    if (!modelSeries.size) {
      const err = new Error('The forecast provider is not answering. Try again later.');
      err.status = 502;
      throw err;
    }
    const now = new Date();
    const fused = fuseStation({
      nodes, nodeWeights: idwWeights(nodes, { power: cfg.idwPower, radiusKm }), modelSeries, modelWeights: cfg.modelWeights, now,
    });
    if (!fused) {
      const err = new Error('No forecast data for this place.');
      err.status = 502;
      throw err;
    }
    // Borrow the learned bias of the nearest station within 40 km.
    const nearest = this.stations
      .map((s) => ({ s, d: haversineKm(lat, lon, s.lat, s.lon) }))
      .sort((a, b) => a.d - b.d)[0];
    const learned = nearest && nearest.d <= 40 ? this.learned.get(nearest.s.key) || {} : {};
    const corrected = applyCorrections(fused, { learned, decayHours: cfg.biasDecayHours, now });
    const centre = [...modelSeries.values()][0].get(nodes[0].id);
    const product = buildStationProduct({
      station: site, fused, corrected, obs: null, providerDaily: centre && centre.daily,
      timeZone: cfg.timezone, issuedAt: now.toISOString(), now,
    });
    product.nearestStation = nearest ? { name: nearest.s.name, distanceKm: Math.round(nearest.d * 10) / 10 } : null;
    this.pointCache.set(key, { at: Date.now(), product });
    if (this.pointCache.size > 200) this.pointCache.delete(this.pointCache.keys().next().value);
    return product;
  }
}

module.exports = new WeatherEngine();
module.exports.WeatherEngine = WeatherEngine;
