const { Pool } = require("pg");
var pool_1 = require('../database/db');
var dateFormatter = require('../utility/dateFormatter');
var timeConverter = require('../utility/timeConverter');
var bilateralExtractor = require('../utility/bilateralExtractor');
var XLSX = require('xlsx');
//const bilateral = require("../models/bilateral");

// Connecting to a different client
const pool_2 =  new Pool({
    user: 'postgres',
    host: '172.16.200.9',
    database: 'tcn_nas',
    password: '000000',
    port: 5432
});

const get_daily_2 = (t1, t2)  => {
    return `SELECT * FROM bilateral_table where name in 
    (
        'ikejaWest-sakate', 'First Maximum Point Industries Akure', 'Obafemi Awolowo University Ile-Ife',
        'zeberced', 'Niamey', 'Inner_Galaxy1', 'Inner_Galaxy2', 'PSML', 'ATVL', 'KamInd33kV', 'Gazaoua', 'quantum',
        'kamSteel', 'Er-Kang', 'kamSteel-Ilorin'
    ) and time between ${t1} and ${t2}
    group by name, date, line_name, mw, amp, kv, mvar, pf, f, hour, minute, seconds, time, id order by name, line_name, time;`;
}
const get_daily_2_1 = (t1, t2)  => {
    return `SELECT station as name, date, line_name, mw, amp, kv, mvar, hour, minute, seconds, time, id FROM lines_table where station in 
    (
        'phoenix', 'pulkitSteel', 'sunflag'
    ) and time between ${t1} and ${t2}
    group by name, date, line_name, mw, amp, kv, mvar, hour, minute, seconds, time, id order by name, line_name, time;`;
}


const bilateral = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.

bilateral.hourly = (req, res) => {
    // return res.end();
    const { body } = req;
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const searchDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(body.startDate) ? body.startDate : today;    
    // query the db for the data to use for populating the excel sheet
    let { start, end} = timeConverter(searchDate, searchDate, "00:00", "23:59");
    start = start.getTime();
    end = end.getTime() + 59000;
    pool_1.connect((err, client, done) => {
        if (err) throw err;
        client.query(get_daily_2(start, end))
            .then( resp_1 => {
                client.query(get_daily_2_1(start, end))
                    .then( resp => {
                        const data = resp.rows ? resp.rows : [];
                        const data_2 = resp_1.rows ? resp_1.rows : [];
                        console.log(data_2, '  data_2');
                        return;
                        const bilateral_data = bilateralExtractor([...data, ...data_2]);
                        //console.log(bilateral_data, "  bilateral_data");
                        //return res.end();
                        // Create a new workbook
                        const workbook = XLSX.utils.book_new();
                        bilateral_data.forEach( (temp) => {
                            const key = Object.keys(temp)[0];
                            const worksheet = XLSX.utils.json_to_sheet(temp[key])
                            XLSX.utils.book_append_sheet(workbook, worksheet, key);
                        });            
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
                        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
                        res.attachment('bilateral.xlsx');
                        res.send(buffer);
                    })
                    .catch(err => console.log(err))
                    .finally(() => done())
            })            
            .catch(err => console.log(err))
            .finally(() => done())
    })
}


module.exports =  bilateral;
