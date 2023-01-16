var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/signin');
var db = require('../database/db');

const signin = {};

signin.get = (req, res) => {
  res.redirect('https://tcnnas.org/')
}

signin.post = (req, res) => {
  const { email, password } = req.body;
  console.log(email, password, "it got here");
  if (!email && !password) {
    return res.status(400).json({
      status: 'error',
      error: 'Email and password field cannot be empty'
    });
    return;
  }
  db.query(model.get, [email])
  .then((result) => {
    
    // check to see if the user has ever changed their password before and then redirect them to change password
    if(result.rows[0].length === 0) {
      const responseBody = {
        status: 'Error',
        data: {
          message: 'Password does not match',
          isLoggedIn: false
        }
      };
      res.status(401).send(responseBody);
      next();
      return;
    }
    const passwordMatch = encoder.decode(password, result.rows[0].password);
    const name = result.rows[0].name;

    console.log(passwordMatch, name, "the pmatch and name");
    
    // console.log(passwordMatch, 'the password match');    
    if (passwordMatch) {      
      // inside the database operation, store the jwt
      const token = jwt.sign({
        sub: name
      }, process.env.TOKENKEY, { expiresIn: "240h" });
      // the body to send to front end
      const responseBody = {
        status: 'Success',
        data: {
          message: 'Your are now signed in',
          token,
          userName: result.rows[0].name,
          isLoggedIn: true
        }
      };
      // console.log(responseBody, 'the password match');
      res.status(200).send(responseBody); 
      next();           
    }
  })
    .catch((e) => e.message);
};

module.exports = signin;
