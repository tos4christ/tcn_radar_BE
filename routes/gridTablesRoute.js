var express = require('express');
var router = express.Router();
var controller = require('../controllers/gridTablesController');

/* GET users listing. */
router.post('/instruction', controller.updateGridTable);

router.get('/stations', controller.getStations);

module.exports = router;
