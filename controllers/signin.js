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
    const passwordMatch = encoder.decode(password, result.rows[0].password);
    const name = result.rows[0].name;
    const login_count = result.rows[0].login_count;
    
    // console.log(passwordMatch, 'the password match');    
    if (passwordMatch) {
      
      // check the login_count
      if (login_count === 0) {
        console.log(typeof login_count, email, 'the login count')
        // Update the login count and redirect to the update password page
        db.query(model.update_login_count, [(login_count + 1), email])
          .then( resp => {
            console.log(resp, 'this is the response')
            // redirect to the update password page in the react app
            return res.redirect(`https://tcnnas.org/updatepassword?email=${email}`);
          })
          .catch( e => console.log );        
      } else if (login_count > 0) {
        console.log('the count is greater than 0')
        db.query(model.update_login_count, [(login_count + 1), email])
          .then( theres => {
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
          })
          .catch(e => console.log);        
      }      
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
