var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/signup');
var db = require('../database/db');

const signup = (req, res,next) => {
  if (!req.body.email && !req.body.password) {
    res.status(400).json({
      status: 'error',
      error: 'Email and password field cannot be empty'
    });
    return;
  }
  let {name, staff_id, station, email, password} = req.body;
  const hashedPassword = encoder.hash(password, 9);
  const creationDate = new Date().toLocaleDateString();
  password = hashedPassword;
  // inside the database operation, store the jwt
  db.query(model.get, [email])
    .then(user => {
      if(user.rowCount > 0) {
        return res.status(401).send({message: 'User Already exists'})
      } else {             
        return db.query(model.create, [name, staff_id, station, email, password, creationDate]);
      }
    })  
    .then((result) => {
      console.log(result.rows, 'this is the result')
      const { id: userId } = result.rows[0];
      // create a token to send back to the user
      const token = jwt.sign({
        sub: userId
      }, process.env.TOKENKEY, { expiresIn: 1440 });
      // response body to send to frontend
      const responseBody = {
        status: 'Success',
        data: {
          message: 'Your account has been successfully created',
          token,
          userId
        }
      };
      return res.status(201).send(responseBody);
    })
    .catch((err) => {
      res.status(401).send(err.message);
    });
};

module.exports = signup;
