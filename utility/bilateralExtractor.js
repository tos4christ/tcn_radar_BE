// const fs = require('fs');

module.exports = ( data ) => {
    const station_array = [
        {
            "kamSteel-Ilorin": [
                {
                    l1: []
                },
                {
                    l2: []
                }
            ] 
        },
        {
            "Er-Kang": [
                {
                    "Er-Kang": []
                }
            ] 
        },
        {
            kamSteel: [
                {
                    kamSteel: []
                }
            ] 
        },
        {
            phoenix: [
                {
                    pt1: []
                }
            ]  
        },
        {
            sunflag: [
                {
                    sl1: []
                }
            ]  
        },
        {
            pulkitSteel: [
                {
                    psl1: []
                }
            ] 
        },
        {
            "Obafemi Awolowo University Ile-Ife": [
                {
                    "Obafemi Awolowo University Ile-Ife": []
                }
            ]  
        },
        {
            "First Maximum Point Industries Akure": [
                {
                    "First Maximum Point Industries Akure": []
                }
            ]  
        },
        {
            quantum: [
                {
                    qt1: []
                }
            ] 
        },
        {
            PSML: [
                {
                    PSML: []
                }
            ]
        },
        {
            Inner_Galaxy1: [
                {
                    Inner_Galaxy1: []
                }
            ]
        },
        {
            zeberced: [
                {
                    zeberced: []
                }
            ]
        },
        {
            Niamey: [
                {
                    Niamey: []
                }
            ]
        },
        {
            Gazaoua: [
                {
                    Gazaoua: []
                }
            ]
        },
        {
            ATVL: [
                {
                    ATVL: []
                }
            ]
        },
        {
            KamInd33kV: [
                {
                    KamInd33kV: []
                }
            ]
        },
        {
            Inner_Galaxy2: [
                {
                    Inner_Galaxy2: []
                }
            ]
        },
        {
            "ikejaWest-sakate": [
                {
                    "ikejaWest-sakate": []
                }
            ]
        }
    ];

    // map the data from the database into the station_array (this is an expensive operation)
    station_array.forEach(station => {
        let equipment_array;
        // Filter the station data for all the equipment
        const station_data = data.filter( sdat => sdat.station === Object.keys(station)[0] );
        //// IF THE NAME OF THE STATION IS kamSteel-Ilorin, THEN CREATE TWO OBJECTS FOR THE EQUIPMENT

        // check if there is a station data there, then get the equipment array to filter and store the equipment values
        if (station_data && station_data.length > 0) {
            // Get the equipment array from station array object
            equipment_array = station[Object.keys(station)[0]];
            // iterate through the equipment array, use the equipment name to filter for the equipment values from station_data
            equipment_array.forEach( equipment => {                
                const equipment_data = station_data.filter( edat => edat.line_name === Object.keys(equipment)[0]);
                const resorted_array = Equipment_Sorter(equipment_data);
                equipment[Object.keys(equipment)[0]].push(...resorted_array);
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
    let hour = 0;
    const res_data = [];
    while( hour < 24 ) {
        const pres_hour = equipment_array.filter(equip => equip.hour === hour);        
        let max_voltage = 0, divisor = pres_hour.length;
        // Iterate over the filtered data to recaliberate
        if (pres_hour && pres_hour.length > 0) {
            const mw_sum = pres_hour.reduce((acc, curr) => {
                const sum = acc + curr.mw;
                max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                return sum;
            },0)
            const amp_sum = pres_hour.reduce((acc, curr) => {
                const sum = acc + curr.amp;
                return sum;
            },0)
            const mvar_sum = pres_hour.reduce((acc, curr) => {
                const sum = acc + curr.mvar;
                return sum;
            },0);
            // replace the mw, amp, mvar
            // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
            const date = pres_hour[0].date;
            const name = pres_hour[0].name;
            const pf = pres_hour[0].pf;
            const f = pres_hour[0].f;
            const line_name = pres_hour[0].line_name;
            const id = hour;
            const time = pres_hour[pres_hour.length - 1].time;
            const kv = max_voltage;
            // Get the average of the mw, amp and mvar
            const mw = mw_sum / divisor;
            const amp = amp_sum / divisor;
            const mvar = mvar_sum / divisor;
            res_data.push({
                date, name, line_name, pf, f, id, time, kv, mw, amp, mvar, hour //minute
            })
            // increment minute by 1 for the next iteration
            hour += 1;
            // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
            // to start the next hour iteration
            // if (minute === 60) {
            //     hour += 1;
            //     minute = 0;
            // }
        } else {
            // increment minute by 1 for the next iteration
            hour += 1;
            // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
            // to start the next hour iteration
            // if (minute === 60) {
            //     hour += 1;
            //     minute = 0;
            // }
        }
    }
    return res_data;
};
// FOR TRACING
// function Equipment_Sorter(equipment_array) {
//     let hour = 0, minute = 0;
//     const res_data = [];
//     while( hour < 24 ) {
//         const pres_min = equipment_array.filter(equip => equip.hour === hour && equip.minute === minute);        
//         let max_voltage = 0, divisor = pres_min.length;
//         // Iterate over the filtered data to recaliberate
//         if (pres_min && pres_min.length > 0) {
//             const mw_sum = pres_min.reduce((acc, curr) => {
//                 const sum = acc + curr.mw;
//                 max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
//                 return sum;
//             },0)
//             const amp_sum = pres_min.reduce((acc, curr) => {
//                 const sum = acc + curr.amp;
//                 return sum;
//             },0)
//             const mvar_sum = pres_min.reduce((acc, curr) => {
//                 const sum = acc + curr.mvar;
//                 return sum;
//             },0);
//             // replace the mw, amp, mvar
//             // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
//             const date = pres_min[0].date;
//             const equipment_id = pres_min[0].equipment_id;
//             const station = pres_min[0].station;
//             const level = pres_min[0].level;
//             const line_name = pres_min[0].line_name;
//             const id = hour;
//             const variant = pres_min[0].variant;
//             const time = pres_min[pres_min.length - 1].time;
//             const kv = max_voltage;
//             // Get the average of the mw, amp and mvar
//             const mw = mw_sum / divisor;
//             const amp = amp_sum / divisor;
//             const mvar = mvar_sum / divisor;
//             res_data.push({
//                 date, equipment_id, station, level, line_name, id, variant, time, kv, mw, amp, mvar, hour, minute
//             })
//             // increment minute by 1 for the next iteration
//             minute += 1;
//             // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
//             // to start the next hour iteration
//             if (minute === 60) {
//                 hour += 1;
//                 minute = 0;
//             }
//         } else {
//             // increment minute by 1 for the next iteration
//             minute += 1;
//             // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
//             // to start the next hour iteration
//             if (minute === 60) {
//                 hour += 1;
//                 minute = 0;
//             }
//         }
//     }
//     return res_data;
// };

function Station_Adder(station_array) {
    const res_data = [
        'PHEONIX STEEL IKORODU', 'PULKIT ALLOY & STEEL IKORODU', 'SUNFLAG IRON & STEEL IKORODU', 'First Maximum Point Industries Akure',
        'Obafemi Awolowo University Ile-Ife', 'ZEBERCED', 'NIAMEY', 'INNER GALAXY 1', 'INNER GALAXY 2', 'PRISM', 'ATVL','GAZAOUA', 'KAM',
        'Quantum', 'kam Steel Shagamu', 'Kam Steel Integrated Ilorin', 'ER-KANG Limited', 'Ikeja West - Sakete 330kV Line 1',
    ];
    const final_array = [];
    // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
    res_data.forEach(station_name => {
        if (station_name) {
            if (station_name === 'PHEONIX STEEL IKORODU') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'phoenix');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['pt1'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'PHEONIX STEEL IKORODU'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    });
                }
                if (temp_hold.length > 0) {
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'PULKIT ALLOY & STEEL IKORODU') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'pulkitSteel');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['psl1'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'PULKIT ALLOY & STEEL IKORODU'})
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'SUNFLAG IRON & STEEL IKORODU') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sunflag');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sl1'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'SUNFLAG IRON & STEEL IKORODU'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    // Disable temporary the use of MW directly from assets
                                    // temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    // Create a calculation for MW based on V*A*root3 / 1000
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'First Maximum Point Industries Akure') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'First Maximum Point Industries Akure');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['First Maximum Point Industries Akure'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'First Maximum Point Industries Akure'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'Obafemi Awolowo University Ile-Ife') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'Obafemi Awolowo University Ile-Ife');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['Obafemi Awolowo University Ile-Ife'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'Obafemi Awolowo University Ile-Ife'})
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'ZEBERCED') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'zeberced');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['zeberced'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'ZEBERCED'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'NIAMEY') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'Niamey');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['Niamey'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'NIAMEY'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'INNER GALAXY 1') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'Inner_Galaxy1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['Inner_Galaxy1'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'INNER GALAXY 1'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }            
                if (temp_hold.length > 0) {
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'INNER GALAXY 2') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'Inner_Galaxy2');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['Inner_Galaxy2'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'INNER GALAXY 2'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'PRISM') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'PSML');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['PSML'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'PRISM'})
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'ATVL') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ATVL');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ATVL'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'ATVL'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'GAZAOUA') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'Gazaoua');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['Gazaoua'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) { 
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: e.mw, mvar: e.mvar, amp: e.amp, station: 'GAZAOUA'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += e.mw;
                                    temp_hold[chosen_index].amp += e.amp;
                                    temp_hold[chosen_index].mvar += e.mvar;
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }                
            }
            if (station_name === 'KAM') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'KamInd33kV');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['KamInd33kV'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'KAM'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }                
            }
            if (station_name === 'Quantum') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'quantum');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['qt1'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'Quantum'})
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }                
            }
            if (station_name === 'kam Steel Shagamu') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'kamSteel');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['kamSteel'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'kam Steel Shagamu'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }             
                if (temp_hold.length > 0) {
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'Kam Steel Integrated Ilorin') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'kamSteel-Ilorin');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0].filter( sa => Object.keys(sa)[0] === 'l1' || Object.keys(sa)[0] === 'l2');
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'Kam Steel Integrated Ilorin'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }               
                if (temp_hold.length > 0) {
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
            if (station_name === 'Ikeja West - Sakete 330kV Line 1') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'Ikeja West - Sakete 330kV Line 1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['Ikeja West - Sakete 330kV Line 1'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'Ikeja West - Sakete 330kV Line 1'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add.length > 0 && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj)
                }
            }
        }
    });
    // console.log(JSON.stringify(final_array), 'the final array');
    return final_array;
};
