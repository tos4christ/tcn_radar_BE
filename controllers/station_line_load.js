var model = require('../models/station_line_load');
var db = require('../database/db');
const station_data = {};
const sll = {};
// Controller first checks to see if the particular row exists or not, this determines
// If the row will be created or displayed.
sll.get = async (req, res, next) => {
    const { query } = req;
    const { date } = query;
    const queryFunction = async () => {
        await db.query(model.get_stations)
            .then(response => {
                // this returns the stations object with id and name
                const stations = response.rows;
                stations.map((station, stationIndex, stationArray) => {
                    // Get the lines for each station and store the key pair of the line and arrays
                    // of the 24hours power in the value of the key for the equipment
                    station_data[station.name] = {};
                    // this returns all the  lines belonging  to a station                    
                    db.query(model.get_lines, [station.id, 330, 'line'])
                        .then(async equipment_response => {
                            const equipments = equipment_response.rows;
                            // equipments.map((equipment, equipmentIndex, equipmentArray) => {                                
                            // // get_line_load
                            // // equipment_name, level=330, equipment_type=line
                            // // get the power details for the specified date
                            // db.query(model.get_line_load, [equipment.name, 330, 'line', '2022-02-19'])
                            //     .then( linePower => {
                            //         return station_data[station.name][equipment.name] = linePower.rows;                                
                            //     })
                            //     .then( (lastRes) => {
                            //         console.log(lastRes, 'last res')             
                            //         const theEnd = stationArray.length === stationIndex + 1 && equipmentArray.length === equipmentIndex + 1;
                            //         if (theEnd) {
                            //             res.send({data: station_data});
                            //         }                            
                            //     })
                            // }); 
                            for (let equipment of equipments) {
                                await db.query(model.get_line_load, [equipment.name, 330, 'line', date])
                                .then( linePower => {
                                    return station_data[station.name][equipment.name] = linePower.rows;                                
                                })
                                .then( () => {    
                                    const theEnd = stationArray.length === stationIndex + 1 && equipments[equipments.length - 1] === equipment;
                                    if (theEnd) {
                                        res.send({data: station_data});
                                    }                            
                                })
                            }                                    
                        });
                });
                // return;
                // then on each station run the query to get the equipment belonging to each stations
                // res.send({res: resp.rows[0] })
            })
            .catch(err => console(err));
            return;
    }
    await queryFunction.apply(this);       
    
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
