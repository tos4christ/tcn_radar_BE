// const fs = require('fs');

module.exports = ( data ) => {
    const station_array = [
        {
            gwagwalada: [
                {
                    g5b: []
                },
                {
                    r3g: []
                }
            ] 
        },
        {
            asaba: [
                {
                    b3d: []
                },
                {
                    d3t: []
                }
            ] 
        },
        {
            ugwuaji: [
                {
                    u1a: []
                },
                {
                    u2a: []
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
                },
                {
                    m22p: []
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
            ikotEkpene: [
                {
                    a1k: []
                },
                {
                    a2k: []
                },
                {
                    d1k: []
                }, 
                {
                    d2k: []
                }, 
                {
                    k1u: []
                }, 
                {
                    k2u: []
                }, 
                {
                    k3u: []
                }, 
                {
                    k4u: []
                }
            ]
        },
        {
            lokojaTs: [
                {
                    j1l: []
                }, 
                {
                    j2l: []
                }, 
                {
                    l6g: []
                }, 
                {
                    l7g: []
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
        const pres_hr = equipment_array.filter(equip => equip.hour === hour);        
        let max_voltage = 0, divisor = pres_hr.length;
        // Iterate over the filtered data to recaliberate
        if (pres_hr && pres_hr.length > 0) {
            const mw_sum = pres_hr.reduce((acc, curr) => {
                const sum = acc + curr.mw;
                max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                return sum;
            },0)
            const amp_sum = pres_hr.reduce((acc, curr) => {
                const sum = acc + curr.amp;
                return sum;
            },0)
            const mvar_sum = pres_hr.reduce((acc, curr) => {
                const sum = acc + curr.mvar;
                return sum;
            },0);
            // replace the mw, amp, mvar
            // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
            const date = pres_hr[0].date;
            const equipment_id = pres_hr[0].equipment_id;
            const station = pres_hr[0].station;
            const level = pres_hr[0].level;
            const line_name = pres_hr[0].line_name;
            const id = hour;
            const variant = pres_hr[0].variant;
            const time = pres_hr[pres_hr.length - 1].time;
            const kv = max_voltage;
            // Get the average of the mw, amp and mvar
            const mw = mw_sum / divisor;
            const amp = amp_sum / divisor;
            const mvar = mvar_sum / divisor;
            res_data.push({
                date, equipment_id, station, level, line_name, id, variant, time, kv, mw, amp, mvar, hour, minute
            })
            // increment minute by 1 for the next iteration
            hour += 1;
            // once the 59th minute data is processed, increment the hour by 1 and set minute to zero
            // to start the next hour iteration
            // if (hour === 24) {
            //     hour += 1;
            //     minute = 0;
            // }
        } else {
            // increment hour by 1 for the next iteration
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

function Station_Adder(station_array) {
    const res_data = [
        'IKOT EKPENE TS', 'GWAGWALADA TS', 'LOKOJA TS', 'ASABA TS', 'UGWUAJI TS', 'EKIM TS',
         'PORTHARCOURT MAIN TS', 'EKET TS'
    ];
    const final_array = [];
    // replace the mw, amp, mvar
    // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
    res_data.forEach(station_name => {
        if (station_name) {
            if (station_name === 'IKOT EKPENE TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ikotEkpene');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ikotEkpene'].filter( sa => Object.keys(sa)[0] === 'a1k' || Object.keys(sa)[0] === 'a2k' || Object.keys(sa)[0] === 'd1k' || Object.keys(sa)[0] === 'd2k');
                const equipment_to_subtract = station_to_add[0]['ikotEkpene'].filter( sa => Object.keys(sa)[0] === 'k1u' || Object.keys(sa)[0] === 'k2u' || Object.keys(sa)[0] === 'k3u' || Object.keys(sa)[0] === 'k4u');
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'IKOT EKPENE TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index].mw = temp_hold[chosen_index].mw + Math.abs(e.mw);
                                    temp_hold[chosen_index].amp = temp_hold[chosen_index].amp + Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar = temp_hold[chosen_index].mvar + Math.abs(e.mvar);
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                }
                if (equipment_to_subtract.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'IKOT EKPENE TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index].mw = temp_hold[chosen_index].mw - Math.abs(e.mw);
                                    temp_hold[chosen_index].amp = temp_hold[chosen_index].amp - Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar = temp_hold[chosen_index].mvar - Math.abs(e.mvar);
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
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
            if (station_name === 'GWAGWALADA TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gwagwalada');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gwagwalada'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'GWAGWALADA TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj);
                }
            }
            if (station_name === 'LOKOJA TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'lokojaTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['lokojaTs'].filter( sa => Object.keys(sa)[0] === 'j1l' || Object.keys(sa)[0] === 'j2l');
                const equipment_to_subtract = station_to_add[0]['lokojaTs'].filter( sa => Object.keys(sa)[0] === 'l6g' || Object.keys(sa)[0] === 'l7g'); 
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'LOKOJA TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index].mw = temp_hold[chosen_index].mw + Math.abs(e.mw);
                                    temp_hold[chosen_index].amp = temp_hold[chosen_index].amp + Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar = temp_hold[chosen_index].mvar + Math.abs(e.mvar);
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                }
                if (equipment_to_subtract.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'LOKOJA TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index].mw = temp_hold[chosen_index].mw - Math.abs(e.mw);
                                    temp_hold[chosen_index].amp = temp_hold[chosen_index].amp - Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar = temp_hold[chosen_index].mvar - Math.abs(e.mvar);
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
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
            if (station_name === 'ASABA TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'asaba');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['asaba'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'ASABA TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj);
                }
            }
            if (station_name === 'UGWUAJI TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ugwuaji');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ugwuaji'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'UGWUAJI TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj);
                }
            }
            if (station_name === 'EKIM TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ekim');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ekim'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'EKIM TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj);
                }
            }
            if (station_name === 'PORTHARCOURT MAIN TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'phMain');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['phMain'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'PORTHARCOURT MAIN TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj);
                }
            }
            if (station_name === 'EKET TS') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'eket');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['eket'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            const temp_obj = {};                            
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {                                
                                temp_obj.date = e.date;
                                temp_obj.hour = e.hour;
                                temp_obj[e.line_name+'_kv'] = e.kv;
                                temp_obj.mw = Math.abs(e.mw);
                                temp_obj.mvar = Math.abs(e.mvar);
                                temp_obj.amp = Math.abs(e.amp);
                                temp_obj.station = 'EKET TS';
                                temp_hold.push(temp_obj);                                
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
                                    temp_hold[chosen_index][e.line_name+'_kv'] = e.kv;
                                }
                            })
                        }
                    })
                    const obj = {};
                    obj[station_name] = temp_hold;
                    final_array.push(obj);
                }
                // if (temp_hold.length > 0) {
                //     const obj = {};
                //     obj[station_name] = temp_hold;
                //     final_array.push(obj)
                // }
            }
        }
    });
    // console.log(JSON.stringify(final_array), 'the final array');
    return final_array;
};
