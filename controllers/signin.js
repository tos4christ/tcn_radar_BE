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
    if (passwordMatch) {
      const { id: userId, station } = result.rows[0];
      // inside the database operation, store the jwt
      const token = jwt.sign({
        sub: userId
      }, process.env.TOKENKEY, { expiresIn: 1440 });
      // the body to send to front end
      db.query(model.get_station_id, [station])
      .then(stationId => {
        const {id: station_id} = stationId.rows[0];
        const responseBody = {
          status: 'Success',
          data: {
            message: 'Your are now signed in',
            token,
            userId,
            station,
            station_id,
            userName: result.rows[0].name
          }
        };
        return res.status(200).send(responseBody);
      })
      .catch(e => res.status(403).send(e));      
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
