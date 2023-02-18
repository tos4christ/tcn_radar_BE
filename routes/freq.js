var express = require('express');
var router = express.Router();
var controller = require('../controllers/freq');

/* GET users listing. */
router.post('/', controller.getFrequency);

router.post('/weather', controller.getWeather);

module.exports = router;
