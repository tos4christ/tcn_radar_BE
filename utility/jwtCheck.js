var jwt = require('jsonwebtoken');

const jwtCheck = (req, res, next) => {
  console.log(req.headers, 'the request token')
  if (!req.headers.authorization) {
    return res.redirect('http://tcnnas.org');
    return res.status(401).json({
      status: 'error',
      error: 'Unauthorized access, you need to be logged in as a registered user'
    })
  }
  if (req.headers.authorization) {
    const requestToken = req.headers.authorization.split(' ')[1] ? req.headers.authorization.split(' ')[1] : req.headers.authorization;
    // console.log(requestToken, 'the request token')
    jwt.verify(requestToken, process.env.TOKENKEY, (err, tokens) => {
      if (err) {
        // next(err)
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
        next();
      }
    });
  }
};

module.exports = jwtCheck;
