/**
 * PUT /changepassword and /changepassword_bilateral: changes the password of the person who is
 * signed in, and nobody else's. (Before, anyone could set any account's password by sending an
 * e-mail address and a new password.) Runs after utility/requireSignedIn.js.
 *
 * Who is signed in comes from the server session, or from the sign-in token: tokens issued now
 * carry the e-mail; tokens issued before this change carry only the name ("sub"), which is then
 * matched against the account being changed.
 */
var encoder = require('./passwordEnc');
var db = require('../database/db');

module.exports = ({ getSql, updateSql }) => async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return res.status(400).json({ status: 'error', error: 'Email and password field cannot be empty' });
  }
  try {
    const who = req.signedIn || {};
    let allowed = false;
    if (who.email) {
      allowed = String(who.email).toLowerCase() === email.toLowerCase();
    } else if (who.via === 'token' && who.payload && who.payload.sub) {
      const { rows } = await db.query(getSql, [email]);
      allowed = rows.length === 1 && rows[0].name === who.payload.sub;
    }
    if (!allowed) {
      return res.status(403).json({ status: 'error', error: 'You can only change the password of the account you are signed in with.' });
    }
    const result = await db.query(updateSql, [encoder.hash(password, 9), email]);
    if (!result.rowCount) return res.status(404).json({ status: 'error', error: 'Account not found.' });
    return res.status(200).send({ status: 'Success', data: { message: 'Your password has been successfully updated' } });
  } catch (err) {
    console.error('change password failed:', err.message);
    return res.status(500).json({ status: 'error', error: 'The password could not be changed. Please try again.' });
  }
};
