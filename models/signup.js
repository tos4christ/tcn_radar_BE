const signup = {
    create: 'INSERT INTO users_table(name, staff_id, station, email, password, creation_date) VALUES($1, $2, $3, $4, $5,$6) RETURNING *',
    get: 'SELECT * FROM users_table where email=$1'
}

module.exports =  signup;
