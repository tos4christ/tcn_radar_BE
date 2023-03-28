var express = require('express');
var router = express.Router();
var signin = require('../controllers/signinTickets');

/* GET users listing. */

router.post('/', signin.post);
router.get('/', signin.get);

module.exports = router;
