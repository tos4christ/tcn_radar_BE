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

// Weather centre of /nccweather_fix (weather2/). Reading: NCC users; nodes and refresh: administrators.
var weather = require('../weather2/controller');
const nccAdmin = S.requireSession({ realms: ['ncc'], admin: true });
router.get('/weather/overview', ncc, weather.overview);
router.get('/weather/meta', ncc, weather.meta);
router.get('/weather/status', ncc, weather.status);
router.get('/weather/alerts', ncc, weather.alerts);
router.get('/weather/point', ncc, weather.point);
router.get('/weather/stations/:name', ncc, weather.station);
router.post('/weather/forecast-report', S.requireAppHeader, ncc, weather.forecastReport);
router.post('/weather/refresh', S.requireAppHeader, nccAdmin, weather.refresh);
router.post('/weather/stations/:name/nodes', S.requireAppHeader, nccAdmin, weather.createNode);
router.delete('/weather/nodes/:id', S.requireAppHeader, nccAdmin, weather.deleteNode);

router.post('/download/bilateral', S.requireAppHeader, bilateralOrNcc, (req, res, next) => { req.params.kind = 'bilateral'; controller.download(req, res, next); });
router.post('/download/:kind', S.requireAppHeader, ncc, controller.download);

module.exports = router;
