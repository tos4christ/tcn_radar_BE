const tap = {
    create: 'INSERT INTO tap_table(date, hour, tap, equipment_id, feeder_name, tap_id, station, level, equipment_name, equipment_type) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    update: 'UPDATE tap_table SET tap=$1 where tap_id=$2',
    get: 'SELECT * FROM tap_table where tap_id=$1 and date=$2 and level=$3 and equipment_type=$4',
    profile: 'SELECT tap, hour FROM tap_table WHERE feeder_name=$1 AND tap = ( SELECT MAX(tap) FROM tap_table WHERE feeder_name=$1 AND date=$2)'
}

module.exports =  tap;
