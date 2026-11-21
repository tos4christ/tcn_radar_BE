/**
 * /api2/axis/* - arrangement of the Ikorodu-Sagamu axis flow diagram on /bilaterals and /bilaterals_fix.
 *
 * The page is public (no sign-in), so:
 *  - anyone can READ the saved arrangement (GET /api2/axis/layout);
 *  - CHANGING it needs the lock password. The password is never stored or compared in the browser:
 *    the server keeps only a salted scrypt hash (AXIS_LOCK_HASH in .env overrides the built-in one,
 *    see utility/makeAxisLockHash.js), compares in constant time, rate-limits wrong attempts, and on
 *    success gives an HttpOnly cookie that unlocks for UNLOCK_MINUTES. Every unlock, failure and save
 *    goes to the audit log.
 *  - the password can be changed on the page (old password + new one twice). The new hash is kept in
 *    nas_axis_lock (migration 005) and then wins over AXIS_LOCK_HASH and the built-in hash.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const S = require('../utility/nasSession');

const LAYOUT_NAME = 'ikorodu-sagamu';
// scrypt of the lock password. Replace by setting AXIS_LOCK_HASH (output of utility/makeAxisLockHash.js).
const BUILT_IN_HASH = 'scrypt$953c3fad465105c2034d56ce9d4962f8$73b8c6602aea24d4b866b39eaa886663eb2e2053dbb36424b9b9d607a9a91b6d';
const COOKIE = 'nas_axis_unlock';
const COOKIE_PATH = '/api2/axis';
const UNLOCK_MINUTES = 30;
const FAIL_WINDOW_MS = 15 * 60000;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_TOTAL = 30;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 100;
const HASH_RE = /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/;

/** Every meter the diagram knows. Keep in step with NODES in the frontend (Fix/axis/axisModel.js). */
const NODE_KEYS = [
  'ikorodu1', 'ikorodu2', 'sagamu1', 'sagamu2', 'taopex', 'paras',
  'pheonix', 'afl', 'monarch', 'quantum', 'kamSteel', 'larfarge', 'topSteel', 'sunflag', 'pulkit', 'starPipe',
  'monarchOgijo', 'monarchOdogunyan', 'odogunyan', 'sagamuSteel',
];
const DIRS = ['in', 'out', 'absIn', 'absOut'];

const fail = (res, status, error) => res.status(status).json({ status: 'error', error });

/* ------------------------------------------------------------------ storage */
let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', '004_axis_layout.sql'), 'utf8');
    tableReady = db.query(sql).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

/** Checks and cleans a layout sent by the page. Returns { layout } or { error }. */
function cleanLayout(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Layout missing.' };
  const tlf = Number(input.tlfPct);
  if (!Number.isFinite(tlf) || tlf < 0 || tlf > 20) return { error: 'TLF must be between 0 and 20 %.' };
  const nodesIn = input.nodes;
  if (!nodesIn || typeof nodesIn !== 'object' || Array.isArray(nodesIn)) return { error: 'Layout has no stations.' };
  const unknown = Object.keys(nodesIn).filter((k) => !NODE_KEYS.includes(k));
  if (unknown.length) return { error: `Unknown station: ${unknown[0].slice(0, 40)}` };
  const nodes = {};
  for (const key of NODE_KEYS) {
    const n = nodesIn[key];
    if (!n) continue;
    const line = Number(n.line);
    const pos = Number(n.pos);
    if (![0, 1, 2].includes(line)) return { error: `${key}: line must be 0, 1 or 2.` };
    if (!Number.isInteger(pos) || pos < 0 || pos > 999) return { error: `${key}: position out of range.` };
    if (!DIRS.includes(n.dir)) return { error: `${key}: unknown direction.` };
    nodes[key] = { line, pos, dir: n.dir, include: n.include !== false };
  }
  // Ikorodu bus coupler between Line 1 and Line 2 (set by hand; open unless saved closed).
  const c = input.coupler;
  if (c !== undefined && (c === null || typeof c !== 'object' || Array.isArray(c) || (c.closed !== undefined && typeof c.closed !== 'boolean'))) {
    return { error: 'Bus coupler state must be open or closed.' };
  }
  return { layout: { tlfPct: Math.round(tlf * 100) / 100, nodes, coupler: { closed: Boolean(c && c.closed === true) } } };
}

/* ------------------------------------------------------------------ password and unlock */
const SCRYPT = { N: 16384, r: 8, p: 1 };
const scrypt = (password, salt, len) => new Promise((resolve, reject) => {
  crypto.scrypt(String(password), salt, len, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)));
});

/** The hash from .env or the built-in one: used while no password has been changed on the page. */
function configuredHash() {
  const v = String(process.env.AXIS_LOCK_HASH || '').trim();
  return HASH_RE.test(v) ? v : BUILT_IN_HASH;
}

/**
 * The hash in force. A password changed on the page (nas_axis_lock) wins. If that table does not
 * exist yet, no password was ever changed, so the configured one applies. Any other database error
 * throws: falling back then could let an old, replaced password back in.
 */
