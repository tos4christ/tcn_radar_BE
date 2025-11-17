const { Pool } = require("pg");
var model = require('../models/lines');
var pool = require('../database/db');
var dateFormatter = require('../utility/dateFormatter');
var timeConverter = require('../utility/timeConverter');
var epochToHms = require('../utility/epochToHMS');
var temExtractor = require('../utility/temExtractor');
var voltageProfile = require('../utility/voltageProfile');
var XLSX = require('xlsx');
var PowerAdder = require('../utility/powerAdder');

const get_collapse = (t1, t2) => `
    SELECT station, date, line_name, mw, kv, hour, minute, seconds, amp, time 
    FROM lines_table 
    WHERE time BETWEEN ${t1} AND ${t2} 
    AND station IN (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru', 'taopex', 'phMain'
    ) 
    ORDER BY time
`;

const get_daily_2 = (t1, t2) => `
    SELECT * FROM lines_table 
    WHERE station IN (
        'omotosho2', 'eket', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs',
        'omotosho1', 'delta3', 'ekim', 'gereguPs', 'riversIppPs', 'gbarain', 'dadinKowaGs',
        'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'parasEnergyPs', 'olorunsogoPhase1Gs',
        'jebbaTs', 'okpaiGs', 'deltaGs', 'kainjiTs', 'egbinPs', 'afamIv_vPs', 'shiroroPs', 'odukpaniNippPs',
        'transamadiGs', 'afamVPs', 'zungeru', 'taopex', 'phMain'
    ) 
    AND time BETWEEN ${t1} AND ${t2}
    GROUP BY station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time 
    ORDER BY station, line_name, time;
`;

const get_hourly = (t1, t2) => `
    SELECT * FROM lines_table 
    WHERE station IN ('eket', 'ekim', 'phMain', 'lokojaTs', 'asaba', 'ugwuaji', 'gwagwalada', 'ikotEkpene')
    AND time BETWEEN ${t1} AND ${t2}
    GROUP BY station, line_name, id, date, mw, amp, kv, level, equipment_id, mvar, variant, time 
    ORDER BY station, line_name, time;
`;

const lines_model = {
    create: 'INSERT INTO feeder_rows(date, timestamp, mw, amp, time, hours) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
}

const lines = {};

lines.getdaily = async (req, res) => {
    const { body } = req;
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const searchDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(body.startDate) ? body.startDate : today;    

    let { start, end } = timeConverter(searchDate, searchDate, "00:00", "23:59");
    start = start.getTime();
    end = end.getTime() + 59000;

    try {
        const resp = await pool.query(get_daily_2(start, end));
        const data = resp.rows;
        const tem_data = temExtractor(data);

        const workbook = XLSX.utils.book_new();
        tem_data.forEach(temp => {
            const key = Object.keys(temp)[0];
            const worksheet = XLSX.utils.json_to_sheet(temp[key]);
            XLSX.utils.book_append_sheet(workbook, worksheet, key);
        });            

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
        res.attachment('tem.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error("❌ getdaily error:", err);
        res.status(500).send("Server error");
    }
};

lines.gethourlyvoltage = async (req, res) => {
    const { body } = req;
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const searchDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(body.startDate) ? body.startDate : today;    

    let { start, end } = timeConverter(searchDate, searchDate, "00:00", "23:59");
    start = start.getTime();
    end = end.getTime() + 59000;

    try {
        const resp = await pool.query(get_hourly(start, end));
        const data = resp.rows;                
        const tem_data = voltageProfile(data);

        const workbook = XLSX.utils.book_new();
        tem_data.forEach(temp => {
            const key = Object.keys(temp)[0];
            const worksheet = XLSX.utils.json_to_sheet(temp[key]);
            XLSX.utils.book_append_sheet(workbook, worksheet, key);
        });            

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
        res.attachment('voltageProfile.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error("❌ gethourlyvoltage error:", err);
        res.status(500).send("Server error");
    }
};

lines.getcollapse = async (req, res) => {
    const { body } = req;
    if (!body.startDate || !body.endDate || !body.startTime || !body.endTime) {
        return res.send({ data: 'Please supply necessary inputs' });
    }    

    const { start, end } = timeConverter(body.startDate, body.endDate, body.startTime, body.endTime);

    try {
        const resp = await pool.query(get_collapse(start.getTime(), end.getTime()));
        const data = resp.rows;
        const collapse_data = PowerAdder(data);

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(collapse_data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'IoT Generation Data');                       

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
        res.attachment('IoT.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error("❌ getcollapse error:", err);
        res.status(500).send("Server error");
    }
};


lines.createRows = (req, res) => {    
    const { body } = req;
    let { date, timestamp, mw, amp, time } = body;
    // console.log(body);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    date = date ? date : today;
    time = time ? time : new Date().toLocaleTimeString('en-GB', { hour12: false });
    const hours = epochToHms(time);

    pool.connect((err, client, done) => {
        if (err) throw err;
        client.query(lines_model.create, [date, timestamp, mw, amp, time, hours])
            .then( resp => {
                // const log = resp.rows;
                // console.log(log, 'the log')
                res.send({ message: 'Row created successfully', time: hours, timestamp });
            })
            .catch(err => console.log(err))
            .finally(() => done());
    })
}

module.exports = lines;
