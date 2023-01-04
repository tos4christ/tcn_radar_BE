// var model = require('../models/equipment');
var db = require('../database/db');
const { Pool } = require("pg");

// Connecting to a different client
const pool_2 =  new Pool({
    user: 'postgres',
    host: '172.16.200.9',
    database: 'postgres',
    password: '000000',
    port: 5432
});

pool_2.on('error', (err, client) => {
    console.log(err, 'error from pool 2');
});
pool_2.on('connect', () => {
    console.log('connected on pool 2')
});
const get_freq = ()  => {
    return `SELECT * FROM frequency_table WHERE time_epoch BETWEEN $1 AND $2`;
}

const freq = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
freq.getFrequency = (req, res, next) => {
    // use current_id, equipment_name and level to recognize a current item
    const { query } = req;
    //const { frequency } = query;
    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const hour = time.split(':')[0];
    const minute = time.split(':')[1];
    const seconds = time.split(':')[2];
    
    // Add date query to this in order to select other days
    db.query(get_freq(), [1672826400000, 1672827659000])
        .then(resp => {
            // Declare constant to hold array of frequency objects
            const frequency_data = resp.rows;
            // Create a new workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(frequency_data)
            XLSX.utils.book_append_sheet(workbook, worksheet, "Frequency Data");          
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
            res.attachment('frequency.xlsx');
            res.send(buffer);
        })
        .catch(err => console);        
}

module.exports =  freq;
