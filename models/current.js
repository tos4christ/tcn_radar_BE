const current = {
    create: 'INSERT INTO current_table(date, hour, amp, equipment_id, feeder_name, current_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
    update: 'UPDATE current_table SET amp=$1 where current_id=$2',
    get: 'SELECT * FROM current_table where current_id=$1',
    profile: 'SELECT amp, hour FROM current_table WHERE feeder_name=$1 AND amp = ( SELECT MAX(amp) FROM current_table WHERE feeder_name=$1 AND date=$2)'
}

module.exports =  current;
