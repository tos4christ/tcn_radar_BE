const lines = {
    create: 'INSERT INTO lines_table(date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    get_daily: `SELECT * FROM lines_table where time between $1 and $2 and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru'
    ) 
    group by station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time order by station, line_name, time`,
    get_daily_2: `SELECT * FROM lines_table where time between $1 and $2 and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru'
    ) 
    group by station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time order by station, line_name, time`,
    get_downtime: 'select * from lines_table where mw=0 and kv=0 and time between $1 and $2 and line_name=$3 and station=$4 order by time',    
    get_profile_max: (parameter, station, line, start, end) => {
        return `select hour, minute, seconds, ${parameter}, date from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end} and 
        ${parameter}=(select MAX(${parameter}) from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end})`
        },
    get_profile_min: (parameter, station, line, start, end) => {
        return `select hour, minute, seconds, ${parameter}, date from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end} and 
        ${parameter}=(select MIN(${parameter}) from lines_table where station='${station}' and line_name='${line}' and time between ${start} and ${end})`
        },    
    get_history: 'select * from lines_table where station=$1 and line_name=$2 and time between $3 and $4 order by time',    
    get_nsong_2: 'select station, kv, mw, amp, time, seconds, mvar, line_name from lines_table where date=$1 and hour=$2 and minute between $3 and $4 and seconds between $5 and $6 order by station, line_name, time, seconds',
    get_collapse: `select station, date, line_name, mw, kv, hour, minute, seconds, time from lines_table where time between $1 and $2 and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru'
    ) 
    order by time`,
}

// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  lines;
