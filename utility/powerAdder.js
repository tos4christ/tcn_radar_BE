module.exports = function addPower( data ) {
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
    // console.log(JSON.stringify(data), 'the data from the database');
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
        // if (Object.keys(station)[0] === 'olorunsogo1') {
        //     console.log(station_data, ' olorunsogo station data');
        // }
    });
    return Station_Adder(station_array);
};

// Done
function addSimilarEquipment(array_in, station_name) {
    const array = array_in.concat();
    station_name = station_name;
    const finalArray = [];
    // get the key for the first item
    const key = Object.keys(array[0]);
    // check to see it is an array of array
    if(array[0][key[0]].length > 0) {
        finalArray.push(...array[0][key[0]][0]);
        // This checks if there is only one object in the add
        // In this case just return the only array available
        // or an empty array if nothing exists
        if (array.length < 2) {
            finalArray.forEach( (item, index) => {
                if (station_name) {
                    finalArray[index].station = station_name;
                    delete finalArray[index].line_name;
                }                
            });
            return finalArray;
        }
        for (let i=1; i < array.length; i++) {
            const key = Object.keys(array[i]);
            const current_array = array[i][key[0]][0];
            if (current_array && current_array.length > 0) {
                current_array.forEach( (item, index) => {
                    // if (station_name === 'OLORUNSOGO (GAS)') {
                    //     console.log(finalArray[index], index, 'the error from olorunsogo gas')
                    // }
                    finalArray[index].mw += item.mw;
                    if (station_name) {
                        finalArray[index].station = station_name;
                        delete finalArray[index].line_name;
                    }                
                });
            }            
        }
    }
    return finalArray;
}

// Done
function subtractSimilarEquipment_array_noabs(add_array_in, subtract_array_in, station_name) {
    const add_array = add_array_in.concat();
    const subtract_array = subtract_array_in.concat();
    station_name = station_name;
    if (add_array.length === 0 || subtract_array.length === 0) {
        return [];
    }    
    // Ensure array1 is the array from the add similar function
    const finalArray = [];
    finalArray.push(...add_array);  
    subtract_array.forEach( (item, index) => {
        // First filter the item with the closest time to this
        // add the filtered item    
        finalArray[index].mw = finalArray[index].mw - item.mw;
        finalArray[index].kv = finalArray[index].kv > item.kv ? finalArray[index].kv : item.kv;
        if (station_name) {
            finalArray[index].station = station_name;
            delete finalArray[index].line_name;
        }  
    });
    return finalArray;
}

// Done
function subtractEquipment_zero(subtract_array_in, station_name) {
    station_name = station_name;
    const subtract_array = subtract_array_in.concat();
    if (subtract_array.length === 0) {
        return [];
    }
    // Ensure array1 is the array from the add similar function
    const finalArray = []; 
    subtract_array.forEach( (item) => {
        // subtract the megawatt from zero to get the complete equation of the series
        item.mw = 0 - item.mw
        if (station_name) {
            item.station = station_name;
            delete item.line_name;
        }  
        finalArray.push(item);
    });
    return finalArray;
}

// Done
function addDissimilarEquipment_raw(array1_in, array2_in, station_name) {
    station_name = station_name;
    let array1 = array1_in.concat();
    let array2 = array2_in.concat();
    if (array1.length === 0 || array2.length === 0) {
        return [];
    }
    // The logic here is to use addSimilar function to add array1 and array2 separately
    // After that you add the single arrays from the results comparing the time
    array1 = addSimilarEquipment(array1);
    array2 = addSimilarEquipment(array2);
    // if the array1 is empty return the similar addition of the second array
    if (array1.length === 0) {
        return [];
    } else if (array2.length === 0) {
        return [];
    };
    // Ensure array1 is the array from the add similar function
    const finalArray = [];
    // finalArray.push(...array1);
    let last_item_time = 1;    
    array2.forEach( (item) => {
        // First filter the item with the closest time to this
        // This is an N^2 operation
        const chosen_item = array1.filter( (f_arr) => {
            const item_time_diff = Math.abs(f_arr.time - item.time);            
            // If the time difference is less than 4000 and the time is not the same as the last_item_time that was
            // saved from a previous operation then chose the item and set it as the previous
            if (item_time_diff <= 3000 && f_arr.time !== last_item_time) {
                last_item_time = f_arr.time;
                return true;
            }
        });
        // add the filtered item 
        if (chosen_item.length > 0) {
            item.mw = Math.abs(chosen_item[0].mw) + Math.abs(item.mw);
            item.kv = item.kv < chosen_item[0].kv ? chosen_item[0].kv : item.kv;
            if (station_name) {
                item.station = station_name;
                delete item.line_name;
            }
            // Push the edited item
            finalArray.push(item);
        }        
    });
    return finalArray;
}

