var model = require('../models/station_line_load');
var db = require('../database/db');

const sll = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
sll.get = (req, res, next) => {
    const station_data = {};
    db.query(model.get_stations)
    .then(response => {
        // this returns the stations object with id and name
        const stations = response.rows;
        stations.forEach(station => {
            // Get the lines for each station and store the key pair of the line and arrays
            // of the 24hours power in the value of the key for the equipment
            station_data[station.name] = {};
            // this returns all the  lines belonging  to a station
            db.query(model.get_lines, [station.id, 330, 'line'])
                .then(equipment_response => {
                    const equipments = equipment_response.rows;
                    equipments.forEach(equipment => {
                        
                    })
                })
        })
        // return;
        // then on each station run the query to get the equipment belonging to each stations
        // res.send({res: resp.rows[0] })
    }).catch(err => console);   
    
    // Get all the staions for whose data we need to collate
         
}

// sll.post = (req, res, next) => {
//     // In order to recognize other category of current, add equipment_name, level and type to what to extract from query and add to database
//     const { data } = req.body;
//     // const { data } = bodyData;
//     const { query } = req;
//     const { current_id,  station, feeder_name, type, level, date } = query;
//     // check if the data exists then switch between posting and updating    
//     db.query(model.get, [current_id, date, level, type])
//         .then(resp => {            
//             if(resp.rowCount > 0) {
//                 db.query(model.update, [data, current_id]);
//             } else {
//                 const hour = current_id.split('-').pop();
//                 const equipment_id = 3;                
//                 db.query(model.create, [date, hour, data, equipment_id, feeder_name, current_id, station, Number(level), feeder_name, type]);
//             }
//         })
//         .then(respo => res.send({res: respo}))
//         .catch(err => console.log(err))
// }

module.exports =  sll;
