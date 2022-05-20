var express = require('express');
var router = express.Router();
var controller = require('../controllers/lines');

/* GET users listing. */
router.post('/uptime', controller.uptime);

router.post('/downtime', controller.downtime);

router.post('/history', controller.history);

router.post('/average', controller.average);

router.post('/profile', controller.profile);

router.get('/all', controller.all);

router.get('/nsong', controller.nsong);

module.exports = router;
