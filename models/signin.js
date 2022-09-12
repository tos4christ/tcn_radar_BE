const signin = {
    get: 'SELECT * FROM users where email=$1',
    get_station_id: 'SELECT id from station_table where name=$1',
}

module.exports =  signin;
