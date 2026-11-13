var model = require('../models/changePassword');
var changeOwnPassword = require('../utility/changeOwnPassword');

const changePassword = {};

// Only the signed-in user's own password (see utility/changeOwnPassword.js and routes/changePassword.js).
changePassword.put = changeOwnPassword({ getSql: model.get, updateSql: model.update });

module.exports = changePassword;