async function expectedHash() {
  try {
    const { rows } = await db.query('SELECT hash FROM nas_axis_lock WHERE name = $1', [LAYOUT_NAME]);
    if (rows[0] && HASH_RE.test(rows[0].hash)) return rows[0].hash;
    return configuredHash();
  } catch (err) {
    if (err.code === '42P01') return configuredHash(); // undefined_table
    throw err;
  }
}

async function passwordMatches(given, hash) {
  const [, saltHex, hashHex] = (hash || await expectedHash()).split('$');
  const want = Buffer.from(hashHex, 'hex');
  try {
    const got = await scrypt(given, Buffer.from(saltHex, 'hex'), want.length);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch (e) {
    return false;
  }
}

async function makeHash(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 32);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

let lockTableReady = null;
function ensureLockTable() {
  if (!lockTableReady) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', '005_axis_lock.sql'), 'utf8');
    lockTableReady = db.query(sql).catch((err) => { lockTableReady = null; throw err; });
  }
  return lockTableReady;
}

const failures = new Map(); // ip -> [timestamps]
let allFailures = [];
const recent = (list) => list.filter((t) => Date.now() - t < FAIL_WINDOW_MS);
function blocked(ip) {
  allFailures = recent(allFailures);
  const mine = recent(failures.get(ip) || []);
  failures.set(ip, mine);
  return mine.length >= MAX_FAILS_PER_IP || allFailures.length >= MAX_FAILS_TOTAL;
}
function noteFailure(ip) {
  const mine = recent(failures.get(ip) || []);
  mine.push(Date.now());
  failures.set(ip, mine);
  allFailures.push(Date.now());
  if (failures.size > 5000) failures.delete(failures.keys().next().value);
}

const unlocks = new Map(); // sha256(token) -> expiry ms
const tokenHash = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');
function unlockedUntil(req) {
  const raw = req.cookies && req.cookies[COOKIE];
  if (!raw || typeof raw !== 'string' || raw.length > 200) return 0;
  const key = tokenHash(raw);
  const exp = unlocks.get(key) || 0;
  if (exp && exp < Date.now()) unlocks.delete(key);
  return exp > Date.now() ? exp : 0;
}
const cookieOptions = (req) => ({ httpOnly: true, secure: !!req.secure, sameSite: 'strict', path: COOKIE_PATH });

/* ------------------------------------------------------------------ handlers */
async function getLayout(req, res) {
  try {
    await ensureTable();
    const { rows } = await db.query('SELECT layout, version, updated_at FROM nas_axis_layout WHERE name = $1', [LAYOUT_NAME]);
    const row = rows[0];
    const until = unlockedUntil(req);
    return res.json({ status: 'Success', data: {
      layout: row ? row.layout : null, version: row ? row.version : 0, updatedAt: row ? row.updated_at : null,
      unlocked: Boolean(until), unlockedUntil: until ? new Date(until).toISOString() : null,
    } });
  } catch (err) {
    console.error('axis getLayout failed:', err.message);
    return fail(res, 503, 'The saved arrangement could not be read. The default arrangement is shown.');
  }
}

async function unlock(req, res) {
  const ip = S.clientIp(req) || 'unknown';
  if (blocked(ip)) {
    S.audit(req, null, 'axis_unlock_blocked', { realm: 'public' });
    return fail(res, 429, 'Too many wrong attempts. Try again in 15 minutes.');
  }
  const password = (req.body || {}).password;
  if (typeof password !== 'string' || !password || password.length > MAX_PASSWORD) return fail(res, 400, 'Enter the password.');
  let ok;
  try {
    ok = await passwordMatches(password);
  } catch (err) {
    console.error('axis unlock: password could not be read:', err.message);
    return fail(res, 503, 'The password could not be checked right now. Try again.');
  }
  if (!ok) {
    noteFailure(ip);
    S.audit(req, null, 'axis_unlock_failed', { realm: 'public' });
    return fail(res, 401, 'Wrong password.');
  }
  const raw = crypto.randomBytes(32).toString('hex');
  const exp = Date.now() + UNLOCK_MINUTES * 60000;
  unlocks.set(tokenHash(raw), exp);
  if (unlocks.size > 1000) unlocks.delete(unlocks.keys().next().value);
  failures.delete(ip);
  res.cookie(COOKIE, raw, { ...cookieOptions(req), maxAge: UNLOCK_MINUTES * 60000 });
  S.audit(req, null, 'axis_unlock', { realm: 'public' });
  return res.json({ status: 'Success', data: { unlocked: true, unlockedUntil: new Date(exp).toISOString() } });
}

function lock(req, res) {
  const raw = req.cookies && req.cookies[COOKIE];
  if (raw && typeof raw === 'string') unlocks.delete(tokenHash(raw));
  res.clearCookie(COOKIE, cookieOptions(req));
  return res.json({ status: 'Success', data: { unlocked: false } });
}

function requireUnlock(req, res, next) {
  if (!unlockedUntil(req)) return fail(res, 401, 'Locked. Click the lock and enter the password to make changes.');
  return next();
}

