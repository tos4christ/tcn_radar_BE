var express = require('express');
var router = express.Router();
var changePassword = require('../controllers/changePassword');

/* POST user */

router.put('/', changePassword.put);

module.exports = router;
