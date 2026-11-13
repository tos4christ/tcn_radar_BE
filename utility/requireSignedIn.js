/**
 * Lets a request through when the caller is signed in, by either:
 *   - the sign-in token of the old pages (Authorization: Bearer <token>, signed with TOKENKEY or
 *     TOKENKEY_BILATERAL), as utility/jwtCheck.js does, or
 *   - the server session cookie of the *_fix pages (utility/nasSession.js).
 * Used on routes that were open to anyone. The old pages already send the token, so they keep
 * working; a caller with neither gets 401.
 *
 *   router.post('/tem', requireSignedIn(), controller.getdaily);
 *   router.put('/', requireSignedIn({ realm: 'bilateral' }), controller.put);
 *
 * Sets req.signedIn = { via: 'token' | 'session', email, name, realm, payload?, session? }.
 */
const jwt = require('jsonwebtoken');
const S = require('./nasSession');

const KEYS = { ncc: 'TOKENKEY', bilateral: 'TOKENKEY_BILATERAL' };

function bearer(req) {
  const h = req.headers.authorization;
  if (!h || typeof h !== 'string') return null;
  const t = h.split(' ')[1] || h;
  return t && t !== 'null' && t !== 'undefined' ? t : null;
}

module.exports = function requireSignedIn({ realm = 'ncc', allowNccForBilateral = false } = {}) {
  return async (req, res, next) => {
    const token = bearer(req);
    if (token) {
      const keys = [KEYS[realm]].concat(allowNccForBilateral && realm === 'bilateral' ? [KEYS.ncc] : []);
      for (const k of keys) {
        if (!process.env[k]) continue;
        try {
          const payload = jwt.verify(token, process.env[k]);
          req.payload = payload;
          req.signedIn = { via: 'token', realm: k === KEYS.ncc ? 'ncc' : 'bilateral', email: payload.email || null, name: payload.sub || null, payload };
          return next();
        } catch (e) { /* try the next key, then the session */ }
      }
    }
    try {
      const session = await S.readSession(req);
      if (session && (session.realm === realm || (allowNccForBilateral && session.realm === 'ncc'))) {
        req.nasSession = session;
        req.signedIn = { via: 'session', realm: session.realm, email: session.email, name: session.name, session };
        return next();
      }
    } catch (e) {
      console.error('requireSignedIn: session check failed:', e.message);
    }
    return res.status(401).json({ status: 'error', error: 'Unauthorized access, you need to be logged in as a registered user' });
  };
};
