var express = require('express');
var router = express.Router();
var controller = require('../controllers/freq');

/* GET users listing. */
router.post('/', controller.getFrequency);

module.exports = router;
