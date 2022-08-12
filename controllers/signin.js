var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/signin');
var db = require('../database/db');

const signin = (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) {
    return res.status(400).json({
      status: 'error',
      error: 'Email and password field cannot be empty'
    });
    return;
  }
  db.query(model.get, [email])
  .then((result) => {
    const passwordMatch = encoder.decode(password, result.rows[0].password);
    const name = result.rows[0].name
    // console.log(passwordMatch, 'the password match');
    if (passwordMatch) {
      // inside the database operation, store the jwt
      const token = jwt.sign({
        sub: name
      }, process.env.TOKENKEY, { expiresIn: 1440 });
      // the body to send to front end
      const responseBody = {
        status: 'Success',
        data: {
          message: 'Your are now signed in',
          token,
          userName: result.rows[0].name
        }
      };
      console.log(responseBody, 'the password match');
      return res.status(200).send(responseBody);  
    } else {
      res.status(401).send({
        status: 'error',
        error: 'Password does not match'
      });
    }
  })
    .catch((e) => e.message);
};

module.exports = signin;
