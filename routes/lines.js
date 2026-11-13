var express = require('express');
var router = express.Router();
var controller = require('../controllers/lines_2');
var jwtCheck = require('../utility/jwtCheck');
var requireSignedIn = require('../utility/requireSignedIn'); // old-page token or *_fix session

/* GET users listing. */
// router.post('/uptime', jwtCheck, controller.uptime);

// router.post('/nari', controller.nari);

// router.post('/downtime', jwtCheck, controller.downtime);

// router.post('/history', jwtCheck, controller.history);

// router.post('/average', jwtCheck, controller.average);

// router.post('/profile', jwtCheck, controller.profile);

// router.get('/all', jwtCheck, controller.all);

router.post('/tem', requireSignedIn(), controller.getdaily);

router.post('/voltageprofile', requireSignedIn(), controller.gethourlyvoltage);

router.post('/collapse', requireSignedIn(), controller.getcollapse);

// Testing endpoint to create rows in the feeder_rows table
router.post('/create', requireSignedIn(), controller.createRows);

module.exports = router;
