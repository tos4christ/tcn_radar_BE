const power = {
    create: 'INSERT INTO power_table(date, hour, mw, equipment_id, feeder_name, power_id, station, level, equipment_name, equipment_type) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    update: 'UPDATE power_table SET mw=$1 where power_id=$2',
    get: 'SELECT * FROM power_table where power_id=$1 and date=$2 and level=$3 and equipment_type=$4',
    profile: 'SELECT mw, hour FROM power_table WHERE feeder_name=$1 AND mw = ( SELECT MAX(mw) FROM power_table WHERE feeder_name=$1 AND date=$2)'
}

module.exports =  power;
