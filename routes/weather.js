var express = require('express');
var router = express.Router();
var controller = require('../controllers/weather');

/* GET users listing. */
router.get('/getallstations', controller.getStations);

router.post('/getweather', controller.getWeather);

module.exports = router;
