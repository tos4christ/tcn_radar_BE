// const fs = require('fs');
const mydb = require("../database/db");
var model = require("../models/lines");
const timeConverter = require('./timeConverter')

// Get all the data
// date, start-(hour, minute, seconds), end-(hour, minute, seconds)
const startDate = '2022-09-25', endDate = '2022-09-25', startTime = '00:00', endTime = '10:00';
const { start, end} = timeConverter(startDate, endDate, startTime, endTime);
console.log(start, end, 'the start and end time')
mydb.query(model.get_collapse, [start, end])
    .then( data => {
        const row_data = data.rows;
        const result = addPower(row_data);
        console.log(result, 'power data result');
    })

function addPower( data ) {
    // const start_hour = req.body.start_hour;

    const station_array = [
        {
            afamIv_vPs: [
                {
                    gt17: []
                },
                {
                    gt18: []
                }
            ] 
        },
        {
            shiroroPs: [
                {
                    '411g1': []
                },
                {
                    '411g2': []
                },
                {
                    '411g3': []
                },
                {
                    '411g4': []
                }
            ]  
        },
        {
            egbinPs: [
                {
                    st1: []
                },
                {
                    st2: []
                },
                {
                    st3: []
                },
                {
                    st4: []
                },
                {
                    st5: []
                },
                {
                    st6: []
                }
            ]  
        },
        {
            kainjiTs: [
                {
                    k1j: []
                },
                {
                    k2j: []
                },
                {
                    k3r: []
                },
                {
                    k1f: []
                }
            ] 
        },
        {
            jebbaTs: [
                {
                    b8j: []
                },
                {
                    b9j: []
                }
            ]  
        },
        {
            okpaiGs: [
                {
                    k1t: []
                },
                {
                    k2t: []
                }
            ]  
        },
        {
            deltaGs: [
                {
                    g3b: []
                },
                {
                    s4g: []
                }
            ] 
        },
        {
            omotosho2: [
                {
                    tr3: []
                },
                {
                    tr4: []
                }
            ]
        },
        {
            omotosho1: [
                {
                    tr1: []
                },
                {
                    tr2: []
                }
            ]
        },
        {
            eket: [
                {
                    e21m: []
                },
                {
                    e22m: []
                }
            ]
        },
        {
            phMain: [
                {
                    m21p: []
                }
            ]
        },
        {
            afamViTs: [
                {
                    ada200: []
                },
                {
                    adb200: []
                }
            ]
        },
        {
            alaoji: [
                {
                    l7a: []
                },
                {
                    l8a: []
                }
            ]
        },
        {
            sapeleNippPs: [
                {
                    st1: []
                }, 
                {
                    st3: []
                }, 
                {
                    gt1: []
                }, 
                {
                    gt2: []
                }, 
                {
                    gt3: []
                }, 
                {
                    gt4: []
                }
            ]
        },
        {
            omotoshoNippPs: [
                {
                    tr1: []
                },
                {
                    tr2: []
                },
                {
                    tr3: []
                },
                {
                    tr4: []
                }
            ]
        },
        {
            odukpaniGs: [
                {
                    d1b: []
                },
                {
                    d2b: []
                }
            ]
        },
        {
            ekim: [
                {
                    ek1m: []
                }
            ]
        },
        {
            gereguPs: [
                {
                    r1j: []
                }, 
                {
                    r2j: []
                }, 
                {
                    gt11: []
                }, 
                {
                    gt12: []
                }, 
                {
                    gt13: []
                }
            ]
        },
        {
            ikotEkpene: [
                {
                    d1k: []
                },
                {
                    d2k: []
                }
            ]
        },
        {
            riversIppPs: [
                {
                    gt1: []
                }
            ]
        },
        {
            omokuPs1: [
                {
                    o1r: []
                }
            ]
        },
        {
            ihovborNippPs: [
                {
                    ohl1: []
                },
                {
                    ohl2: []
                },
                {
                    gt1: []
                }, 
                {
                    gt2: []
                }, 
                {
                    gt3: []
                }, 
                {
                    gt4: []
                }
            ]
        },
        {
            olorunsogo1: [
                {
                    tr1: []
                }, 
                {
                    tr2: []
                }
            ]
        },
        {
            delta2: [
                {
                    tr3: []
                },
                {
                    tr4: []
                }
            ]
        },
        {
            delta3: [
                {
                    tr5: []
                },
                {
                    tr6: []
                }
            ]
        },
        {
            parasEnergyPs: [
                {
                    '132cb': []
                }
            ]
        },
        {
            olorunsogoPhase1Gs: [
                {
                    r2a: []
                }, 
                {
                    r1w: []
                }, 
                {
                    tr4: []
                }, 
                {
                    tr3: []
                }
            ]
        },
        {
            gbarain: [
                {
                    st1: []
                },
                {
                    st2: []
                }
            ] 
        },
        {
            dadinKowaGs: [
                {
                    w21b: []
                },
                {
                    w23e: []
                }
            ]
        }
    ];

    // map the data from the database into the station_array (this is an expensive operation)
    station_array.forEach(station => {
        let equipment_array;
        // Filter the station data for all the equipment
        const station_data = data.filter( sdat => sdat.station === Object.keys(station)[0] )
        // check if there is a station data there, then get the equipment array to filter and store the equipment values
        if (station_data && station_data.length > 0) {
            // Get the equipment array from station array object
            equipment_array = station[Object.keys(station)[0]];
            // iterate through the equipment array, use the equipment name to filter for the equipment values from station_data
            equipment_array.forEach( equipment => {                
                const equipment_data = station_data.filter( edat => edat.line_name === Object.keys(equipment)[0]);

                // No need to sort the equipment
                // const resorted_array = Equipment_Sorter(equipment_data);
                equipment[Object.keys(equipment)[0]].push(equipment_data);
            })
        } else {
            return null;
        }        
    });
    // console.log(JSON.stringify(station_array[15]), 'the station array 1');
    // console.log(JSON.stringify(station_array[18]), 'the station array 2')
    // const writeStream = fs.createWriteStream('logger.txt');
    // writeStream.write(station_array);
    // writeStream.end()
    return Station_Adder(station_array);
};

