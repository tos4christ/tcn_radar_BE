const equipment = {
    create: 'INSERT INTO equipment_table(name, maker, station_id, level, type) VALUES($1, $2, $3, $4, $5) RETURNING *',
    get: 'SELECT * FROM equipment_table where station_id=$1'
}

module.exports =  equipment;
