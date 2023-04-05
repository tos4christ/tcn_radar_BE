const lines = {
    create: 'INSERT INTO weather_table(date, hour, minute, seconds, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    get_station_coords: `SELECT * from station_coords_2`,
    
}

// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  lines;
