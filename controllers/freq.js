// var model = require('../models/equipment');
var db = require('../database/db');
var timeConverter = require('../utility/timeConverter');
var XLSX = require('xlsx');
var model = require('../models/frequency');
// const socket = new WebSocket("ws://localhost")
var  WebSocket = require("ws");

const wss = new WebSocket.WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
    console.log("connected");
    // ws.on('message', function message(data) {
    //   console.log('received: %s', data);
    // });
  
    // ws.send('something');
  });

const ws = new WebSocket('ws://ws/pqube');
ws.on('open', function open() {
    console.log("socket opened");
  //ws.send('something');
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
});

const get_freq = ()  => {
    return `SELECT * FROM frequency_table WHERE time_epoch BETWEEN $1 AND $2 ORDER BY time_epoch`;
}

const freq = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
freq.getFrequency = (req, res, next) => {
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
        .catch(err => console);        
}

freq.sendFrequency = (req, res, next) => {
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
        .catch(err => console);        
}

module.exports =  freq;
