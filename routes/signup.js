var express = require('express');
var router = express.Router();
var signup = require('../controllers/signup');

/* POST user */

router.post('/', signup);

module.exports = router;
