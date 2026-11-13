/**
 * /auth2: server-side sign in / sign out / audit for the *_fix pages.
 * Uses the same users and bilateral_users tables and bcrypt hashes as /signin and /sp_signin.
 */
const bcrypt = require('bcrypt');
const db = require('../database/db');
const S = require('../utility/nasSession');

const auth2 = {};

const str = (v, max) => (typeof v === 'string' && v.length <= max ? v : null);

// ---- failed sign-in throttle (per IP + email, and per IP) -----------------------------------
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map();
function failureCount(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) return 0;
  return f.count;
}
function addFailure(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else f.count += 1;
  if (failures.size > 10000) failures.delete(failures.keys().next().value);
}

async function findUser(table, email) {
  const exact = await db.query(`SELECT * FROM ${table} WHERE email = $1 LIMIT 2`, [email]);
  if (exact.rows.length === 1) return exact.rows[0];
  if (exact.rows.length > 1) return null;
  // Same e-mail typed with different capitals: accept only when it matches exactly one account.
  const loose = await db.query(`SELECT * FROM ${table} WHERE lower(email) = lower($1) LIMIT 2`, [email]);
  return loose.rows.length === 1 ? loose.rows[0] : null;
}

const publicUser = (s, extra = {}) => ({
  name: s.name, email: s.email, role: s.role, realm: s.realm, kind: s.kind,
  expiresAt: s.expires_at, isAdmin: S.isAdmin(s), ...extra,
});

