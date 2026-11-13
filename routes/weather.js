var express = require('express');
var router = express.Router();
var controller = require('../controllers/weather');
var requireSignedIn = require('../utility/requireSignedIn'); // old-page token or *_fix session

/* GET users listing. */
router.get('/getallstations', controller.getStations);

// the weather report download needs a sign-in; the station list and live weather stay public
router.post('/getweatherreport', requireSignedIn(), controller.getWeather_report);

router.post('/getweather', controller.getWeather);

module.exports = router;
