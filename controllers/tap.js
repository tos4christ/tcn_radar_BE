var model = require('../models/tap');
var db = require('../database/db');

const tap = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
tap.get = (req, res, next) => {
    // use current_id, equipment_name and level to recognize a current item
    const { query } = req;
    const { tap_id, date, level, type } = query;
    // Add date query to this in order to select other days
    db.query(model.get, [tap_id, date, Number(level), type])
        .then(resp => {
            res.send({res: resp.rows[0] })
        }).catch(err => console(err));        
}

tap.post = async (req, res, next) => {
    // In order to recognize other category of current, add equipment_name, level and type to what to extract from query and add to database
    const { data } = req.body;
    const { query } = req;
    const { tap_id,  station, feeder_name, type, level, date } = query;
    // check if the data exists then switch between posting and updating    
    await db.query(model.get, [tap_id, date, level, type])
        .then(resp => {            
            if(resp.rowCount > 0) {
                db.query(model.update, [data, tap_id]);
            } else {
                const hour = tap_id.split('-').pop();
                const equipment_id = 3;                
                db.query(model.create, [date, hour, data, equipment_id, feeder_name, tap_id, station, Number(level), feeder_name, type]);
            }
        })
        .then(respo => res.send({res: respo}))
        .catch(err => console.log(err))
}

tap.profile = (req, res, next) => {
    const { query } = req;
    const { feeder_name } = query;
    db.query(model.profile, [feeder_name, Date().split(' ').slice(0, 4).join(' ')])
        .then(resp => {
            res.send({res: resp.rows[0] })
        });        
}

module.exports =  tap;
