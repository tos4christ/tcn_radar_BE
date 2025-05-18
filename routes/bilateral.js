var express = require('express');
var router = express.Router();
var controller = require('../controllers/bilateral');
var jwtCheck = require('../utility/jwtCheck');

/* GET users listing. */
router.post('/download', jwtCheck, controller.hourly);

module.exports = router;
