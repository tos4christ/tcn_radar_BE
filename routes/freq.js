var express = require('express');
var router = express.Router();
var controller = require('../controllers/freq');

/* GET users listing. */
router.get('/', controller.getFrequency);

module.exports = router;