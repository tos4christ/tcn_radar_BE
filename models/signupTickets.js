const signup = {
    create: 'INSERT INTO tickets_users(name, email, password, role, created_at) VALUES($1, $2, $3, $4, $5) RETURNING *',
    get: 'SELECT * FROM users where email=$1'
}

module.exports =  signup;