async function saveLayout(req, res) {
  const body = req.body || {};
  const { layout, error } = cleanLayout(body.layout);
  if (error) return fail(res, 400, error);
  const baseVersion = Number(body.version);
  if (!Number.isInteger(baseVersion) || baseVersion < 0) return fail(res, 400, 'Version missing.');
  try {
    await ensureTable();
    // Only save on top of the version this page loaded, so two people cannot overwrite each other.
    const { rows } = await db.query(
      `INSERT INTO nas_axis_layout (name, layout, version, updated_at, updated_ip)
       SELECT $1, $2::jsonb, 1, now(), $4 WHERE $3::int = 0 AND NOT EXISTS (SELECT 1 FROM nas_axis_layout WHERE name = $1)
       ON CONFLICT (name) DO NOTHING
       RETURNING version, updated_at`,
      [LAYOUT_NAME, JSON.stringify(layout), baseVersion, S.clientIp(req)],
    );
    let saved = rows[0];
    if (!saved) {
      const upd = await db.query(
        `UPDATE nas_axis_layout SET layout = $2::jsonb, version = version + 1, updated_at = now(), updated_ip = $4
         WHERE name = $1 AND version = $3 RETURNING version, updated_at`,
        [LAYOUT_NAME, JSON.stringify(layout), baseVersion, S.clientIp(req)],
      );
      saved = upd.rows[0];
    }
    if (!saved) return fail(res, 409, 'Someone saved a different arrangement meanwhile. Reload the page and make your change again.');
    S.audit(req, null, 'axis_layout_save', { realm: 'public', detail: { version: saved.version, tlfPct: layout.tlfPct } });
    return res.json({ status: 'Success', data: { layout, version: saved.version, updatedAt: saved.updated_at } });
  } catch (err) {
    console.error('axis saveLayout failed:', err.message);
    return fail(res, 503, 'The arrangement could not be saved. Try again.');
  }
}

/**
 * POST /api2/axis/password { oldPassword, newPassword, confirmPassword }. Needs the current password
 * (same rate limit as unlocking). Afterwards every other unlocked browser is locked again.
 */
async function changePassword(req, res) {
  const ip = S.clientIp(req) || 'unknown';
  if (blocked(ip)) {
    S.audit(req, null, 'axis_password_blocked', { realm: 'public' });
    return fail(res, 429, 'Too many wrong attempts. Try again in 15 minutes.');
  }
  const { oldPassword, newPassword, confirmPassword } = req.body || {};
  if (typeof oldPassword !== 'string' || !oldPassword || oldPassword.length > MAX_PASSWORD) return fail(res, 400, 'Enter the current password.');
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD || newPassword.length > MAX_PASSWORD) {
    return fail(res, 400, `The new password must be ${MIN_PASSWORD} to ${MAX_PASSWORD} characters.`);
  }
  if (newPassword.trim() !== newPassword) return fail(res, 400, 'The new password cannot start or end with a space.');
  if (newPassword !== confirmPassword) return fail(res, 400, 'The two new passwords do not match.');
  if (newPassword === oldPassword) return fail(res, 400, 'The new password is the same as the current one.');
  let ok;
  try {
    ok = await passwordMatches(oldPassword);
  } catch (err) {
    console.error('axis changePassword: password could not be read:', err.message);
    return fail(res, 503, 'The password could not be checked right now. Try again.');
  }
  if (!ok) {
    noteFailure(ip);
    S.audit(req, null, 'axis_password_change_failed', { realm: 'public' });
    return fail(res, 401, 'The current password is wrong.');
  }
  try {
    await ensureLockTable();
    const hash = await makeHash(newPassword);
    await db.query(
      `INSERT INTO nas_axis_lock (name, hash, updated_at, updated_ip) VALUES ($1, $2, now(), $3)
       ON CONFLICT (name) DO UPDATE SET hash = EXCLUDED.hash, updated_at = now(), updated_ip = EXCLUDED.updated_ip`,
      [LAYOUT_NAME, hash, ip],
    );
  } catch (err) {
    console.error('axis changePassword failed:', err.message);
    return fail(res, 503, 'The new password could not be saved, so the old one still applies. If this keeps happening, run database/migrations/005_axis_lock.sql on the database.');
  }
  // Lock every other browser that was unlocked with the old password; keep this one as it was.
  const raw = req.cookies && req.cookies[COOKIE];
  const mine = raw && typeof raw === 'string' ? tokenHash(raw) : null;
  const myExp = mine ? unlocks.get(mine) : null;
  unlocks.clear();
  if (mine && myExp && myExp > Date.now()) unlocks.set(mine, myExp);
  failures.delete(ip);
  S.audit(req, null, 'axis_password_change', { realm: 'public' });
  return res.json({ status: 'Success', data: { changed: true } });
}

module.exports = { getLayout, unlock, lock, requireUnlock, saveLayout, changePassword, cleanLayout, passwordMatches, makeHash, NODE_KEYS };
