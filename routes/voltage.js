var express = require('express');
var router = express.Router();
var controller = require('../controllers/voltage');

/* GET users listing. */
router.get('/', controller.get);

router.get('/profile', controller.profile);

router.post('/', controller.post);

module.exports = router;
