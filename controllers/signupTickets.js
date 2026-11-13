const { Pool } = require("pg");
var encoder = require('../utility/passwordEnc');
var model = require('../models/signupTickets');
var pool_1 = require('../database/db');
// const pool_1 =  new Pool({
//   user: 'postgres',
//   host: '172.16.200.9',
//   database: 'tcn-nas-2',
//   password: '000000',
//   port: 5432
// });      
// pool_1.on('error', (err, client) => {
//   console.log(err, 'error from pool 2');
// });
// pool_1.on('connect', () => {
//   console.log('connected on pool 1')
// });


// The administrator key for creating accounts. Set SIGNUP_ADMIN_KEY in .env to a new value: the
// value below was written in this file (and so in git), and is used only until .env has one.
const crypto = require('crypto');
const LEGACY_SIGNUP_KEY = 'tos4christ';
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
  let {name, approval_level, department, email, password, company} = req.body;
  const hashedPassword = encoder.hash(password, 9);
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const created_at = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
  password = hashedPassword;
  // inside the database operation, store the jwt
  pool_1.query(model.get, [email])
    .then(user => {
      if(user.rowCount > 0) {
        return res.status(403).send({message: 'User Already exists'})
      } else {             
        pool_1.query(model.create, [name, email, password, department, company, approval_level, created_at])
          .then((response) => {
            console.log(response, " the response");
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
            res.status(500).send(err);
          });
      }
    })
    .catch((err) => {
      res.status(401).send(err);
    });
};

module.exports = signup;
