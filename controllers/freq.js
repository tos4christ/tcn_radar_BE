// var model = require('../models/equipment');
var db = require('../database/db');
var timeConverter = require('../utility/timeConverter');
var XLSX = require('xlsx');
var model = require('../models/frequency');

const get_freq = ()  => {
    return `SELECT * FROM frequency_table WHERE time_epoch BETWEEN $1 AND $2 ORDER BY time_epoch`;
}

const freq = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
freq.getFrequency = (req, res, next) => {
    // return res.end();
    // use current_id, equipment_name and level to recognize a current item
    const { body } = req;    
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const searchDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(body.startDate) ? body.startDate : today;
    let { start, end} = timeConverter(searchDate, searchDate, "00:00", "23:59");
    start = start.getTime();
    end = end.getTime() + 59000;
    //console.log(start, end, "the time");
    // Add date query to this in order to select other days
    db.query(get_freq(), [start, end])
        .then(resp => {
            // Declare constant to hold array of frequency objects
            const frequency_data = resp.rows;
            // console.log(frequency_data, "the frequency data");
            // Create a new workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(frequency_data);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Frequency Data");      
            // console.log(workbook, "the worknook");    
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
            res.attachment('frequency.xlsx');
            res.send(buffer);
        })
        .catch((err) => { console.error('getFrequency failed:', err.message); if (!res.headersSent) res.status(500).json({ status: 'error', error: 'The frequency sheet could not be made.' }); });        
}

freq.get = (req, res) => {
    // use current_id, equipment_name and level to recognize a current item
   const { query } = req;
   console.log(query, " this is the query");
   res.end();
}

freq.getWeather = (req, res, next) => {
    // Security fix: this fetched any address sent in the body (the server could be made to call
    // internal machines) and never answered, so each call hung. Only OpenWeatherMap addresses are
    // fetched now, and the result is returned. No page of the app calls this endpoint.
    const { body } = req;
    let target = null;
    try { target = new URL(String((body && body.url) || '')); } catch (e) { target = null; }
    if (!target || target.protocol !== 'https:' || target.hostname !== 'api.openweathermap.org') {
        return res.status(400).json({ status: 'error', error: 'Only https://api.openweathermap.org addresses are allowed.' });
    }
    fetch(target.href, { method: "GET", headers: { "Content-Type": "application/json" } })
        .then(response => response.json())
        .then(resp => res.send({ weather: resp }))
        .catch(e => {
            console.error(e);
            if (!res.headersSent) res.status(502).json({ status: 'error', error: 'The weather provider did not answer.' });
        });
}

module.exports =  freq;
