var jwt = require('jsonwebtoken');

const jwtCheck = (req, res, next) => {
  
  if (!req.headers.authorization) {
    // console.log(req.headers, 'the request token')
    // return res.redirect('http://tcnnas.org');
    return res.status(401).json({
      status: 'error',
      error: 'Unauthorized access, you need to be logged in as a registered user'
    })
  }
  if (req.headers.authorization) {
    const requestToken = req.headers.authorization.split(' ')[1] ? req.headers.authorization.split(' ')[1] : req.headers.authorization;
    // console.log(requestToken, 'the request token 2')
    jwt.verify(requestToken, process.env.TOKENKEY, (err, tokens) => {
      if (err) {
        // console.log(err)
        return res.status(401).json({
          status: 'error',
          error: err.message
        });
      }
      if (!tokens) {
        // next(err)
        return res.status(410).json({
          status: 'error',
          error: 'You are not properly authorized'
        });
      }
      if (tokens) {
        // console.log("i got to this place")
        next();
      }
    });
  }
};

module.exports = jwtCheck;
