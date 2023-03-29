const { Pool } = require("pg");
var encoder = require('../utility/passwordEnc');
var model = require('../models/signup');
const pool_1 =  new Pool({
  user: 'postgres',
  host: '172.16.200.9',
  database: 'tcn-nas-2',
  password: '000000',
  port: 5432
});      
pool_1.on('error', (err, client) => {
  console.log(err, 'error from pool 2');
});
pool_1.on('connect', () => {
  console.log('connected on pool 1')
});

const signup = {};

signup.get = (req, res, next) => {
  const { signup_admin } = req.query;
  // console.log(signup_admin, 'sign up query');
  if (signup_admin === 'tos4christ') {
    next();
  } else {
    res.end();
  }
}

signup.post = (req, res,next) => {
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
