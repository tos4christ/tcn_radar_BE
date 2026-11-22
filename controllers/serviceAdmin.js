/**
 * Service switches (utility/serviceSettings.js), routes/api2.js:
 *   GET /api2/service-status          anyone: { weather: { suspended, message, since } }
 *   GET /api2/admin/services          administrators: the same plus who switched it
 *   PUT /api2/admin/services/weather  administrators: { suspended: boolean, message?: string }
 */
const settings = require('../utility/serviceSettings');
const S = require('../utility/nasSession');

async function status(req, res) {
  const w = await settings.getWeather();
  res.json({ status: 'Success', data: { weather: settings.publicWeather(w) } });
}

async function adminView(req, res) {
  const w = await settings.getWeather();
  res.json({ status: 'Success', data: { weather: { ...settings.publicWeather(w), by: w.suspended ? w.by : null }, defaultMessage: settings.DEFAULT_MESSAGE, messageMax: settings.MESSAGE_MAX } });
}

async function setWeather(req, res) {
  const b = req.body || {};
  if (typeof b.suspended !== 'boolean') return res.status(400).json({ status: 'error', error: 'suspended must be true or false.' });
  if (b.message !== undefined && b.message !== null && typeof b.message !== 'string') return res.status(400).json({ status: 'error', error: 'The message must be text.' });
  if (typeof b.message === 'string' && b.message.trim().length > settings.MESSAGE_MAX) {
    return res.status(400).json({ status: 'error', error: `The message can be at most ${settings.MESSAGE_MAX} characters.` });
  }
  const session = req.nasSession;
  let w;
  try {
    w = await settings.setWeather({ suspended: b.suspended, message: b.message }, session.email);
  } catch (err) {
    console.error('service settings save failed:', err.message);
    return res.status(503).json({ status: 'error', error: 'The switch could not be saved, so nothing changed. If this keeps happening, run database/migrations/006_service_settings.sql on the database.' });
  }
  S.audit(req, session, b.suspended ? 'weather_suspended' : 'weather_resumed', { detail: b.suspended ? { message: w.message } : undefined });
  if (!b.suspended) {
    try { require('../weather2/engine').resume(); } catch (err) { console.error('[weather2] resume failed:', err.message); }
  }
  return res.json({ status: 'Success', data: { weather: { ...settings.publicWeather(w), by: w.suspended ? w.by : null } } });
}

const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error('service settings:', err.message);
  if (!res.headersSent) res.status(500).json({ status: 'error', error: 'Something went wrong. Try again.' });
});

module.exports = { status: wrap(status), adminView: wrap(adminView), setWeather: wrap(setWeather) };
