var express = require('express');
var router = express.Router();
var controller = require('../controllers/lines');
var jwtCheck = require('../utility/jwtCheck');

/* GET users listing. */
router.post('/uptime', jwtCheck, controller.uptime);

router.post('/downtime', jwtCheck, controller.downtime);

router.post('/history', jwtCheck, controller.history);

router.post('/average', jwtCheck, controller.average);

router.post('/profile', jwtCheck, controller.profile);

// router.get('/all', jwtCheck, controller.all);

router.get('/tem', controller.getdaily);

router.get('/collapse', controller.getcollapse);

module.exports = router;
