var express = require('express');
var router = express.Router();
var signin = require('../controllers/signin');

/* GET users listing. */

router.post('/', signin);

module.exports = router;
