var express = require('express');
var router = express.Router();
var controller = require('../controllers/reports');

/* GET users listing. */
router.get('/', controller.get);

router.put('/', controller.update);

router.post('/', controller.post);

module.exports = router;
