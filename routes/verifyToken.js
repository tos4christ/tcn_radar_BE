var express = require('express');
var router = express.Router();
var verifyToken = require('../controllers/verifyToken');

/* GET users listing. */

router.post('/', verifyToken.post);
router.post('/bilateral', verifyToken.post_bilateral);

module.exports = router;
