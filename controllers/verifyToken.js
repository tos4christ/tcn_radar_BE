var model = require('../models/equipment');
var db = require('../database/db');
var jwt = require('jsonwebtoken');

const decodeToken = (token) => {
    try {
      // Verify and Decode the token
      // jwt.decode(token); 
      const decoded = jwt.verify(token, process.env.TOKENKEY);    
      return decoded;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

const verifyToken = {};
// Controller first checks to see if the particular row exists or not, this determines


verifyToken.post = (req, res, next) => {
    const { token } = req.body;
    const decodedToken = decodeToken(token);
    // console.log(decodedToken, 'the decoded token');
    if (decodedToken) {
      res.status(200).send({
        status: 'Success',
        data: {
          message: 'Token is valid',
          decodedToken,
          isLoggedIn: true
        }
      });
    } else {
      res.status(401).send({
        status: 'Error',
        data: {
          message: 'Token is invalid',
          isLoggedIn: false
        }
      });
    }
}

module.exports =  verifyToken;
