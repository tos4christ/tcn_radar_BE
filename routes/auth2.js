var express = require('express');
var router = express.Router();
var controller = require('../controllers/auth2');
var S = require('../utility/nasSession');

const anyRealm = S.requireSession({ realms: ['ncc', 'bilateral'] });
const admin = S.requireSession({ realms: ['ncc'], admin: true });

// No caching of anything about who is signed in.
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

router.post('/signin', S.requireAppHeader, controller.signin);
router.post('/signout', S.requireAppHeader, controller.signout);
router.get('/me', anyRealm, controller.me);
router.post('/activity', S.requireAppHeader, anyRealm, controller.activity);
router.post('/password', S.requireAppHeader, anyRealm, controller.password);

router.get('/audit', admin, controller.auditLog);
router.get('/audit/summary', admin, controller.auditSummary);
router.get('/sessions', admin, controller.sessions);
router.post('/sessions/:id/revoke', S.requireAppHeader, admin, controller.revoke);

module.exports = router;
