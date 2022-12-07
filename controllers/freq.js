// var model = require('../models/equipment');
// var db = require('../database/db');
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
const save_freq = ()  => {
    return `INSERT INTO frequency_table (date, hour, minute, seconds, freq) VALUES($1, $2, $3, $4, $5) RETURNING *`;
}

const freq = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
freq.getFrequency = (req, res, next) => {
    // use current_id, equipment_name and level to recognize a current item
    const { query } = req;
    const { frequency } = query;
    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const hour = time.split(':')[0];
    const minute = time.split(':')[1];
    const seconds = time.split(':')[2];
    console.log('This is the frequency query string', query);

    //res.end();
    
    // Add date query to this in order to select other days
    pool_2.query(save_freq(), [date, hour, minute, seconds, frequency])
        .then(resp => {
            //res.send({res: resp.rows })
            res.end();
        }).catch(err => console);        
}

module.exports =  freq;
