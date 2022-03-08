var model = require('../models/lines');
var db = require('../database/db');

const lines = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
lines.uptime = (req, res, next) => {
         
}

lines.downtime = (req, res, next) => {
    
}

lines.history = (req, res, next) => {
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime } = body;    
    // add one hour to the time hour to account for daylight savings
    const startHour = startTime.split(':')[0];
    const startMinute = startTime.split(':')[1];
    startTime = startHour+ ':' + startMinute;
    const sda = startDate.split('-');
    const startTimeArray = [Number(sda[0]), Number(sda[1])-1, Number(sda[2]), Number(startHour)+1, Number(startMinute), 59];

    const endHour = endTime.split(':')[0];
    const endMinute = endTime.split(':')[1];
    endTime = endHour+ ':' + endMinute;
    const eda = endDate.split('-');
    const endtTimeArray = [Number(eda[0]), Number(eda[1])-1, Number(eda[2]), Number(endHour)+1, Number(endMinute), 59];
 
    let start = new Date(...startTimeArray);
    let end = new Date(...endtTimeArray);
    // console.log(start, start.getTime(), end, end.getTime(), 'the time')
    // logic to flip time based on which one is greater
    if (start > end) {
        const hold = start;
        start = end;
        end = hold;
    }
    // check if the data exists then switch between posting and updating    
    db.query(model.get_history, [station, equipment, start.getTime(), end.getTime()])
        .then(respo => {
            return res.send({res: respo.rows})
        })
        .catch(err => console.log(err))
}

lines.average = (req, res, next) => {
    
}

lines.profile = (req, res, next) => {
    
}

module.exports =  lines;
