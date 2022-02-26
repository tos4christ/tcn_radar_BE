var model = require('../models/reactor');
var db = require('../database/db');

const reactor = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
reactor.get = (req, res, next) => {
    // use current_id, equipment_name and level to recognize a current item
    const { query } = req;
    const { reactor_id, date, level, type } = query;
    // Add date query to this in order to select other days
    db.query(model.get, [reactor_id, date, Number(level), type])
        .then(resp => {
            res.send({res: resp.rows[0] })
        }).catch(err => console);        
}

reactor.post = async (req, res, next) => {
    // In order to recognize other category of current, add equipment_name, level and type to what to extract from query and add to database
    const { data } = req.body;
    const { query } = req;
    const { reactor_id,  station, feeder_name, type, level, date } = query;
    // check if the data exists then switch between posting and updating    
    await db.query(model.get, [reactor_id, date, level, type])
        .then(resp => {            
            if(resp.rowCount > 0) {
                db.query(model.update, [data, reactor_id]);
            } else {
                const hour = reactor_id.split('-').pop();
                const equipment_id = 3;                
                db.query(model.create, [date, hour, data, equipment_id, feeder_name, reactor_id, station, Number(level), feeder_name, type]);
            }
        })
        .then(respo => res.send({res: respo}))
        .catch(err => console.log(err))
}

reactor.profile = (req, res, next) => {
    const { query } = req;
    const { feeder_name } = query;
    db.query(model.profile, [feeder_name, Date().split(' ').slice(0, 4).join(' ')])
        .then(resp => {
            res.send({res: resp.rows[0] })
        });        
}

module.exports =  reactor;
