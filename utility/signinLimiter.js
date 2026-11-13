/**
 * Limits password guessing on the old sign-in routes (/signin, /sp_signin): after 10 failed
 * attempts for one address + e-mail, or 50 from one address, within 15 minutes, further attempts
 * get 429 until the window passes. A successful sign-in clears the count for that e-mail.
 * Kept in memory (resets when the server restarts), like the limiter of /auth2/signin.
 */
const WINDOW_MS = 15 * 60000;
const PER_ACCOUNT = 10;
const PER_ADDRESS = 50;
const fails = new Map(); // key -> [timestamps]

// The server takes connections directly (no proxy), so X-Forwarded-For would be the caller's own claim.
const ipOf = (req) => String(req.ip || (req.socket && req.socket.remoteAddress) || '');
function recent(key, now) {
  const list = (fails.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length) fails.set(key, list); else fails.delete(key);
  return list;
}

module.exports = function signinLimiter(req, res, next) {
  const now = Date.now();
  const ip = ipOf(req);
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  const accountKey = `a:${ip}:${email}`;
  const addressKey = `i:${ip}`;
  if (recent(accountKey, now).length >= PER_ACCOUNT || recent(addressKey, now).length >= PER_ADDRESS) {
    return res.status(429).send({ status: 'Error', data: { message: 'Too many failed sign-in attempts. Please wait 15 minutes and try again.', isLoggedIn: false } });
  }
  res.on('finish', () => {
    if (res.statusCode === 401) {
      [accountKey, addressKey].forEach((k) => fails.set(k, recent(k, Date.now()).concat(Date.now())));
      if (fails.size > 20000) fails.delete(fails.keys().next().value);
    } else if (res.statusCode === 200) {
      fails.delete(accountKey);
    }
  });
  return next();
};
