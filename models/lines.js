const lines = {
    create: 'INSERT INTO lines_table(date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    get: 'SELECT * FROM lines_table where equipment_id=$1 and date=$2 and level=$3 and station=$4',
    get_line: 'select * from lines_table where line_name=$1 order by hour, minute, seconds',
    get_uptime: 'select * from lines_table where time between $1 and $2',
    get_history: 'select * from lines_table where station=$1 and line_name=$2 and time between $3 and $4 order by time'
}

module.exports =  lines;
