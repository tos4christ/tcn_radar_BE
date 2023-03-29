const { Pool } = require("pg");
var jwt = require('jsonwebtoken');
var encoder = require('../utility/passwordEnc');
var model = require('../models/signin');
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
  pool_1.query(model.get, [email])
  .then((result) => {    
    // check to see if the user has ever changed their password before and then redirect them to change password
    if(result.rows.length === 0) {
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
    const user_data = result.rows[0];    
    // console.log(passwordMatch, 'the password match');    
    if (passwordMatch) {      
      // inside the database operation, store the jwt
      const token = jwt.sign({
        sub: user_data.email,
        name: `${user_data.department} | ${user_data.company} | ${user_data.approval_level}`,
        admin: true,
        iat: Date.now()
      }, process.env.TOKENKEY, { expiresIn: "240h" });
      // the body to send to front end
      // the role will be gotten from the user details
      // the approval_level will be gotten from the user details
      const responseBody = {
        status: 'Success',
        data: {
          message: 'Your are now signed in',
          token,
          userName: result.rows[0].name,
          isLoggedIn: true,
          department: result.rows[0].department,
          approval_level: result.rows[0].approval_level
        }
      };
      // console.log(responseBody, 'the password match');
      res.status(200).send(responseBody); 
      /// if the company is Disco, redirect to api/tickets/disco
      /// if the company is Tcn, redirect to api/tickets/tcn
      next();           
    }
  })
    .catch((e) => e.message);
};

module.exports = signin;
