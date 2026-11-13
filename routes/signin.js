var express = require('express');
var router = express.Router();
var signin = require('../controllers/signin');

/* GET users listing. */

var signinLimiter = require('../utility/signinLimiter');
// at most 10 failed attempts per address and e-mail in 15 minutes
router.post('/', signinLimiter, signin.post);
//router.get('/', signin.get);

module.exports = router;
