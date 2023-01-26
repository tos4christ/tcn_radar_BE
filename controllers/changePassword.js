var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/changePassword');
var db = require('../database/db');

const changePassword = {};

changePassword.put = (req, res, next) => {
  if (!req.body.email && !req.body.password) {
    res.status(400).json({
      status: 'error',
      error: 'Email and password field cannot be empty'
    });
    return;
  }
  let {email, password} = req.body;
  const hashedPassword = encoder.hash(password, 9);
//   const updateDate = new Date().toLocaleDateString();
  password = hashedPassword;
  // inside the database operation, store the jwt
  db.query(model.update, [password, email])
    .then(user => {
        // console.log(user, 'the user after the password update')
        const responseBody = {
        status: 'Success',
        data: {
            message: 'Your password has been successfully updated',
        }
        };
        return res.status(200).send(responseBody);        
    })
    .catch((err) => {
      res.status(401).send(err.message);
    });
};

module.exports = changePassword;
