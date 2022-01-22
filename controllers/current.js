var model = require('../models/current');
const db = require('../database/db');

const current = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
current.get = (req, res, next) => {
    const { query } = req;
    db.query(model.get, [query["current_id"]])
        .then(resp => {
            res.send({res: resp.rows[0] })
        }).catch(err => console);        
}

current.post = (req, res, next) => {
    const { data } = req.body;
    const { query } = req;
    // check if the data exists then switch between posting and updating    
    db.query(model.get, [query["current_id"]])
        .then(resp => {            
            if(resp.rowCount > 0) {
                db.query(model.update, [data, query["current_id"]]);
            } else {
                const hour = query["current_id"].split('-').pop();
                const feeder_name = query["feeder_name"];
                const equipment_id = 3;                
                db.query(model.create, [Date().split(' ').slice(0, 4).join(' '), hour, data, equipment_id, feeder_name, query["current_id"]]);
            }
        })
        .then(respo => res.send({res: respo}))
        .catch(err => console.log(err))
}

current.profile = (req, res, next) => {
    const { query } = req;
    const feeder_name = query["feeder_name"];
    db.query(model.profile, [feeder_name, Date().split(' ').slice(0, 4).join(' ')])
        .then(resp => {
            res.send({res: resp.rows[0] })
        });        
}

module.exports =  current;
