const changePassword = {
    update: 'UPDATE users SET password = $1 WHERE email=$2',
    get: 'SELECT * FROM users where email=$1',
    get_bilateral: 'SELECT * FROM bilateral_users where email=$1',
    update_bilateral: 'UPDATE bilateral_users SET password = $1 WHERE email=$2',
}

module.exports =  changePassword;
