var express = require('express');
var router = express.Router();
var changePassword = require('../controllers/changePassword_bilateral');
var requireSignedIn = require('../utility/requireSignedIn');

// Signed-in bilateral users change their own password (the page sends its sign-in token).
router.put('/', requireSignedIn({ realm: 'bilateral' }), changePassword.put);

module.exports = router;
