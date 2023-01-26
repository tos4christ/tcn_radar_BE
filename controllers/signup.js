var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/signup');
var db = require('../database/db');

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
  let {name, role, email, password} = req.body;
  const hashedPassword = encoder.hash(password, 9);
  const creationDate = new Date().toLocaleDateString();
  password = hashedPassword;
  // inside the database operation, store the jwt
  db.query(model.get, [email])
    .then(user => {
      if(user.rowCount > 0) {
        return res.status(403).send({message: 'User Already exists'})
      } else {             
        db.query(model.create, [name, email, password, role, creationDate])
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
