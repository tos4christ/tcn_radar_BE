const signin = {
    get: 'SELECT * FROM users where email=$1',
    get_bilateral : 'SELECT * FROM bilateral_users where email=$1',
}

module.exports =  signin;
