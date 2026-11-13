var express = require('express');
var router = express.Router();
var controller = require('../controllers/analytics2');
var S = require('../utility/nasSession');

const ncc = S.requireSession({ realms: ['ncc'] });
const bilateralOrNcc = S.requireSession({ realms: ['bilateral', 'ncc'] });

router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

router.get('/lines/catalog', ncc, controller.catalog);
router.get('/lines/series', ncc, controller.series);
router.get('/lines/stats', ncc, controller.stats);
router.get('/lines/availability', ncc, controller.availability);
router.get('/lines/export.csv', ncc, controller.exportCsv);

router.post('/download/bilateral', S.requireAppHeader, bilateralOrNcc, (req, res, next) => { req.params.kind = 'bilateral'; controller.download(req, res, next); });
router.post('/download/:kind', S.requireAppHeader, ncc, controller.download);

module.exports = router;
