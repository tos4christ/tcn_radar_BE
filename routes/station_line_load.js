var express = require('express');
var router = express.Router();
var controller = require('../controllers/station_line_load');

/* GET users listing. */
router.get('/', controller.get);

module.exports = router;
