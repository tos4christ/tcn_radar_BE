const gencos = {
    create: 'INSERT INTO genco_units_table(date, hour, minute, seconds, voltage, active_power, reactive_power, current, genco_name, unit_name, time, power_factor, frequency) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
    getAll: 'SELECT * FROM genco_units_table',
}

// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  gencos;
