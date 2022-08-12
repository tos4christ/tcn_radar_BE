var express = require('express');
var router = express.Router();
var signup = require('../controllers/signup');

/* POST user */

router.post('/', signup);
router.get('/', signup);

module.exports = router;
