var express = require('express');
var router = express.Router();
var tickets = require('../controllers/tickets');
var jwtCheck = require('../utility/jwtCheck');

/* GET users listing. */
router.get('/get',  tickets.get_disco);

router.get('/getall',  tickets.get_tcn);

router.post('/edit', tickets.update);

router.post('/editstatus', tickets.update_status);

router.post('/new', tickets.create);

router.post('/delete', tickets.delete);

module.exports = router;
