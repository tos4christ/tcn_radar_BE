var model = require('../models/equipment');
var db = require('../database/db');

const equipment = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
equipment.get = (req, res, next) => {
    // use current_id, equipment_name and level to recognize a current item
    const { query } = req;
    const { station_id } = query;
    
    // Add date query to this in order to select other days
    db.query(model.get, [Number(station_id)])
        .then(resp => {
            res.send({res: resp.rows })
        }).catch(err => console);        
}

equipment.post = (req, res, next) => {
    const { query } = req;
    const { name,  maker, station_id, level, type } = query;
    // check if the data exists then switch between posting and updating    
    db.query(model.create, [name, maker, Number(station_id), Number(level), type])
        .then(respo => res.send({res: respo}))
        .catch(err => console.log(err))
}

module.exports =  equipment;