function Equipment_Sorter(equipment_array) {
    let hour = 0, minute = 0;
    const res_data = [];
    while( hour < 24 ) {
        const pres_min = equipment_array.filter(equip => equip.hour === hour && equip.minute === minute);        
        let max_voltage = 0, divisor = pres_min.length;
        // Iterate over the filtered data to recaliberate
        if (pres_min && pres_min.length > 0) {
            const mw_sum = pres_min.reduce((acc, curr) => {
                const sum = acc + curr.mw;
                max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                return sum;
            },0)
            const amp_sum = pres_min.reduce((acc, curr) => {
                const sum = acc + curr.amp;
                return sum;
            },0)
            const mvar_sum = pres_min.reduce((acc, curr) => {
                const sum = acc + curr.mvar;
                return sum;
            },0);
            // replace the mw, amp, mvar
            // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
            const date = pres_min[0].date;
            const equipment_id = pres_min[0].equipment_id;
            const station = pres_min[0].station;
            const level = pres_min[0].level;
            const line_name = pres_min[0].line_name;
            const id = hour;
            const variant = pres_min[0].variant;
            const time = pres_min[pres_min.length - 1].time;
            const kv = max_voltage;
            // Get the average of the mw, amp and mvar
            const mw = mw_sum / divisor;
            const amp = amp_sum / divisor;
            const mvar = mvar_sum / divisor;
            res_data.push({
                date, equipment_id, station, level, line_name, id, variant, time, kv, mw, amp, mvar, hour, minute
            })
            // increment minute by 1 for the next iteration
            minute += 1;
            // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
            // to start the next hour iteration
            if (minute === 60) {
                hour += 1;
                minute = 0;
            }
        } else {
            // increment minute by 1 for the next iteration
            minute += 1;
            // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
            // to start the next hour iteration
            if (minute === 60) {
                hour += 1;
                minute = 0;
            }
        }
    }
    return res_data;
};

