const lines = {
    create: 'INSERT INTO lines_table(date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    get: 'SELECT * FROM lines_table where equipment_id=$1 and date=$2 and level=$3 and station=$4',
    get_line: 'select * from lines_table where line_name=$1 order by hour, minute, seconds',
    get_uptime: 'select * from lines_table where time between $1 and $2',
    get_all: 'select station, max(kv) as kv, sum(abs(mw)) as mw from lines_table where date=$1 and hour=$2 and minute=$3 and seconds between $4 and $5 group by station',
    get_downtime: 'select * from lines_table where mw=0 and kv=0 and time between $1 and $2 and line_name=$3 and station=$4 order by time',
    get_profile_max: (parameter, station, line, start, end) => {
        return `select hour, minute, seconds, ${parameter}, date from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end} and 
        ${parameter}=(select MAX(${parameter}) from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end})`
        },
    get_profile_min: (parameter, station, line, start, end) => {
        return `select hour, minute, seconds, ${parameter}, date from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end} and 
        ${parameter}=(select MIN(${parameter}) from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end})`
        },
    get_average: 'select * from lines_table where time between $1 and $2',
    get_history: 'select * from lines_table where station=$1 and line_name=$2 and time between $3 and $4 order by time'
}

// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  lines;
