const signup = {
    create: 'INSERT INTO users(name, email, password, role, created_at) VALUES($1, $2, $3, $4, $5) RETURNING *',
    get: 'SELECT * FROM users where email=$1',
    create_bilateral: 'INSERT INTO bilateral_users(name, email, password, role, created_at) VALUES($1, $2, $3, $4, $5) RETURNING *',
    get_bilateral   : 'SELECT * FROM bilateral_users where email=$1',
}

module.exports =  signup;
