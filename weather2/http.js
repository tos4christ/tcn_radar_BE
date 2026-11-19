/**
 * JSON GET with timeout and bounded retry (network errors, 429 and 5xx only).
 * Uses axios (already used by this backend for OpenWeatherMap), so it runs on any Node version the
 * server has. Error messages never contain the URL, so API keys are not written to the logs.
 */
const axiosLib = require('axios');

const axios = axiosLib.default || axiosLib;

async function getJson(url, { timeoutMs = 20000, retries = 2, label = 'request' } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await axios.get(url, {
        timeout: timeoutMs,
        headers: { accept: 'application/json' },
        validateStatus: () => true,
        responseType: 'text',
        transformResponse: [(d) => d],
        maxContentLength: 100 * 1024 * 1024,
      });
      const text = typeof res.data === 'string' ? res.data : String(res.data || '');
      if (res.status >= 200 && res.status < 300) {
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(`${label}: the answer was not JSON`);
        }
      }
      lastErr = new Error(`${label} HTTP ${res.status}: ${text.slice(0, 200)}`);
      lastErr.status = res.status;
      lastErr.retryAfter = res.headers && res.headers['retry-after'];
      if (res.status !== 429 && res.status < 500) throw lastErr;
    } catch (err) {
      if (err.status) lastErr = err;
      else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') lastErr = new Error(`${label} timed out after ${timeoutMs} ms`);
      else lastErr = new Error(`${label}: ${err.code || err.message}`);
      if (lastErr.status && lastErr.status !== 429 && lastErr.status < 500) throw lastErr;
    }
    if (attempt === retries) break;
    // 429 = rate limit: Open-Meteo asks for one minute, so retrying sooner only burns quota.
    const wait = lastErr && lastErr.status === 429 ? (Number(lastErr.retryAfter) || 61) * 1000 : 1000 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait));
  }
  throw lastErr;
}

/** Run async `fn` over `items` with at most `limit` in flight. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i;
      i += 1;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { getJson, mapLimit, sleep };
