const signin = {
    get: 'SELECT * FROM users where email=$1',
    get_station_id: 'SELECT id from station_table where name=$1',
    update_login_count: 'UPDATE users SET login_count = $1 WHERE email=$2'
}

module.exports =  signin;
