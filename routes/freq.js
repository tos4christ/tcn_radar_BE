var express = require('express');
var router = express.Router();
var controller = require('../controllers/freq');
var requireSignedIn = require('../utility/requireSignedIn'); // old-page token or *_fix session

/* GET users listing. */
// the frequency sheet download (TEM page) needs a sign-in; GET / and /weather stay public as before
router.post('/', requireSignedIn(), controller.getFrequency);

router.get('/', controller.get);

router.post('/weather', controller.getWeather);

module.exports = router;