// Done
function addDissimilarEquipment_raw_noabs(array1_in, array2_in) {
    let array1 = array1_in.concat();
    let array2 = array2_in.concat();
    if (array1.length === 0 || array2.length === 0) {
        return [];
    }
    // The logic here is to use addSimilar function to add array1 and array2 separately
    // After that you add the single arrays from the results comparing the time
    array1 = addSimilarEquipment(array1);
    array2 = addSimilarEquipment(array2);
    // if the array1 is empty return the similar addition of the second array
    if (array1.length === 0) {
        return [];
    } else if (array2.length === 0) {
        return [];
    };
    // Ensure array1 is the array from the add similar function
    const finalArray = [];
    // finalArray.push(...array1);
    let last_item_time = 1;
    array2.forEach( (item) => {
        // First filter the item with the closest time to this
        // This is an N^2 operation
        const chosen_item = array1.filter( (f_arr) => {
            const item_time_diff = Math.abs(f_arr.time - item.time);            
            // If the time difference is less than 4000 and the time is not the same as the last_item_time that was
            // saved from a previous operation then chose the item and set it as the previous
            if (item_time_diff <= 3000 && f_arr.time !== last_item_time) {
                last_item_time = f_arr.time;
                return true;
            }
        });
        // add the filtered item 
        if (chosen_item.length > 0) {
            item.mw = chosen_item[0].mw + item.mw;
            item.kv = chosen_item[0].kv > item.kv ? chosen_item[0].kv : item.kv;
            finalArray.push(item);
        }        
    });  
    return finalArray;
}

// Done
function addDissimilarEquipment_array(array1_in, array2_in, station_name) {
    const array1 = array1_in.concat();
    const array2 = array2_in.concat();
    station_name = station_name;
    if (array1.length === 0 || array2.length === 0) {
        return [];
    };
    // Ensure array1 is the array from the add similar function
    const finalArray = [];
    // finalArray.push(...array1);
    let last_item_time = 1;    
    array2.forEach( (item) => {
        // First filter the item with the closest time to this
        // This is an N^2 operation
        const chosen_item = array1.filter( (f_arr) => {
            const item_time_diff = Math.abs(f_arr.time - item.time);            
            // If the time difference is less than 4000 and the time is not the same as the last_item_time that was
            // saved from a previous operation then chose the item and set it as the previous
            if (item_time_diff <= 3000 && f_arr.time !== last_item_time) {
                last_item_time = f_arr.time;
                return true;
            }
        });
        // add the filtered item
        if (chosen_item.length > 0) {
            item.mw = Math.abs(chosen_item[0].mw) + Math.abs(item.mw);
            item.kv = chosen_item[0].kv > item.kv ? chosen_item[0].kv : item.kv;
            if (station_name) {
                item.station = station_name;
                delete item.line_name;
            }
            // Push the edited item
            finalArray.push(item);
        }        
    });
    return finalArray;
}

