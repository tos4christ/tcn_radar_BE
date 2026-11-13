var model = require('../models/changePassword');
var changeOwnPassword = require('../utility/changeOwnPassword');

const changePassword = {};

// Only the signed-in bilateral user's own password (see utility/changeOwnPassword.js).
changePassword.put = changeOwnPassword({ getSql: model.get_bilateral, updateSql: model.update_bilateral });

module.exports = changePassword;
