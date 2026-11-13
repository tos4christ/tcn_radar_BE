/**
 * Server-side sessions and audit trail for the *_fix pages (routes/auth2.js, routes/api2.js).
 *
 * - Sign-in creates a row in nas_sessions and an HttpOnly cookie holding a random id; the browser
 *   never sees a token it could leak, and signing out (or an admin revoke) ends it on the server.
 * - Every request checks the session in the database (cached 30 s), so a revoke applies within 30 s.
 * - kind 'kiosk' (grid page one / two wall screens) never expires; 'user' sessions last
 *   NAS_SESSION_HOURS (default 12).
 * - The existing /signin, /verifytoken and localStorage pages are not touched by any of this.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const COOKIE = 'nas_session';
const SESSION_HOURS = Number(process.env.NAS_SESSION_HOURS) > 0 ? Number(process.env.NAS_SESSION_HOURS) : 12;
const KIOSK_COOKIE_DAYS = 3650;
const CACHE_MS = 30000;
const TOUCH_MS = 60000;

const REALMS = {
  ncc: { table: 'users' },
  bilateral: { table: 'bilateral_users' },
};

const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');
const clip = (v, n) => (v === undefined || v === null ? null : String(v).slice(0, n));
const clientIp = (req) => clip(req.ip || (req.socket && req.socket.remoteAddress) || '', 64);
const userAgent = (req) => clip(req.headers['user-agent'] || '', 300);

// ---- schema -------------------------------------------------------------------------------
let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', '001_nas_auth_audit.sql'), 'utf8');
    schemaReady = db.query(sql).catch((err) => {
      schemaReady = null; // retry on the next request
      throw err;
    });
  }
  return schemaReady;
}

// ---- audit ----------------------------------------------------------------------------------
/** Never throws and never delays the response: an audit failure must not break the page. */
function audit(req, session, action, extra = {}) {
  const detail = extra.detail === undefined ? null : JSON.stringify(extra.detail).slice(0, 4000);
  ensureSchema()
    .then(() => db.query(
      'INSERT INTO nas_audit_log (session_id, realm, email, name, action, path, detail, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)',
      [
        session ? session.id : null,
        clip(extra.realm || (session && session.realm), 20),
        clip(extra.email || (session && session.email), 200),
        clip(session && session.name, 200),
        clip(action, 40),
        clip(extra.path || req.originalUrl, 300),
        detail,
        clientIp(req),
        userAgent(req),
      ],
    ))
    .catch((err) => console.error('audit log write failed:', err.message));
}

// ---- cookies ------------------------------------------------------------------------------
function setCookie(req, res, raw, kiosk) {
  res.cookie(COOKIE, raw, {
    httpOnly: true,
    secure: !!req.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: (kiosk ? KIOSK_COOKIE_DAYS * 24 : SESSION_HOURS) * 3600 * 1000,
  });
}
function clearCookie(req, res) {
  res.clearCookie(COOKIE, { httpOnly: true, secure: !!req.secure, sameSite: 'lax', path: '/' });
}

// ---- sessions -----------------------------------------------------------------------------
const cache = new Map(); // token hash -> { session, at }
const touched = new Map(); // session id -> last touch

async function createSession(req, res, { realm, kind, user }) {
  await ensureSchema();
  const raw = crypto.randomBytes(32).toString('hex');
  const kiosk = kind === 'kiosk';
  const { rows } = await db.query(
    `INSERT INTO nas_sessions (token_hash, realm, kind, email, name, role, ip, user_agent, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $9::boolean THEN NULL ELSE now() + make_interval(hours => $10::int) END)
     RETURNING id, realm, kind, email, name, role, created_at, expires_at`,
    [hashToken(raw), realm, kiosk ? 'kiosk' : 'user', user.email, user.name || null, user.role || null,
      clientIp(req), userAgent(req), kiosk, SESSION_HOURS],
  );
  setCookie(req, res, raw, kiosk);
  return rows[0];
}

/** The session for this request, or null. Never throws for a missing/expired cookie. */
async function readSession(req) {
  const raw = req.cookies && req.cookies[COOKIE];
  if (!raw || typeof raw !== 'string' || raw.length > 200) return null;
  const key = hashToken(raw);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.session;
  await ensureSchema();
  const { rows } = await db.query(
    `SELECT id, realm, kind, email, name, role, created_at, expires_at FROM nas_sessions
     WHERE token_hash = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
    [key],
  );
  const session = rows[0] || null;
  cache.set(key, { session, at: Date.now() });
  if (cache.size > 5000) cache.delete(cache.keys().next().value);
  if (session && Date.now() - (touched.get(session.id) || 0) > TOUCH_MS) {
    touched.set(session.id, Date.now());
    db.query('UPDATE nas_sessions SET last_seen_at = now() WHERE id = $1', [session.id]).catch(() => {});
  }
  return session;
}

async function revokeSession(req, res, session, reason) {
  const raw = req.cookies && req.cookies[COOKIE];
  if (raw) cache.delete(hashToken(raw));
  clearCookie(req, res);
  if (session) {
    await db.query('UPDATE nas_sessions SET revoked_at = now(), revoked_reason = $2 WHERE id = $1 AND revoked_at IS NULL', [session.id, reason]);
  }
}

/** Drop cached lookups so an admin revoke takes effect immediately on this server. */
function forgetCachedSessions() { cache.clear(); }

function isAdmin(session) {
  if (!session || session.realm !== 'ncc') return false;
  // With NAS_AUDIT_ADMINS set, only those e-mails are administrators. (Until the sign-up fix, anyone
  // could create an account with the role "Admin", so the role alone is trusted only when the list
  // is not set.)
  const admins = String(process.env.NAS_AUDIT_ADMINS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (admins.length) return admins.includes(String(session.email || '').toLowerCase());
  return /admin/i.test(String(session.role || ''));
}

/**
 * Express middleware. options.realms: realms allowed (default ['ncc']); options.admin: admins only.
 * Sets req.nasSession. Answers 401 (not signed in), 403 (wrong realm / not admin) or 503 (tables missing).
 */
function requireSession(options = {}) {
  const realms = options.realms || ['ncc'];
  return async (req, res, next) => {
    let session;
    try {
      session = await readSession(req);
    } catch (err) {
      console.error('session lookup failed:', err.message);
      return res.status(503).json({ status: 'error', error: 'Sign-in service unavailable. Please try again shortly.' });
    }
    if (!session) return res.status(401).json({ status: 'error', error: 'Please sign in.' });
    if (!realms.includes(session.realm)) return res.status(403).json({ status: 'error', error: 'This account cannot open this page.' });
    if (options.admin && !isAdmin(session)) return res.status(403).json({ status: 'error', error: 'Administrators only.' });
    req.nasSession = session;
    return next();
  };
}

/** State-changing calls must come from the app itself (a cross-site form cannot set this header). */
function requireAppHeader(req, res, next) {
  if (req.get('X-Requested-With') !== 'nas-fix') return res.status(400).json({ status: 'error', error: 'Bad request.' });
  return next();
}

module.exports = {
  REALMS,
  ensureSchema,
  audit,
  createSession,
  readSession,
  revokeSession,
  forgetCachedSessions,
  requireSession,
  requireAppHeader,
  isAdmin,
  clientIp,
};