function Station_Adder(station_array_in) {
    const station_array = new Array(station_array_in);
    const station_array_2 = new Array(station_array_in);
    const res_data = [
        'AFAM VI (GAS|STEAM)', 'ALAOJI NIPP (GAS)', 'SAPELE NIPP (GAS)', 'SAPELE (STEAM)', 'ODUKPANI NIPP (GAS)', 'JEBBA (HYDRO)',
         'RIVERS IPP (GAS)', 'OMOKU (GAS)', 'IHOVBOR NIPP (GAS)', 'DELTA (GAS)', 'OMOTOSHO (GAS)', 'KAINJI (HYDRO)',
         'PARAS ENERGY (GAS)', 'OMOTOSHO NIPP (GAS)', 'OLORUNSOGO NIPP', 'GEREGU NIPP (GAS)', 'AZURA-EDO IPP (GAS)', 'TRANS-AMADI (GAS)', 'EGBIN (STEAM)',
         'IBOM POWER (GAS)', 'GBARAIN NIPP (GAS)', 'GEREGU (GAS)', 'DADINKOWA G.S (HYDRO)', 'OKPAI (GAS|STEAM)',
         'AFAM IV & V (GAS)', 'SHIRORO (HYDRO)'
    ];
    const res_data_2 = ['OLORUNSOGO (GAS)'];
    const final_array = [];
    // replace the mw, amp, mvar
    // (id, date, hour, minute, kv, mw, mvar, amp, equipment_id, station, level, line_name, variant, time)
    res_data_2.forEach( station_name => {
        if (station_name === 'OLORUNSOGO (GAS)') {
            const temp_hold = [];
            const station_to_add_2 = station_array_2.filter( fa => Object.keys(fa)[0] === 'olorunsogo1');
            const station_to_add = station_array_2.filter( sa => Object.keys(sa)[0] === 'olorunsogoPhase1Gs'); 
            // Get the list of equipment objects from the stations
            // remember to filter equipment in the cases where not all is required
            const equipment_to_sum = station_to_add[0]['olorunsogoPhase1Gs'].filter( ta => Object.keys(ta)[0] === 'tr3' || Object.keys(ta)[0] === 'tr4').concat();
            const equipment_to_sum_2 = station_to_add_2[0]['olorunsogo1'].filter( tp => Object.keys(tp)[0] === 'tr1' || Object.keys(tp)[0] === 'tr2').concat();

            
            // console.log(JSON.stringify(station_to_add_2), 'olorunsogo gas station to sum 2');
            const second_sum = addSimilarEquipment(equipment_to_sum_2.concat());
            const first_sum = addSimilarEquipment(equipment_to_sum.concat());
            // console.log(JSON.stringify(second_sum), 'olorunsogo1 gas second sum');
            // console.log(JSON.stringify(first_sum), 'olorunsogo2 gas first sum');
            try {
                temp_hold.push(...addDissimilarEquipment_array(first_sum, second_sum, station_name));
            } catch(e) {
                console.log(e)
            }
            console.log(JSON.stringify(temp_hold), 'olorunsogo1 gas temphold');
            final_array.push(...temp_hold);
        }
    })
    res_data.forEach(station_name => {
        // Before adding two equipments that have been summed with the similarsum function
        // Check to see if the array is not empty before proceeding
        if (station_name) {
            if (station_name === 'AFAM IV & V (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'afamIv_vPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['afamIv_vPs'];                
                // run logic only if there is an equipment to iterate
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'SHIRORO (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'shiroroPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['shiroroPs'];              
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'EGBIN (STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'egbinPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['egbinPs'];                
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'KAINJI (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'kainjiTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['kainjiTs'];                
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'JEBBA (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'jebbaTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['jebbaTs'];                
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'OKPAI (GAS|STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'okpaiGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['okpaiGs'];                
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'DADINKOWA G.S (HYDRO)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'dadinKowaGs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['dadinKowaGs'];                
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'AFAM VI (GAS|STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'afamViTs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['afamViTs'];                
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'ALAOJI NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'alaoji');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['alaoji'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'SAPELE NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sapeleNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sapeleNippPs'].filter( sa => Object.keys(sa)[0] === 'gt1' || Object.keys(sa)[0] === 'gt2' || Object.keys(sa)[0] === 'gt3' || Object.keys(sa)[0] === 'gt4');
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'SAPELE (STEAM)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'sapeleNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['sapeleNippPs'].filter( sa => Object.keys(sa)[0] === 'st1' || Object.keys(sa)[0] === 'st3');
                // console.log(equipment_to_sum, 'equipment for sapaele steam')
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }            
            if (station_name === 'RIVERS IPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'riversIppPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['riversIppPs'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'OMOKU (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omokuPs1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omokuPs1'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }            
            if (station_name === 'IHOVBOR NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ihovborNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ihovborNippPs'].filter( sa => Object.keys(sa)[0] === 'gt1' || Object.keys(sa)[0] === 'gt2' || Object.keys(sa)[0] === 'gt3' || Object.keys(sa)[0] === 'gt4');
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'AZURA-EDO IPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'ihovborNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['ihovborNippPs'].filter( sa => Object.keys(sa)[0] === 'ohl1' || Object.keys(sa)[0] === 'ohl2');
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }            
            if (station_name === 'PARAS ENERGY (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'parasEnergyPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['parasEnergyPs'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'OMOTOSHO NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omotoshoNippPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omotoshoNippPs'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }            
            if (station_name === 'GEREGU (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gereguPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'gt11' || Object.keys(sa)[0] === 'gt12' || Object.keys(sa)[0] === 'gt13');
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'TRANS-AMADI (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'phMain');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['phMain'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }            
            if (station_name === 'GBARAIN NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gbarain');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gbarain'];
                if (equipment_to_sum.length > 0) {
                    temp_hold.push(...addSimilarEquipment(equipment_to_sum, station_name));
                }
                final_array.push(...temp_hold);
            }
           
            // Complicated ones
            // Add Dissimilar equipment for 2 equipment
            if (station_name === 'ODUKPANI NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'odukpaniGs');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'ikotEkpene');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['odukpaniGs'];
                const equipment_to_sum_2 = station_to_add_2[0]['ikotEkpene'].filter( sa => Object.keys(sa)[0] === 'd1k' || Object.keys(sa)[0] === 'd2k');
                try {
                    temp_hold.push(...addDissimilarEquipment_raw(equipment_to_sum, equipment_to_sum_2, station_name));
                } catch(e) {
                    console.log(e)
                }
                final_array.push(...temp_hold);
            }
            if (station_name === 'OMOTOSHO (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'omotosho1');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'omotosho2');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['omotosho1'];
                const equipment_to_sum_2 = station_to_add_2[0]['omotosho2'];
                try {
                    temp_hold.push(...addDissimilarEquipment_raw(equipment_to_sum, equipment_to_sum_2, station_name));
                } catch(e) {
                    console.log(e)
                }
                final_array.push(...temp_hold);
            }
            // Add dismilar equipment for 3 equipment arrays
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
                const first_sum = addDissimilarEquipment_raw(equipment_to_sum, equipment_to_sum_1);
                const second_sum = addSimilarEquipment(equipment_to_sum_2);                
                try {
                    temp_hold.push(...addDissimilarEquipment_array(first_sum, second_sum, station_name));
                } catch(e) {
                    console.log(e);
                }
                final_array.push(...temp_hold);
            }
            // Subtract similar equipment
            // 0 minus addition of all
            if (station_name === 'GEREGU NIPP (GAS)') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'gereguPs');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'r1j' || Object.keys(sa)[0] === 'r2j');
                const equipment_to_subtract = station_to_add[0]['gereguPs'].filter( sa => Object.keys(sa)[0] === 'gt11' || Object.keys(sa)[0] === 'gt12' || Object.keys(sa)[0] === 'gt13');
                // get the final sum function
                const final_sum = addSimilarEquipment([...equipment_to_sum, ...equipment_to_subtract])
                try {
                    temp_hold.push(...subtractEquipment_zero(final_sum, station_name));
                } catch(e) {
                    console.log(e)
                }
                final_array.push(...temp_hold);
            }
            // Subtract similar equipment
            // 0 minus addition of all
            if (station_name === 'IBOM POWER (GAS)') {
                const temp_hold = [];
                const station_to_subtract = station_array.filter( sa => Object.keys(sa)[0] === 'ekim');
                const station_to_add_2 = station_array.filter( sa => Object.keys(sa)[0] === 'eket');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_subtract = station_to_subtract[0]['ekim'];
                const equipment_to_sum = station_to_add_2[0]['eket'];
                // Add equipment separately
                const first_sum = addSimilarEquipment(equipment_to_subtract);
                const second_sum = addSimilarEquipment(equipment_to_sum);
                const final_sum = addDissimilarEquipment_array(first_sum, second_sum);
                try {
                    temp_hold.push(...subtractEquipment_zero(final_sum, station_name));
                } catch(e) {
                    console.log(e)
                }
                final_array.push(...temp_hold);
            }
            // Disparate additions
            if (station_name === 'OLORUNSOGO NIPP') {
                const temp_hold = [];
                const station_to_add = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogoPhase1Gs');
                const station_to_subtract = station_array.filter( sa => Object.keys(sa)[0] === 'olorunsogo1');
                // Get the list of equipment objects from the stations
                // remember to filter equipment in the cases where not all is required
                const equipment_to_sum = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'r1w' || Object.keys(sa)[0] === 'r2a').concat();
                const equipment_to_subtract = station_to_add[0]['olorunsogoPhase1Gs'].filter( sa => Object.keys(sa)[0] === 'tr3' || Object.keys(sa)[0] === 'tr4').concat();
                const equipment_to_subtract_2 = station_to_subtract[0]['olorunsogo1'].concat();
                // Add the sub functions
                const adder = addSimilarEquipment(equipment_to_sum.concat());
                const subber = addDissimilarEquipment_raw_noabs(equipment_to_subtract.slice(), equipment_to_subtract_2.concat());
                try {
                    temp_hold.push(...subtractSimilarEquipment_array_noabs(adder, subber, station_name));
                } catch(e) {
                    console.log(e)
                }
                final_array.push(...temp_hold);
            }            
        }
    });
    // console.log(final_array, 'the final array')
    return final_array;
};