function addSimilarEquipment(array) {
    const finalArray = [];
    finalArray.push(...array[0]);
    if (array.length < 2) {
        return finalArray;
    }
    for (let i=1; i < array.length; i++) {
        const current_array = array[i];
        current_array.forEach( (item, index) => {
            finalArray[index].mw += finalArray[index].mw + item.mw;
        });
    }
    return finalArray;
}
function addDissimilarEquipment(array1, array2) {
    // ENSURE THE ARRAYS ARE SORTED ACCORDING TO TIME IN THE RETRIEVAL SO COMPARISON IS EASIER
    // check for the items with the shortest item
    const short_array = array1.length < array2.length ? array1 : array2;
    const long_array = array1.length < array2.length ? array2 : array1;
    const finalArray = [];
    finalArray.push(...short_array);

    let last_item_time = 1;

    long_array.forEach( (item, index) => {
        // First filter the item with the closest time to this
        // This is an N^2 operation
        const chosen_item = finalArray.filter( f_arr => {
            const item_time_diff = Math.abs(f_arr.time - item.time);
            // If the time difference is less than 4000 and the time is not the same as the last_item_time that was
            // saved from a previous operation then chose the item and set it as the previous
            if (item_time_diff < 4000 && f_arr.time !== last_item_time) {
                last_item_time = f_arr.time;
                return true;
            }
        })
        // add the filtered item    
        finalArray[index].mw += finalArray[index].mw + chosen_item.mw;        
        
    })
}

