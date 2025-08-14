// app/nsong_uploader.js
'use strict';

require('dotenv').config();

const mssql = require('mssql');
const mydb = require('../database/db');               // pg.Pool instance (from your codebase)
const model = require('../models/lines');             // contains get_nsong_2
const dateFormatter = require('../utility/dateFormatter');
const refined_stations = require('../database/nsong_stations');
const axios = require('axios');

// --------------------------
// MSSQL: dedicated pool
// --------------------------
const sqlConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    port: Number(process.env.MSSQL_PORT),
    encrypt: true,
    trustServerCertificate: true,
    rowCollectionOnRequestCompletion: true,
  },
  // Optional tuning (uncomment/tune if needed):
  // pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

const sqlPool = new mssql.ConnectionPool(sqlConfig);
const sqlPoolConnectPromise = sqlPool.connect();

sqlPool.on('error', (err) => {
  console.error('[MSSQL pool error]', err);
});

// --------------------------
// Station mapping (same as yours, + two you added)
// --------------------------
const STATION_ID = {
  'RIVERS IPP (GAS)': 1,
  'AFAM VI (GAS/STEAM)': 2,
  'GEREGU (GAS)': 3,
  'OMOTOSHO (GAS)': 4,
  'OMOTOSHO NIPP (GAS)': 5,
  'JEBBA (HYDRO)': 6,
  'SAPELE NIPP (GAS)': 7,
  'OMOKU (GAS)': 8,
  'AZURA-EDO IPP (GAS)': 9,
  'OKPAI (GAS/STEAM)': 10,
  'GEREGU NIPP (GAS)': 11,
  'GBARAIN NIPP (GAS)': 12,
  'DADINKOWA G.S (HYDRO)': 13,
  'PARAS ENERGY (GAS)': 14,
  'IBOM POWER (GAS)': 15,
  'EGBIN (STEAM)': 16,
  'OLORUNSOGO (GAS)': 17,
  'OLORUNSOGO NIPP': 18,
  'SAPELE (STEAM)': 19,
  'ODUKPANI NIPP (GAS)': 20,
  'ALAOJI NIPP (GAS)': 21,
  'IHOVBOR NIPP (GAS)': 22,
  'TRANS-AMADI (GAS)': 23,
  'DELTA (GAS)': 24,
  'KAINJI (HYDRO)': 25,
  'SHIRORO (HYDRO)': 26,
  'AFAM IV & V (GAS)': 27,
  'ZUNGERU GS': 28,
  'TAOPEX GS': 29,
};

// --------------------------
// API sender with retry/backoff
// --------------------------
async function sendToApiWithRetry(payload, {
  attempts = 5,
  baseDelayMs = 1000, // 1s
  maxDelayMs = 15000, // 15s
} = {}) {
  const url = `https://settlement.onem.gov.ng/api/power_data`;

  const options = {
    method: 'POST',
    url,
    params: { 'api-version': '3.0' },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Authorization': `Bearer ${process.env.POWER_DATA}`,
    },
    data: payload,
    timeout: 15000, // be explicit
    validateStatus: (s) => s >= 200 && s < 500, // treat 5xx as retryable below
  };

  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await axios.request(options);
      if (resp.status >= 200 && resp.status < 300) {
        console.log('[API] OK', resp.status, resp.statusText);
        return resp.data;
      }
      // 4xx - generally not retryable (auth/validation)
      if (resp.status >= 400 && resp.status < 500) {
        console.error('[API] Non-retryable error', resp.status, resp.data);
        throw new Error(`Non-retryable API error: ${resp.status}`);
      }
      // 5xx - retryable
      lastErr = new Error(`Server error ${resp.status}`);
    } catch (err) {
      lastErr = err;
      console.warn(`[API] Attempt ${i + 1} failed: ${err.message}`);
    }
    // backoff with jitter
    const delay = Math.min(maxDelayMs, baseDelayMs * (2 ** i)) * (0.75 + Math.random() * 0.5);
    await new Promise((r) => setTimeout(r, delay));
  }
  console.error('[API] All retry attempts failed');
  throw lastErr;
}

