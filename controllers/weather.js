const { Pool } = require("pg");
var model = require('../models/lines');
var pool_1 = require('../database/db');
var dateFormatter = require('../utility/dateFormatter');
var timeConverter = require('../utility/timeConverter');
// var stations = require('../database/stations');
var temExtractor = require('../utility/temExtractor');
var XLSX = require('xlsx');
var PowerAdder = require('../utility/powerAdder');

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
})
pool_2.on('connect', () => {
    console.log('connected on pool 2')
})

const get_collapse = (t1, t2) => {
    return `select station, date, line_name, mw, kv, hour, minute, seconds, time from lines_table where time between ${t1} and ${t2} and station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs'
    ) 
    order by time`;
}

const get_daily_2 = (t1, t2)  => {
    return `SELECT * FROM lines_table where station in 
    (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs'
    ) and time between ${t1} and ${t2}
    group by station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time order by station, line_name, time;`;
}


const lines = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
lines.uptime = (req, res) => {
    res.send({res: 'incoming'})
}

lines.nari = (req, res) => {
    const { body, query } = req;
    console.log(body, " the body of the request ", query, " the query of the request ");
    res.end();
}

lines.getdaily = (req, res) => {
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
            .then( resp => {
                const data = resp.rows;
                const tem_data = temExtractor(data);
                // Create a new workbook
                const workbook = XLSX.utils.book_new();
                tem_data.forEach( (temp) => {
                    const key = Object.keys(temp)[0];
                    const worksheet = XLSX.utils.json_to_sheet(temp[key])
                    XLSX.utils.book_append_sheet(workbook, worksheet, key);
                });            
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
                const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
                res.attachment('tem.xlsx');
                res.send(buffer);
            })
            .catch(err => console.log(err))
            .finally(() => done())
    })
    // client.query(get_daily_2(start, end))
    //     .then( resp => {
    //         const data = resp.rows;
    //         const tem_data = temExtractor(data);
    //         // Create a new workbook
    //         const workbook = XLSX.utils.book_new();
    //         tem_data.forEach( (temp) => {
    //             const key = Object.keys(temp)[0];
    //             const worksheet = XLSX.utils.json_to_sheet(temp[key])
    //             XLSX.utils.book_append_sheet(workbook, worksheet, key);
    //         });            
    //         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    //         // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
    //         const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
    //         res.attachment('tem.xlsx');
    //         res.send(buffer);
    //     });

}

lines.getcollapse = (req, res, next) => {
    const { body } = req;
    if(!body.startDate || !body.endDate || !body.startTime || !body.endTime) {
        res.end({data: 'Please supply necessary inputs'})
    }    
    const { start, end} = timeConverter(body.startDate, body.endDate, body.startTime, body.endTime);
    // query the pool_1 for the data to use for populating the excel sheet
    pool_1.query(get_collapse(start.getTime(), end.getTime()))
        .then( resp => {
            const data = resp.rows;
            const collapse_data = PowerAdder(data);
            // console.log(JSON.stringify(collapse_data), 'the collapse data');
            // Create a new workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(collapse_data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'IoT Generation Data');                       
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
            res.attachment('IoT.xlsx');
            res.send(buffer);
        });
}

lines.downtime = (req, res, next) => {
    return res.end();
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime } = body;
    const {start, end} = timeConverter(startDate, endDate, startTime, endTime);

    // check if the data exists then switch between posting and updating    
    pool_1.query(model.get_downtime, [start.getTime(), end.getTime(), equipment, station])
        .then(respo => {
            const data = respo.rows;
            let dateRange = {}, i=0;
            dateRange[i] = [];
            // function ro reduce the rows to the range of downtime and return the dtae between

            // if rows are empty do not carry out this operation
            if (respo.rowCount > 0) {
                data.reduce((init, curr, index) => {
                    // console.log(index, 'the index');
                    if(init) {
                        const  time1 = init.time;
                        dateRange[i].push(new Date(time1 * 1));
                    }
                    const prev_time = data[index - 1].time
                    const curr_time = curr.time;
                    // console.log(prev_time - curr_time, 'the time difference')
                    if (curr_time - prev_time > 10000) {
                        dateRange[i].push(new Date(prev_time * 1));
                        i += 1;
                        dateRange[i] = [new Date(curr_time * 1)];
                    }                
                });
            } else {
                dateRange = 'There are no downtime in that date range'
            }
            return res.send({res: dateRange})
        })
        .catch(err => console.log(err))
}

lines.history = (req, res, next) => {
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime } = body;    
    const {start, end} = timeConverter(startDate, endDate, startTime, endTime);
    
    // console.log(station, equipment, 'the data')
    // check if the equipment and station are the same, 
    // if the same return the compilation sum for the station
    if (station == equipment) {
        return;
        
    } else {
        // check if the equipment and station are different, then return the equipment data only
        pool_1.query(model.get_history, [station, equipment, start.getTime(), end.getTime()])
        .then(respo => {
            return res.send({res: respo.rows})
        })
        .catch(err => console.log(err))
    }
}

lines.average = (req, res, next) => {
    console.log('i got here')
    return;
    const { body } = req;
    let { station, equipment, checkDate} = body;
    // console.log(station, equipment, checkDate, 'the station')
    
    // get the amount of hour and divide it into 5 minutes interval
    const {date, Hour, Minute, Seconds} = dateFormatter();
    const { start, end } = timeConverter(date, date, '00:00:00', new Date().toLocaleTimeString("en-GB").split(' ')[0])
    // console.log(start.getTime(), end.getTime(), date, 'the dates')
    const timeDiff = end.getTime() - start.getTime();
    const interval_amount = Math.floor(timeDiff / 300000);

    // check if the data exists then switch between posting and updating    
    
}

module.exports =  lines;
