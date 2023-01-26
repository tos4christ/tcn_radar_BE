const changePassword = {
    update: 'UPDATE users SET password = $1 WHERE email=$2',
    get: 'SELECT * FROM users where email=$1'
}

module.exports =  changePassword;