auth2.signin = async (req, res) => {
  const email = str(req.body && req.body.email, 200);
  const password = str(req.body && req.body.password, 200);
  const realm = (req.body && req.body.realm) === 'bilateral' ? 'bilateral' : 'ncc';
  const kiosk = realm === 'ncc' && req.body && req.body.kiosk === true;
  if (!email || !password || !email.trim() || !password.length) {
    return res.status(400).json({ status: 'error', error: 'Enter your e-mail and password.' });
  }
  const ip = S.clientIp(req);
  const pairKey = `${ip}|${email.trim().toLowerCase()}`;
  if (failureCount(pairKey) >= 10 || failureCount(ip) >= 50) {
    S.audit(req, null, 'signin_blocked', { realm, email: email.trim(), detail: { reason: 'too many failed attempts' } });
    return res.status(429).json({ status: 'error', error: 'Too many failed attempts. Wait 15 minutes and try again.' });
  }
  try {
    const user = await findUser(S.REALMS[realm].table, email.trim());
    const ok = !!(user && typeof user.password === 'string' && await bcrypt.compare(password, user.password));
    if (!ok) {
      addFailure(pairKey);
      addFailure(ip);
      S.audit(req, null, 'signin_failed', { realm, email: email.trim(), detail: { reason: user ? 'wrong password' : 'unknown e-mail' } });
      return res.status(401).json({ status: 'error', error: 'E-mail or password is incorrect.' });
    }
    failures.delete(pairKey);
    const session = await S.createSession(req, res, { realm, kind: kiosk ? 'kiosk' : 'user', user });
    S.audit(req, session, 'signin', { detail: { kind: session.kind } });
    return res.status(200).json({ status: 'Success', data: { user: publicUser(session) } });
  } catch (err) {
    console.error('auth2 signin failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'Sign-in service unavailable. Please try again shortly.' });
  }
};

auth2.signout = async (req, res) => {
  try {
    const session = await S.readSession(req);
    if (session) S.audit(req, session, 'signout', { detail: { kind: session.kind } });
    await S.revokeSession(req, res, session, 'signed out');
  } catch (err) {
    console.error('auth2 signout failed:', err.message);
  }
  return res.status(200).json({ status: 'Success' });
};

auth2.me = (req, res) => res.status(200).json({ status: 'Success', data: { user: publicUser(req.nasSession) } });

const ACTIONS = ['page_view', 'query', 'download', 'export', 'view_detail', 'ui', 'client_error'];
auth2.activity = (req, res) => {
  const events = Array.isArray(req.body && req.body.events) ? req.body.events.slice(0, 50) : [];
  events.forEach((e) => {
    if (!e || !ACTIONS.includes(e.action)) return;
    S.audit(req, req.nasSession, e.action, { path: str(e.path, 300) || undefined, detail: e.detail && typeof e.detail === 'object' ? e.detail : undefined });
  });
  return res.status(200).json({ status: 'Success', data: { accepted: events.length } });
};

auth2.password = async (req, res) => {
  const current = str(req.body && req.body.current, 200);
  const next = str(req.body && req.body.next, 200);
  if (!current || !next) return res.status(400).json({ status: 'error', error: 'Enter your current and new password.' });
  if (next.length < 8) return res.status(400).json({ status: 'error', error: 'The new password must be at least 8 characters.' });
  if (next === current) return res.status(400).json({ status: 'error', error: 'The new password must be different.' });
  const s = req.nasSession;
  const table = S.REALMS[s.realm].table;
  try {
    const { rows } = await db.query(`SELECT password FROM ${table} WHERE email = $1 LIMIT 2`, [s.email]);
    if (rows.length !== 1 || !await bcrypt.compare(current, rows[0].password || '')) {
      S.audit(req, s, 'password_change_failed', { detail: { reason: 'wrong current password' } });
      return res.status(401).json({ status: 'error', error: 'Your current password is incorrect.' });
    }
    const hash = await bcrypt.hash(next, 10);
    await db.query(`UPDATE ${table} SET password = $1 WHERE email = $2`, [hash, s.email]);
    // Sign out every other device of this account.
    await db.query("UPDATE nas_sessions SET revoked_at = now(), revoked_reason = 'password changed' WHERE email = $1 AND realm = $2 AND id <> $3 AND revoked_at IS NULL", [s.email, s.realm, s.id]);
    S.forgetCachedSessions();
    S.audit(req, s, 'password_changed');
    return res.status(200).json({ status: 'Success', data: { message: 'Password changed. Other devices have been signed out.' } });
  } catch (err) {
    console.error('auth2 password failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'Could not change the password. Please try again.' });
  }
};

// ---- admin ------------------------------------------------------------------------------------
const isoOrNull = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

auth2.auditLog = async (req, res) => {
  const q = req.query || {};
  const where = [];
  const vals = [];
  // Every ? in one condition refers to the same value.
  const add = (sql, v) => { vals.push(v); where.push(sql.split('?').join(`$${vals.length}`)); };
  const from = isoOrNull(q.from);
  const to = isoOrNull(q.to);
  if (from) add('at >= ?', from);
  if (to) add('at <= ?', to);
  if (str(q.email, 200)) add('email ILIKE ?', `%${q.email}%`);
  if (str(q.action, 40)) add('action = ?', q.action);
  if (str(q.q, 200)) add('(path ILIKE ? OR detail::text ILIKE ?)', `%${q.q}%`);
  if (/^\d+$/.test(String(q.before || ''))) add('id < ?', Number(q.before));
  const limit = Math.min(500, Math.max(1, Number(q.limit) || 200));
  try {
    const { rows } = await db.query(
      `SELECT id, at, session_id, realm, email, name, action, path, detail, ip, user_agent FROM nas_audit_log
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT ${limit}`,
      vals,
    );
    return res.json({ status: 'Success', data: { rows, more: rows.length === limit } });
  } catch (err) {
    console.error('audit list failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'Could not read the audit log.' });
  }
};

auth2.auditSummary = async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));
  try {
    const [byDay, byUser] = await Promise.all([
      db.query(
        `SELECT to_char(date_trunc('day', at AT TIME ZONE 'Africa/Lagos'), 'YYYY-MM-DD') AS day, action, count(*)::int AS n
         FROM nas_audit_log WHERE at > now() - make_interval(days => $1::int) GROUP BY 1, 2 ORDER BY 1`, [days]),
      db.query(
        `SELECT email, max(name) AS name, count(*) FILTER (WHERE action = 'signin')::int AS signins,
                count(*) FILTER (WHERE action = 'signin_failed')::int AS failed,
                count(*) FILTER (WHERE action NOT IN ('signin','signin_failed','signout','signin_blocked'))::int AS activity,
                max(at) AS last_at
         FROM nas_audit_log WHERE at > now() - make_interval(days => $1::int) AND email IS NOT NULL
         GROUP BY email ORDER BY last_at DESC LIMIT 200`, [days]),
    ]);
    return res.json({ status: 'Success', data: { days, byDay: byDay.rows, byUser: byUser.rows } });
  } catch (err) {
    console.error('audit summary failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'Could not read the audit summary.' });
  }
};

auth2.sessions = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, realm, kind, email, name, role, ip, user_agent, created_at, last_seen_at, expires_at FROM nas_sessions
       WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()) ORDER BY last_seen_at DESC LIMIT 500`);
    return res.json({ status: 'Success', data: { rows, currentId: req.nasSession.id } });
  } catch (err) {
    console.error('session list failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'Could not read sessions.' });
  }
};

auth2.revoke = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ status: 'error', error: 'Bad session id.' });
  try {
    const { rows } = await db.query(
      "UPDATE nas_sessions SET revoked_at = now(), revoked_reason = 'revoked by ' || $2 WHERE id = $1 AND revoked_at IS NULL RETURNING id, email, kind",
      [id, req.nasSession.email]);
    S.forgetCachedSessions();
    if (rows[0]) S.audit(req, req.nasSession, 'session_revoked', { detail: { sessionId: id, email: rows[0].email, kind: rows[0].kind } });
    return res.json({ status: 'Success', data: { revoked: rows.length } });
  } catch (err) {
    console.error('session revoke failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'Could not revoke the session.' });
  }
};

module.exports = auth2;
