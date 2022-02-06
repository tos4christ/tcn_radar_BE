var express = require('express');
var router = express.Router();
var controller = require('../controllers/equipment');

/* GET users listing. */
router.get('/', controller.get);

router.post('/', controller.post);

module.exports = router;
