const current = {
    create: 'INSERT INTO current_table(date, hour, amp, equipment_id, feeder_name, current_id, station, level, equipment_name, equipment_type) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    update: 'UPDATE current_table SET amp=$1 where current_id=$2',
    get: 'SELECT * FROM current_table where current_id=$1 and date=$2 and level=$3 and equipment_type=$4',
    profile: 'SELECT amp, hour FROM current_table WHERE feeder_name=$1 AND amp = ( SELECT MAX(amp) FROM current_table WHERE feeder_name=$1 AND date=$2)'
}

module.exports =  current;
