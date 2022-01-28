const voltage = {
    create: 'INSERT INTO voltage_table(date, hour, kv, equipment_id, feeder_name, voltage_id, station, level, equipment_name, equipment_type) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    update: 'UPDATE voltage_table SET kv=$1 where voltage_id=$2',
    get: 'SELECT * FROM voltage_table where voltage_id=$1 and date=$2',
    profile: 'SELECT kv, hour FROM voltage_table WHERE feeder_name=$1 AND kv = ( SELECT MAX(kv) FROM voltage_table WHERE feeder_name=$1 AND date=$2)'
}

module.exports =  voltage;
