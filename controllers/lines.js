var model = require('../models/lines');
var db = require('../database/db');
var dateFormatter = require('../utility/dateFormatter');
var timeConverter = require('../utility/timeConverter');
// var stations = require('../database/stations');
var temExtractor = require('../utility/temExtractor');
var XLSX = require('xlsx');
var PowerAdder = require('../utility/powerAdder');

const lines = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
lines.uptime = (req, res) => {
    res.send({res: 'incoming'})
}

lines.getdaily = (req, res) => {
    const { body } = req;
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };   
    const today = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');
    const searchDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(body.startDate) ? body.startDate : today;    
    // query the db for the data to use for populating the excel sheet
    db.query(model.get_daily, [searchDate])
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
}

lines.getcollapse = (req, res, next) => {
    const { body } = req;
    if(!body.startDate || !body.endDate || !body.startTime || !body.endTime) {
        res.end({data: 'Please supply necessary inputs'})
    }    
    const { start, end} = timeConverter(body.startDate, body.endDate, body.startTime, body.endTime);
    console.log(start.getTime(), end.getTime(), 'get collapse start and end times')   
    // query the db for the data to use for populating the excel sheet
    db.query(model.get_collapse, [start.getTime(), end.getTime()])
        .then( resp => {
            const data = resp.rows;
            const collapse_data = PowerAdder(data);
            // Create a new workbook
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(collapse_data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'System Collpase Probe');                       
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
            res.attachment('tem.xlsx');
            res.send(buffer);
        })
}

lines.downtime = (req, res, next) => {
    return res.end();
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime } = body;
    const {start, end} = timeConverter(startDate, endDate, startTime, endTime);

    // check if the data exists then switch between posting and updating    
    db.query(model.get_downtime, [start.getTime(), end.getTime(), equipment, station])
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
        db.query(model.get_history_2, [station, start.getTime(), end.getTime()])
        .then(respo => {
            console.log(respo.rows);
            // return res.send({res: respo.rows})
            return res.send({res: {}})
        })
        .catch(err => console.log(err))
    } else {
        // check if the equipment and station are different, then return the equipment data only
        db.query(model.get_history, [station, equipment, start.getTime(), end.getTime()])
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
    db.query(model.get_average_5, [equipment, station])
        .then(respo => {
            const data = respo.rows;
            const avgHolder = {};
            // iterate the function to get the intervaled value
            for (let i = 0; i < interval_amount; i++) {
                
            }
            
        })
        .catch(err => console.log(err))
}

lines.profile = (req, res, next) => {
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime, profileType, parameter } = body;
    const {start, end} = timeConverter(startDate, endDate, startTime, endTime);
    let queryStatus;
    if(profileType === 'min') {
        queryStatus = model.get_profile_min(parameter, station, equipment, start.getTime(), end.getTime());
    } else if(profileType === 'max') {
        queryStatus = model.get_profile_max(parameter, station, equipment, start.getTime(), end.getTime());
    }
    // check if the data exists then switch between posting and updating
    if(!queryStatus) {
        return res.end({notice: 'the data sent is invalid'})
    }
    db.query(queryStatus)
        .then(respo => {
            return res.send({res: respo.rows})
        })
        .catch(err => console.log(err))
}

// Data is coming real time now, no need for this anymore
// Disabled
// lines.all = (req, res, next) => {
//     const { date, Hour, Minute, Seconds } = dateFormatter();

//     // get all the data for the given time and order them by station   
//     db.query(model.get_all_2, [ date, Number(Hour), Number(Minute), Number(Seconds) -2, Number(Seconds) + 2 ])
//         .then(respo => {
//             const data = respo.rows;
//             // console.log(data, 'the data')
            
//             // Use the stations key to filter all the rows coming from the database
//             // after filering for each station key, use the values for each
//             const refined_data = stations(data);
//             // console.log(refined_data)
//             const mappedObj = Object.entries(refined_data)
//             const tempArr = []
//             mappedObj.forEach(obj => {                
//                 const value = obj[1]               
//                 tempArr.push(value)
//             })            
//             return res.send({res: tempArr});
//         })
//         .catch(err => console.log(err))
// }

module.exports =  lines;
