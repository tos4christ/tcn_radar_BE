const lines = {
    create: 'INSERT INTO lines_table(date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    get: 'SELECT * FROM lines_table where equipment_id=$1 and date=$2 and level=$3 and station=$4',
    get_daily: `SELECT * FROM lines_table where date=$1 and station in 
    (
        'omotosho2', 'eket', 'phMain', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs', 'odukpaniGs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'ikotEkpene', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs'
    ) 
    group by station, line_name, id order by station, line_name, time`,
    get_my_line: 'SELECT * FROM lines_table where station=$1 and date=$2 and hour=$3 and minute between $4 and $5 order by line_name, time',
    get_line: 'select * from lines_table where line_name=$1 order by hour, minute, seconds',
    get_uptime: 'select * from lines_table where time between $1 and $2',
    get_all: 'select station, max(kv) as kv, sum(abs(mw)) as mw from lines_table where date=$1 and hour=$2 and minute=$3 and seconds between $4 and $5 group by station',
    get_all_2: 'select station, kv, mw, line_name from lines_table where date=$1 and hour=$2 and minute=$3 and seconds between $4 and $5 order by station, kv, mw, line_name, hour, minute, seconds',
    get_downtime: 'select * from lines_table where mw=0 and kv=0 and time between $1 and $2 and line_name=$3 and station=$4 order by time',
    get_profile_max: (parameter, station, line, start, end) => {
        return `select hour, minute, seconds, ${parameter}, date from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end} and 
        ${parameter}=(select MAX(${parameter}) from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end})`
        },
    get_profile_min: (parameter, station, line, start, end) => {
        return `select hour, minute, seconds, ${parameter}, date from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end} and 
        ${parameter}=(select MIN(${parameter}) from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end})`
        },
    get_average_5: 'select * from lines_table where time between $1 and $2',
    get_history: 'select * from lines_table where station=$1 and line_name=$2 and time between $3 and $4 order by time',
    get_nsong_2: 'select station, kv, mw, amp, time, seconds, mvar, line_name from lines_table where date=$1 and hour=$2 and minute between $3 and $4 and seconds between $5 and $6 order by station, line_name, time, seconds',
    get_nsong: 'select station, max(kv) as kv, sum(abs(mw)) as mw, sum(abs(amp)) as amp, time, seconds, mvar from lines_table where date=$1 and hour=$2 and minute=$3 and seconds between $4 and $5 group by station, mvar, time, seconds',

}

// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  lines;