function Station_Adder(station_array) {
    const res_data = [
        'AFAM VI (GAS|STEAM)', 'ALAOJI NIPP (GAS)', 'SAPELE NIPP (GAS)', 'SAPELE (STEAM)', 'ODUKPANI NIPP (GAS)', 'JEBBA (HYDRO)',
         'RIVERS IPP (GAS)', 'OMOKU (GAS)', 'IHOVBOR NIPP (GAS)', 'OLORUNSOGO NIPP', 'DELTA (GAS)', 'OMOTOSHO (GAS)', 'KAINJI (HYDRO)',
         'PARAS ENERGY (GAS)', 'OMOTOSHO NIPP (GAS)', 'GEREGU NIPP (GAS)', 'AZURA-EDO IPP (GAS)', 'TRANS-AMADI (GAS)', 'EGBIN (STEAM)',
         'IBOM POWER (GAS)', 'OLORUNSOGO (GAS)', 'GBARAIN NIPP (GAS)', 'GEREGU (GAS)', 'DADINKOWA G.S (HYDRO)', 'OKPAI (GAS|STEAM)',
         'AFAM IV & V (GAS)', 'SHIRORO (HYDRO)'
    ];
    const final_array = [];
    // replace the mw, amp, mvar
    // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
    res_data.forEach(station_name => {
        if (station_name) {
            if (station_name === 'AFAM IV & V (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'afamIv_vPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['afamIv_vPs'];                
                // run logic only if there is an equipment to iterate
                return addSimilarEquipment(equipment_to_sum);
            }
            if (station_name === 'SHIRORO (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'shiroroPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['shiroroPs'];                
                
            }
            if (station_name === 'EGBIN (STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'egbinPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['egbinPs'];                
                
            }
            if (station_name === 'KAINJI (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'kainjiTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['kainjiTs'];                
                
            }
            if (station_name === 'JEBBA (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'jebbaTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['jebbaTs'];                
                
            }
            if (station_name === 'OKPAI (GAS|STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'okpaiGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['okpaiGs'];                
                
            }
            if (station_name === 'DADINKOWA G.S (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'dadinKowaGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['dadinKowaGs'];                
                
            }
            if (station_name === 'AFAM VI (GAS|STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'afamViTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['afamViTs'];                
                
            }
            if (station_name === 'ALAOJI NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'alaoji');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['alaoji'];
                
            }
            if (station_name === 'SAPELE NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sapeleNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sapeleNippPs'].filter( sa => Object.keys(sa)[0] === 'gt1' || Object.keys(sa)[0] === 'gt2' || Object.keys(sa)[0] === 'gt3' || Object.keys(sa)[0] === 'gt4');
                
            }
            if (station_name === 'SAPELE (STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sapeleNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sapeleNippPs'].filter( sa => Object.keys(sa)[0] === 'st1' || Object.keys(sa)[0] === 'st3');
                
            }            
            if (station_name === 'RIVERS IPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'riversIppPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['riversIppPs'];
                
            }
            if (station_name === 'OMOKU (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omokuPs1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omokuPs1'];
                
            }            
            if (station_name === 'IHOVBOR NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ihovborNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ihovborNippPs'].filter( sa => Object.keys(sa)[0] === 'gt1' || Object.keys(sa)[0] === 'gt2' || Object.keys(sa)[0] === 'gt3' || Object.keys(sa)[0] === 'gt4');
                
            }
            if (station_name === 'AZURA-EDO IPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ihovborNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ihovborNippPs'].filter( sa => Object.keys(sa)[0] === 'ohl1' || Object.keys(sa)[0] === 'ohl2');
               
            }            
            if (station_name === 'PARAS ENERGY (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'parasEnergyPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['parasEnergyPs'];
                
            }
            if (station_name === 'OMOTOSHO NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omotoshoNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omotoshoNippPs'];
                
            }
            if (station_name === 'GEREGU NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gereguPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'r1j' || Object.keys(sa)[0] === 'r2j');
                const equipment_to_subtract = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'gt11' || Object.keys(sa)[0] === 'gt12' || Object.keys(sa)[0] === 'gt13');
                
            }
            if (station_name === 'GEREGU (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gereguPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'gt11' || Object.keys(sa)[0] === 'gt12' || Object.keys(sa)[0] === 'gt13');
                
            }
            if (station_name === 'TRANS-AMADI (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'phMain');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['phMain'];
                
            }            
            if (station_name === 'GBARAIN NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gbarain');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gbarain'];
                 
            }

            if (station_name === 'IBOM POWER (GAS)') {
                const temp_hold = [];
                const station_to_subtract = station_array.filter( sa => Object.keys(sa)[0] === 'ekim');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'eket');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_subtract = station_to_subtract[0]['ekim'];
                const equipment_to_sum = station_to_add_2[0]['eket'];
                
            }
            if (station_name === 'OLORUNSOGO NIPP') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogoPhase1Gs');
                const station_to_subtract = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogo1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'r1w' || Object.keys(sa)[0] === 'r2a');
                const equipment_to_subtract = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'tr3' || Object.keys(sa)[0] === 'tr4');
                const equipment_to_subtract_2 = station_to_subtract[0]['olorunsogo1'];
                
            }
            if (station_name === 'OLORUNSOGO (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogoPhase1Gs');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogo1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'tr3' || Object.keys(sa)[0] === 'tr4');
                const equipment_to_sum_2 = station_to_add_2[0]['olorunsogo1'];
                
            }
            if (station_name === 'ODUKPANI NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'odukpaniGs');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'ikotEkpene');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['odukpaniGs'];
                const equipment_to_sum_2 = station_to_add_2[0]['ikotEkpene'].filter( sa => Object.keys(sa)[0] === 'd1k' || Object.keys(sa)[0] === 'd2k');
                             
            }
            if (station_name === 'OMOTOSHO (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omotosho1');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'omotosho2');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omotosho1'];
                const equipment_to_sum_2 = station_to_add_2[0]['omotosho2'];
                
            }
            if (station_name === 'DELTA (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'delta2');
                const station_to_add_1 = station_array.filter( sa => Object.keys(sa)[0] === 'delta3');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'deltaGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['delta2'];
                const equipment_to_sum_1 = station_to_add_1[0]['delta3'];
                const equipment_to_sum_2 = station_to_add_2[0]['deltaGs'];
                
            }
        }
    });
    // console.log(JSON.stringify(final_array), 'the final array');
    return final_array;
};
