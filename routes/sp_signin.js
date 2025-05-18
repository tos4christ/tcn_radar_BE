var express = require('express');
var router = express.Router();
var signin = require('../controllers/sp_signin');

/* GET users listing. */

router.post('/', signin.post);

module.exports = router;
