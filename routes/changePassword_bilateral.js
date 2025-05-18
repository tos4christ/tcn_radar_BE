var express = require('express');
var router = express.Router();
var changePassword = require('../controllers/changePassword_bilateral');

/* POST user */

router.put('/', changePassword.put);

module.exports = router;