// --------------------------
// Helpers
// --------------------------
function uniqueByStationAndLine(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = `${r.station}-${r.line_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

// Align to the next quarter-hour boundary after "offsetMs" (default 0)
// Returns ms to wait from NOW.
function msUntilNextQuarter(offsetMs = 0) {
  const now = new Date(Date.now() + offsetMs);
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const nextQuarterMinute = Math.ceil((minutes + seconds / 60 + ms / 60000) / 15) * 15;
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(nextQuarterMinute);
  // if we were exactly on a quarter and offset pushed us past it, next will be correct
  const wait = next.getTime() - now.getTime();
  return wait >= 0 ? wait : wait + 15 * 60 * 1000;
}

// run-to-completion guard
let isRunning = false;

// --------------------------
// Core job
// --------------------------
async function runOnce() {
  if (isRunning) {
    console.warn('[Scheduler] Previous run still in progress; skipping this tick.');
    return;
  }
  isRunning = true;
  const startedAt = new Date();
  console.log(`[Job] Start ${startedAt.toISOString()}`);

  const { date, Hour, Minute } = dateFormatter();
  let pgClient;

  try {
    // 1) Fetch from Postgres (with safe release)
    pgClient = await new Promise((resolve, reject) => {
      mydb.connect((err, client, done) => {
        if (err) return reject(err);
        // Wrap client so we can always call done() in finally
        client._release = done;
        resolve(client);
      });
    });

    const params = [date, Number(Hour), Number(Minute), (Number(Minute) + 5), 0, 59];
    
    console.log('[Debug] Params to get_nsong_2:', params);
    console.log('[Debug] Query:', model.get_nsong_2);

    const respo = await pgClient.query(model.get_nsong_2, params);
    console.log(`[Job] PG query complete, rows=${respo.rows.length}`);

    // 2) Transform: unique station/line, refine, map to array, filter valid seconds
    const filteredStationArray = uniqueByStationAndLine(respo.rows);
    const refined = refined_stations(filteredStationArray);
    const finalArray = Object.values(refined).filter((t) => t.seconds !== null);

    console.log(`[Job] Final array size=${finalArray.length}`);

    if (finalArray.length === 0) {
      console.log('[Job] Nothing to insert/send this cycle.');
      return;
    }

    // 3) Prepare single MSSQL bulk
    await sqlPoolConnectPromise; // ensure pool is connected
    const table = new mssql.Table('generation');
    table.create = false; // existing table

    // Keep types aligned with your original usage
    table.columns.add('gencoid', mssql.Int);
    table.columns.add('genconame', mssql.Text);   // if Text causes issues on your server, switch to mssql.NVarChar(mssql.MAX)
    table.columns.add('gentime', mssql.BigInt);
    table.columns.add('gendate', mssql.Date);
    table.columns.add('amp', mssql.Float);
    table.columns.add('kv', mssql.Float);
    table.columns.add('genhour', mssql.Int);
    table.columns.add('genminute', mssql.Int);
    table.columns.add('genseconds', mssql.Int);
    table.columns.add('mw', mssql.Float);
    table.columns.add('mvar', mssql.Float);

    // Add rows in one go
    for (const dt of finalArray) {
      const { station, kv, mw, amp, time, /* seconds, */ mvar } = dt;
      const id = STATION_ID[station];
      if (!id) continue; // skip unknown stations to avoid runtime errors

      table.rows.add(
        id,               // gencoid
        station,          // genconame
        time,             // gentime
        date,             // gendate
        amp,              // amp
        kv,               // kv
        Number(Hour),     // genhour
        Number(Minute),   // genminute
        0,                // genseconds (kept as in your code)
        mw,               // mw
        mvar ?? null      // mvar (null-safe)
      );
    }

    if (table.rows.length > 0) {
      const request = new mssql.Request(sqlPool);
      await request.bulk(table);
      console.log(`[Job] MSSQL bulk insert OK (${table.rows.length} rows)`);
    } else {
      console.log('[Job] No rows matched known stations; MSSQL bulk skipped.');
    }

    // 4) Send to external API with retry (if needed)
    //    If you only want to send a subset, you can transform here.
    try {
    //   await sendToApiWithRetry(finalArray);
    } catch (apiErr) {
    //   console.error('[Job] API send failed after retries:', apiErr.message);
      // Optionally persist to a dead-letter store or disk for later reprocessing
    }
  } catch (err) {
    console.error('[Job] Error:', err);
  } finally {
    // release PG client
    try {
      if (pgClient && typeof pgClient._release === 'function') pgClient._release();
    } catch (e) {
      console.warn('[Job] PG client release warning:', e.message);
    }
    isRunning = false;
    console.log(`[Job] End ${new Date().toISOString()} (duration ~${Math.round((Date.now() - startedAt.getTime()) / 1000)}s)`);
  }
}

// --------------------------
// Scheduler: align to quarter hour, no overlap
// --------------------------
async function schedulerLoop() {
  // First run: align to next quarter
  const wait = msUntilNextQuarter();
  console.log(`[Scheduler] First run in ${(wait / 1000).toFixed(1)}s`);
  setTimeout(async function tick() {
    await runOnce();
    // Schedule next tick aligned to the *next* quarter-hour boundary
    const nextWait = msUntilNextQuarter();
    console.log(`[Scheduler] Next run in ${(nextWait / 1000).toFixed(1)}s`);
    setTimeout(tick, nextWait);
  }, wait);
}

// --------------------------
// Startup
// --------------------------
(async function start() {
  console.log('[App] Booting...');
  try {
    await sqlPoolConnectPromise;
    console.log('[MSSQL] Connected (pool ready)');
  } catch (e) {
    console.error('[MSSQL] Initial connect failed:', e);
    // We still proceed; the pool will emit errors if used before connected
  }

  // Optional: basic env sanity checks
  const requiredEnv = ['MSSQL_USER', 'MSSQL_PASSWORD', 'MSSQL_SERVER', 'MSSQL_DATABASE', 'MSSQL_PORT', 'POWER_DATA'];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn('[Env] Missing variables:', missing.join(', '));
  }

  schedulerLoop();
})();

// --------------------------
// Graceful shutdown
// --------------------------
process.on('SIGINT', async () => {
  console.log('\n[App] SIGINT received, shutting down...');
  try { await sqlPool.close(); } catch (_) {}
  try { await mydb.end?.(); } catch (_) {}
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[App] SIGTERM received, shutting down...');
  try { await sqlPool.close(); } catch (_) {}
  try { await mydb.end?.(); } catch (_) {}
  process.exit(0);
});
