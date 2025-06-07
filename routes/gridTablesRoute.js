var express = require('express');
var router = express.Router();
var controller = require('../controllers/gridTablesController');

/* GET users listing. */
router.post('/', controller.updateGridTable);

router.get('/', controller.getStations);

module.exports = router;
