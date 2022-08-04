module.exports = ( data ) => {

    const station_array = [
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
                const resorted_array = Equipment_Sorter(equipment_data);
                equipment[Object.keys(equipment)[0]].push(...resorted_array);
            })
        } else {
            return null;
        }        
    });
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

function Station_Adder(station_array) {
    const res_data = [
        'AFAM VI (GAS|STEAM)', 'ALAOJI NIPP (GAS)', 'SAPELE NIPP (GAS)', 'SAPELE (STEAM)', 'ODUKPANI NIPP (GAS)', 'JEBBA (HYDRO)',
         'RIVERS IPP (GAS)', 'OMOKU (GAS)', 'IHOVBOR NIPP (GAS)', 'OLORUNSOGO NIPP', 'DELTA (GAS)', 'OMOTOSHO (GAS)',
         'PARAS ENERGY (GAS)', 'OMOTOSHO NIPP (GAS)', 'GEREGU NIPP (GAS)', 'AZURA-EDO IPP (GAS)', 'TRANS-AMADI (GAS)', 
         'IBOM POWER (GAS)', 'OLORUNSOGO (GAS)', 'GBARAIN NIPP (GAS)', 'GEREGU (GAS)', 'DADINKOWA G.S (HYDRO)', 'OKPAI (GAS|STEAM)'
    ];
    const final_array = [];
    // replace the mw, amp, mvar
    // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
    res_data.forEach(station_name => {
        if (station_name) {
            if (station_name === 'JEBBA (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'jebbaTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['jebbaTs'];                
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'JEBBA (HYDRO)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'DELTA (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }
                if (equipment_to_sum_1.length > 0) {
                    equipment_to_sum_1.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'DELTA (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                               // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }  
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum_2.length > 0) {
                    equipment_to_sum_2.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'DELTA (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                               // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'OKPAI (GAS|STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'okpaiGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['okpaiGs'];                
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OKPAI (GAS|STEAM)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'DADINKOWA G.S (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'dadinKowaGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['dadinKowaGs'];                
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'DADINKOWA G.S (HYDRO)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'AFAM VI (GAS|STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'afamViTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['afamViTs'];                
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'AFAM VI (GAS|STEAM)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'ALAOJI NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'alaoji');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['alaoji'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'ALAOJI NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'SAPELE NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sapeleNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sapeleNippPs'].filter( sa => Object.keys(sa)[0] === 'gt1' || Object.keys(sa)[0] === 'gt2' || Object.keys(sa)[0] === 'gt3' || Object.keys(sa)[0] === 'gt4');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'SAPELE NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'SAPELE (STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sapeleNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sapeleNippPs'].filter( sa => Object.keys(sa)[0] === 'st1' || Object.keys(sa)[0] === 'st3');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'SAPELE (STEAM)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'ODUKPANI NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'odukpaniGs');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'ikotEkpene');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['odukpaniGs'];
                const equipment_to_sum_2 = station_to_add_2[0]['ikotEkpene'].filter( sa => Object.keys(sa)[0] === 'd1k' || Object.keys(sa)[0] === 'd2k');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'ODUKPANI NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum_2.length > 0) {
                    equipment_to_sum_2.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'ODUKPANI NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                               // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'OMOTOSHO (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omotosho1');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'omotosho2');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omotosho1'];
                const equipment_to_sum_2 = station_to_add_2[0]['omotosho2'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OMOTOSHO (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }               
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum_2.length > 0) {
                    equipment_to_sum_2.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OMOTOSHO (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            // if (station_name  === 'DELTA 3 (GAS)') {
            //     const temp_hold = [];
            //     const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'delta3');
            //     // Get the list of equipment objects from the stations
            //     // remember to filter equipment in the cases where not all is required
            //     const equipment_to_sum = station_to_add[0]['delta3'];
            //     // run logic only if there is an equipment to iterate
            //     if (equipment_to_sum.length > 0) {
            //         equipment_to_sum.forEach((equip, index) => {
            //             // Insert all the first items into the temp hold container, 
            //             // Then on the next iteration start adding to it
            //             if(index == 0 && temp_hold.length == 0) {
            //                 // Get the key of the first item
            //                 const key = Object.keys(equip)[0];
            //                 // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
            //                 // for the station for this day, any time not here will not be accepted
            //                 equip[key].forEach( (e) => {
            //                     temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'DELTA 3 (GAS)'})                                
            //                 })
            //             } else {
            //                 // Get the key for the next elements
            //                 const key = Object.keys(equip)[0];
            //                 let chosen_index;
            //                 equip[key].forEach( (e) => {
            //                     // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
            //                     // and minute inside the temphold array
            //                     const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
            //                         const check = e.hour === th.hour && e.minute === th.minute;
            //                         if (check) {
            //                             chosen_index = ind;
            //                         }
            //                         return check;
            //                     });
            //                     // if there is a temp hold item to add, then add this items to the temp hold
            //                     if(temp_hold_item_to_add && temp_hold[chosen_index]) {
            //                         temp_hold[chosen_index].mw += Math.abs(e.mw);
            //                         temp_hold[chosen_index].amp += Math.abs(e.amp);
            //                         temp_hold[chosen_index].mvar += Math.abs(e.mvar);
            //                         temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
            //                     }
            //                 })
            //             }
            //         })
            //         const obj = {};
            //         obj[station_name] = temp_hold;
            //         final_array.push(obj)
            //     }
            // }
            if (station_name === 'RIVERS IPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'riversIppPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['riversIppPs'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'RIVERS IPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'OMOKU (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omokuPs1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omokuPs1'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OMOKU (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'IHOVBOR NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ihovborNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ihovborNippPs'].filter( sa => Object.keys(sa)[0] === 'gt1' || Object.keys(sa)[0] === 'gt2' || Object.keys(sa)[0] === 'gt3' || Object.keys(sa)[0] === 'gt4');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'IHOVBOR NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'AZURA-EDO IPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ihovborNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ihovborNippPs'].filter( sa => Object.keys(sa)[0] === 'ohl1' || Object.keys(sa)[0] === 'ohl2');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: -(e.mw), mvar: -(e.mvar), amp: -(e.amp), station: 'AZURA-EDO IPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += -(e.mw);
                                    temp_hold[chosen_index].amp += -(e.amp);
                                    temp_hold[chosen_index].mvar += -(e.mvar);
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
            if (station_name === 'OLORUNSOGO NIPP') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogoPhase1Gs');
                const station_to_subtract = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogo1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'r1w' || Object.keys(sa)[0] === 'r2a');
                const equipment_to_subtract = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'tr3' || Object.keys(sa)[0] === 'tr4');
                const equipment_to_subtract_2 = station_to_subtract[0]['olorunsogo1'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    console.log('sum 1');
                    equipment_to_sum.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OLORUNSOGO NIPP'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }                
                // run logic only if there is an equipment to iterate
                if (equipment_to_subtract.length > 0) {
                    console.log('subtract 1');
                    equipment_to_subtract.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                console.log(e, 'the check');
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OLORUNSOGO NIPP'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw -= Math.abs(e.mw);
                                    temp_hold[chosen_index].amp -= Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar -= Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }                
                // run logic only if there is an equipment to iterate
                if (equipment_to_subtract_2.length > 0) {
                    console.log('subtract 2');
                    equipment_to_subtract_2.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                console.log(e, 'the check 2');
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OLORUNSOGO NIPP'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw -= Math.abs(e.mw);
                                    temp_hold[chosen_index].amp -= Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar -= Math.abs(e.mvar);
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
            if (station_name === 'OLORUNSOGO (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogoPhase1Gs');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogo1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'tr3' || Object.keys(sa)[0] === 'tr4');
                const equipment_to_sum_2 = station_to_add_2[0]['olorunsogo1'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OLORUNSOGO (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += Math.abs(e.mw);
                                    temp_hold[chosen_index].amp += Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar += Math.abs(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum_2.length > 0) {
                    equipment_to_sum_2.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OLORUNSOGO (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            // if (station_name === 'DELTA 2 (GAS)') {
            //     const temp_hold = [];
            //     const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'delta2');
            //     // Get the list of equipment objects from the stations
            //     // remember to filter equipment in the cases where not all is required
            //     const equipment_to_sum = station_to_add[0]['delta2'];
            //     // run logic only if there is an equipment to iterate
            //     if (equipment_to_sum.length > 0) {
            //         equipment_to_sum.forEach((equip, index) => {
            //             // Insert all the first items into the temp hold container, 
            //             // Then on the next iteration start adding to it
            //             if(index == 0 && temp_hold.length == 0) {
            //                 // Get the key of the first item
            //                 const key = Object.keys(equip)[0];
            //                 // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
            //                 // for the station for this day, any time not here will not be accepted
            //                 equip[key].forEach( (e) => {
            //                     temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'DELTA 2 (GAS)'})                                
            //                 })
            //             } else {
            //                 // Get the key for the next elements
            //                 const key = Object.keys(equip)[0];
            //                 let chosen_index;
            //                 equip[key].forEach( (e) => {
            //                     // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
            //                     // and minute inside the temphold array
            //                     const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
            //                         const check = e.hour === th.hour && e.minute === th.minute;
            //                         if (check) {
            //                             chosen_index = ind;
            //                         }
            //                         return check;
            //                     });
            //                     // if there is a temp hold item to add, then add this items to the temp hold
            //                     if(temp_hold_item_to_add && temp_hold[chosen_index]) {
            //                         temp_hold[chosen_index].mw += Math.abs(e.mw);
            //                         temp_hold[chosen_index].amp += Math.abs(e.amp);
            //                         temp_hold[chosen_index].mvar += Math.abs(e.mvar);
            //                         temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
            //                     }
            //                 })
            //             }
            //         })
            //         const obj = {};
            //         obj[station_name] = temp_hold;
            //         final_array.push(obj)
            //     }
            // }           
            if (station_name === 'PARAS ENERGY (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'parasEnergyPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['parasEnergyPs'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'PARAS ENERGY (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add  && temp_hold[chosen_index]) {
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
            if (station_name === 'OMOTOSHO NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omotoshoNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omotoshoNippPs'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'OMOTOSHO NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add  && temp_hold[chosen_index]) {
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
            if (station_name === 'GEREGU NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gereguPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'r1j' || Object.keys(sa)[0] === 'r2j');
                const equipment_to_subtract = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'gt11' || Object.keys(sa)[0] === 'gt12' || Object.keys(sa)[0] === 'gt13');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: -(e.mw), mvar: -(e.mvar), amp: -(e.amp), station: 'GEREGU NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add  && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw = temp_hold[chosen_index].mw + -(e.mw);
                                    temp_hold[chosen_index].amp = temp_hold[chosen_index].amp + -(e.amp);
                                    temp_hold[chosen_index].mvar = temp_hold[chosen_index].mvar + -(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }                
                // run logic only if there is an equipment to iterate
                if (equipment_to_subtract.length > 0) {
                    equipment_to_subtract.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'GEREGU NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add  && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw = temp_hold[chosen_index].mw - Math.abs(e.mw);
                                    temp_hold[chosen_index].amp = temp_hold[chosen_index].amp - Math.abs(e.amp);
                                    temp_hold[chosen_index].mvar = temp_hold[chosen_index].mvar - Math.abs(e.mvar);
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
            if (station_name === 'GEREGU (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gereguPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'gt11' || Object.keys(sa)[0] === 'gt12' || Object.keys(sa)[0] === 'gt13');
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'GEREGU (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'TRANS-AMADI (GAS)') {
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
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'TRANS-AMADI (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
            if (station_name === 'IBOM POWER (GAS)') {
                const temp_hold = [];
                const station_to_subtract = station_array.filter( sa => Object.keys(sa)[0] === 'ekim');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'eket');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_subtract = station_to_subtract[0]['ekim'];
                const equipment_to_sum = station_to_add_2[0]['eket'];
                // run logic only if there is an equipment to iterate
                if (equipment_to_subtract.length > 0) {
                    equipment_to_subtract.forEach((equip, index) => {
                        // Insert all the first items into the temp hold container, 
                        // Then on the next iteration start adding to it
                        if(index == 0 && temp_hold.length == 0) {
                            // Get the key of the first item
                            const key = Object.keys(equip)[0];
                            // Iterate over the equipment for insertion into the temphold, this serves as the maximum amount of item that will be used
                            // for the station for this day, any time not here will not be accepted
                            equip[key].forEach( (e) => {
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: -(e.mw), mvar: -(e.mvar), amp: -(e.amp), station: 'IBOM POWER (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += -(e.mw);
                                    temp_hold[chosen_index].amp += -(e.amp);
                                    temp_hold[chosen_index].mvar += -(e.mvar);
                                    temp_hold[chosen_index].kv = temp_hold[chosen_index].kv > e.kv ? temp_hold[chosen_index].kv : e.kv;
                                }
                            })
                        }
                    })
                }                
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: -(e.mw), mvar: -(e.mvar), amp: -(e.amp), station: 'IBOM POWER (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
                                    temp_hold[chosen_index].mw += -(e.mw);
                                    temp_hold[chosen_index].amp += -(e.amp);
                                    temp_hold[chosen_index].mvar += -(e.mvar);
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
            if (station_name === 'GBARAIN NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gbarain');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gbarain'];
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
                                temp_hold.push({date: e.date, hour: e.hour, minute: e.minute, kv: e.kv, mw: Math.abs(e.mw), mvar: Math.abs(e.mvar), amp: Math.abs(e.amp), station: 'GBARAIN NIPP (GAS)'})                                
                            })
                        } else {
                            // Get the key for the next elements
                            const key = Object.keys(equip)[0];
                            let chosen_index;
                            equip[key].forEach( (e) => {
                                // Get the hour and minute for each of this equipment item, this would be used to filter for a matching hour
                                // and minute inside the temphold array
                                const temp_hold_item_to_add = temp_hold.filter( (th, ind) => {
                                    const check = e.hour === th.hour && e.minute === th.minute;
                                    if (check) {
                                        chosen_index = ind;
                                    }
                                    return check;
                                });
                                // if there is a temp hold item to add, then add this items to the temp hold
                                if(temp_hold_item_to_add && temp_hold[chosen_index]) {
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
