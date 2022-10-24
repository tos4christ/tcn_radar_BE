// var model = require('../models/equipment');
// var db = require('../database/db');

const freq = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
freq.getFrequency = (req, res, next) => {
    // use current_id, equipment_name and level to recognize a current item
    const { query } = req;
    console.log('This is the frequency query string', query);

    res.end();
    
    // Add date query to this in order to select other days
    // db.query(model.get, [Number(station_id)])
    //     .then(resp => {
    //         res.send({res: resp.rows })
    //     }).catch(err => console);        
}

module.exports =  freq;
