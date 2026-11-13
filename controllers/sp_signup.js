var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/signup');
var db = require('../database/db');


// The administrator key for creating accounts. Set SIGNUP_ADMIN_KEY in .env to a new value: the
// value below was written in this file (and so in git), and is used only until .env has one.
const crypto = require('crypto');
const LEGACY_SIGNUP_KEY = 'tos4christ1';
if (!process.env.SIGNUP_ADMIN_KEY) console.warn('SIGNUP_ADMIN_KEY is not set in .env: using the old built-in sign-up key. Set a new one.');
const signupKeyOk = (given) => {
  const key = String(process.env.SIGNUP_ADMIN_KEY || LEGACY_SIGNUP_KEY);
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(key);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const signup = {};

signup.get = (req, res, next) => {
  const { signup_admin } = req.query;
  // console.log(signup_admin, 'sign up query');
  if (signupKeyOk(signup_admin)) {
    next();
  } else {
    res.end();
  }
}

signup.post = (req, res,next) => {
  // Only an administrator holding the key can create accounts (?signup_admin=<key>).
  if (!signupKeyOk(req.query.signup_admin || req.headers['x-signup-admin'])) {
    return res.status(403).json({ status: 'error', error: 'Creating accounts needs the administrator key.' });
  }
  if (!req.body.email && !req.body.password) {
    res.status(400).json({
      status: 'error',
      error: 'Email and password field cannot be empty'
    });
    return;
  }
  let {name, role, email, password} = req.body;
  const hashedPassword = encoder.hash(password, 9);
  // YYYY-MM-DD (server local date): read the same way whatever the database DateStyle. The old
  // toLocaleDateString() gave e.g. 14/11/2026, which a server set to month-first refuses.
  const now = new Date();
  const creationDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  password = hashedPassword;
  // inside the database operation, store the jwt
  db.query(model.get_bilateral, [email])
    .then(user => {
      if(user.rowCount > 0) {
        return res.status(403).send({message: 'User Already exists'})
      } else {             
        db.query(model.create_bilateral, [name, email, password, role, creationDate])
        .then(() => {
          // response body to send to frontend
          const responseBody = {
            status: 'Success',
            data: {
              message: 'Your account has been successfully created',
            }
          };
          return res.status(201).send(responseBody);
        })
        .catch((err) => {
          res.status(500).send(err.message);
        });
      }
    })
    .catch((err) => {
      res.status(401).send(err.message);
    });
};

module.exports = signup;
