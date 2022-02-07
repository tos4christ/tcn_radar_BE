const mx = {
    create: 'INSERT INTO mx_table(date, hour, mx, equipment_id, feeder_name, mx_id, station, level, equipment_name, equipment_type) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    update: 'UPDATE mx_table SET mx=$1 where mx_id=$2',
    get: 'SELECT * FROM mx_table where mx_id=$1 and date=$2 and level=$3 and equipment_type=$4',
    profile: 'SELECT mx, hour FROM mx_table WHERE feeder_name=$1 AND mx = ( SELECT MAX(mx) FROM mx_table WHERE feeder_name=$1 AND date=$2)'
}

module.exports =  mx;
