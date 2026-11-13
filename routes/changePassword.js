var express = require('express');
var router = express.Router();
var changePassword = require('../controllers/changePassword');
var requireSignedIn = require('../utility/requireSignedIn');

// Signed-in users change their own password (the page sends its sign-in token).
router.put('/', requireSignedIn({ realm: 'ncc' }), changePassword.put);

module.exports = router;
