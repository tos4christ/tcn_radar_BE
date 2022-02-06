var model = require('../models/reports');
var db = require('../database/db');

const reports = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
reports.get = (req, res, next) => {
    const date = new Date();
    const newDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    db.query(model.get, [newDate])
        .then(resp => {
            res.send({res: resp.rows })
        });        
}

reports.post = (req, res, next) => {    
    const { feedername, reporttype, partyresponsible, event, dateout, timeout, datein, timein, comment, status } = req.body;
    const date = new Date();
    const newDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    // check if the data exists then switch between posting and updating    
    db.query(model.create, [newDate, feedername, reporttype, partyresponsible, event, dateout, timeout, datein, timein, comment, status])
        .then(respo => res.send({res: respo}))
}

// Update Reports
reports.update = (req, res, next) => {
         
}


module.exports =  reports;
