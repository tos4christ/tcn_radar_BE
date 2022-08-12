const signup = {
    create: 'INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *',
    get: 'SELECT * FROM users where email=$1'
}

module.exports =  signup;
