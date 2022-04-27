var model = require('../models/lines');
var db = require('../database/db');

const lines = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
lines.uptime = (req, res, next) => {
    res.send({res: 'incoming'})
}

lines.downtime = (req, res, next) => {
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime } = body;
    // add one hour to the time hour to account for daylight savings
    const startHour = startTime.split(':')[0];
    const startMinute = startTime.split(':')[1];
    startTime = startHour+ ':' + startMinute;
    const sda = startDate.split('-');
    const startTimeArray = [Number(sda[0]), Number(sda[1])-1, Number(sda[2]), Number(startHour)+1, Number(startMinute), 0];

    const endHour = endTime.split(':')[0];
    const endMinute = endTime.split(':')[1];
    endTime = endHour+ ':' + endMinute;
    const eda = endDate.split('-');
    const endtTimeArray = [Number(eda[0]), Number(eda[1])-1, Number(eda[2]), Number(endHour)+1, Number(endMinute), 0];
 
    let start = new Date(...startTimeArray);
    let end = new Date(...endtTimeArray);

    //logic to flip time based on which one is greater
    if (start > end) {
        const hold = start;
        start = end;
        end = hold;
    }

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
    // add one hour to the time hour to account for daylight savings
    const startHour = startTime.split(':')[0];
    const startMinute = startTime.split(':')[1];
    startTime = startHour+ ':' + startMinute;
    const sda = startDate.split('-');
    const startTimeArray = [Number(sda[0]), Number(sda[1])-1, Number(sda[2]), Number(startHour)+1, Number(startMinute), 0];

    const endHour = endTime.split(':')[0];
    const endMinute = endTime.split(':')[1];
    endTime = endHour+ ':' + endMinute;
    const eda = endDate.split('-');
    const endtTimeArray = [Number(eda[0]), Number(eda[1])-1, Number(eda[2]), Number(endHour)+1, Number(endMinute), 0];
 
    let start = new Date(...startTimeArray);
    let end = new Date(...endtTimeArray);
    // logic to flip time based on which one is greater
    if (start > end) {
        const hold = start;
        start = end;
        end = hold;
    }
    // check if the data exists then switch between posting and updating    
    db.query(model.get_history, [station, equipment, start.getTime(), end.getTime()])
        .then(respo => {
            // console.log(respo.rows)
            return res.send({res: respo.rows})
        })
        .catch(err => console.log(err))
}

lines.average = (req, res, next) => {
    res.send({res: 'incoming'})
}

lines.profile = (req, res, next) => {
    const { body } = req;
    let { station, equipment, startDate, endDate, startTime, endTime, profileType, parameter } = body;
    // add one hour to the time hour to account for daylight savings
    const startHour = startTime.split(':')[0];
    const startMinute = startTime.split(':')[1];
    startTime = startHour+ ':' + startMinute;
    const sda = startDate.split('-');
    const startTimeArray = [Number(sda[0]), Number(sda[1])-1, Number(sda[2]), Number(startHour)+1, Number(startMinute), 0];

    const endHour = endTime.split(':')[0];
    const endMinute = endTime.split(':')[1];
    endTime = endHour+ ':' + endMinute;
    const eda = endDate.split('-');
    const endtTimeArray = [Number(eda[0]), Number(eda[1])-1, Number(eda[2]), Number(endHour)+1, Number(endMinute), 0];
 
    let start = new Date(...startTimeArray);
    let end = new Date(...endtTimeArray);

    //logic to flip time based on which one is greater
    if (start > end) {
        const hold = start;
        start = end;
        end = hold;
    }
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

lines.all = (req, res, next) => {
    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');    
    const Hour = time.split(':')[0];
    const Minute = time.split(':')[1];
    const Seconds = time.split(':')[2];

    // console.log(time, 'the data')

    // get all the data for the given time and order them by station   
    db.query(model.get_all, [ date, Number(Hour), Number(Minute), Number(Seconds) -1, Number(Seconds) + 1 ])
        .then(respo => {
            const data = respo.rows;
            // console.log(data, 'the data')
            return res.send({res: data});
        })
        .catch(err => console.log(err))
}

module.exports =  lines;
