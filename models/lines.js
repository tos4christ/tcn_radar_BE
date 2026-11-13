// Profile (min / max) query. The column name cannot be a parameter, so it comes from this list.
const PROFILE_COLUMNS = ['mw', 'kv', 'amp', 'mvar'];
const profileQuery = (fn, parameter, station, line, start, end) => {
    if (!PROFILE_COLUMNS.includes(parameter)) return null;
    if (!Number.isFinite(Number(start)) || !Number.isFinite(Number(end))) return null;
    return {
        text: `select hour, minute, seconds, ${parameter}, date from lines_table where station=$1 and line_name=$2 and time between $3 and $4 and
        ${parameter}=(select ${fn}(${parameter}) from lines_table where station=$1 and line_name=$2 and time between $3 and $4)`,
        values: [String(station), String(line), Number(start), Number(end)],
    };
};

const lines = {
    create: 'INSERT INTO lines_table(date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    get_daily: `SELECT * FROM lines_table where time between $1 and $2 and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru', 'taopex', 'phMain'
    ) 
    group by station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time order by station, line_name, time`,
    get_daily_2: `SELECT * FROM lines_table where time between $1 and $2 and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru', 'taopex', 'phMain'
    ) 
    group by station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time order by station, line_name, time`,
    get_hourly: `SELECT * FROM lines_table where time between $1 and $2 and station in 
    (
        'eket', 'ekim', 'phMain', 'lokojaTs', 'asaba', 'ugwuaji', 'gwagwalada', 'ikotEkpene'
    ) 
    group by station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time order by station, line_name, time`,
    get_downtime: 'select * from lines_table where mw=0 and kv=0 and time between $1 and $2 and line_name=$3 and station=$4 order by time',    
    // Built with parameters: the values used to be pasted into the SQL text (SQL injection).
    // Only a known column can be named; anything else gives null (the caller answers 400).
    get_profile_max: (parameter, station, line, start, end) => profileQuery('MAX', parameter, station, line, start, end),
    get_profile_min: (parameter, station, line, start, end) => profileQuery('MIN', parameter, station, line, start, end),
    get_history: 'select * from lines_table where station=$1 and line_name=$2 and time between $3 and $4 order by time',    
    get_nsong_2: 'select station, kv, mw, amp, time, seconds, mvar, line_name from lines_table where date=$1 and hour=$2 and minute between $3 and $4 and seconds between $5 and $6 order by station, line_name, time, seconds',
    get_collapse: `select station, date, line_name, mw, kv, hour, minute, seconds, amp, time from lines_table where time between $1 and $2 and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru', 'phMain'
    ) 
    order by time`,
}

// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  lines;
