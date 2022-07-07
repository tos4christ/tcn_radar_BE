const station_keys1 = [
    'omotosho2', 'eket', 'phMain', 'afamViTs', 'alaoji', 'lokojaTs', 'sapeleNippPs', 'omotoshoNippPs',
    'odukpaniGs', 'omotosho1', 'delta3', 'ekim', 'gereguPs', 'ikotEkpene', 'riversIppPs', 'gwagwalada',
    'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'ugwuaji', 'asaba', 'parasEnergyPs', 'olorunsogoPhase1Gs'
]; 

module.exports = (data) => {
    let res_data = { 
        'EKET': {mw: null, kv: null, station: 'EKET'},
        'PORT-HARCOURT MAIN' : {mw: null, kv: null, station: 'PORT-HARCOURT MAIN'}, 
        'AFAM VI' : {mw: null, kv: null, station: 'AFAM VI'},
         'ALAOJI' : {mw: null, kv: null, station: 'ALAOJI'},
          'LOKOJA TS' : {mw: null, kv: null, station: 'LOKOJA TS'},
        'SAPELE NIPP' : {mw: null, kv: null, station: 'SAPELE NIPP'},
         'SAPELE STEAM' : {mw: null, kv: null, station: 'SAPELE STEAM'},
          'ODUKPANI GS' : {mw: null, kv: null, station: 'ODUKPANI GS'},
        'OMOTOSHO GAS' : {mw: null, kv: null, station: 'OMOTOSHO GAS'},
         'DELTA 3' : {mw: null, kv: null, station: 'DELTA 3'},
          'EKIM' : {mw: null, kv: null, station: 'EKIM'},
        'GEREGU GAS' : {mw: null, kv: null, station: 'GEREGU GAS'},
         'IKOT EKPENE' : {mw: null, kv: null, station: 'IKOT EKPENE'},
          'RIVERS IPP' : {mw: null, kv: null, station: 'RIVERS IPP'}, 
        'GWAGWALADA' : {mw: null, kv: null, station: 'GWAGWALADA'},
         'OMOKU GS' : {mw: null, kv: null, station: 'OMOKU GS'},
          'IHOVBOR NIPP' : {mw: null, kv: null, station: 'IHOVBOR NIPP'},
        'OLORUNSOGO NIPP' : {mw: null, kv: null, station: 'OLORUNSOGO NIPP'},
        'OLORUNSOGO GAS' : {mw: null, kv: null, station: 'OLORUNSOGO GAS'},
        'GBARAIN' : {mw: null, kv: null, station: 'GBARAIN'},
         'DELTA 2' : {mw: null, kv: null, station: 'DELTA 2'},
          'UGWUAJI' : {mw: null, kv: null, station: 'UGWUAJI'},
        'ASABA' : {mw: null, kv: null, station: 'ASABA'},
         'PARAS ENERGY': {mw: null, kv: null, station: 'PARAS ENERGY'},
          'OMOTOSHO NIPP' : {mw: null, kv: null, station: 'OMOTOSHO NIPP'},
        'GEREGU NIPP' : {mw: null, kv: null, station: 'GEREGU NIPP'},
         'AZURA' : {mw: null, kv: null, station: 'AZURA'},
          'TRANS AMADI' : {mw: null, kv: null, station: 'TRANS AMADI'},
        'IBOM POWER' : {mw: null, kv: null, station: 'IBOM POWER'},
        'DADIN KOWA GS' : {mw: null, kv: null, station: 'DADIN KOWA GS'}  
    };

    station_keys1.forEach(station => {
        // filter the station from the data
        const filtered_station = data.filter( dat => dat.station === station);
        if (filtered_station.length > 0) {
            if (filtered_station[0].station === 'dadinKowaGs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)                
                res_data['DADIN KOWA GS'].mw = mw_sum;
                res_data['DADIN KOWA GS'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gbarain') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)                
                res_data['GBARAIN'].mw = mw_sum;
                res_data['GBARAIN'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'olorunsogoPhase1Gs' || filtered_station[0].station === 'olorunsogo1') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['OLORUNSOGO GAS'].mw = res_data['OLORUNSOGO GAS'].mw + mw_sum;
                res_data['OLORUNSOGO GAS'].amp = res_data['OLORUNSOGO GAS'].amp + amp_sum;
                res_data['OLORUNSOGO GAS'].mvar = res_data['OLORUNSOGO GAS'].mvar + mvar_sum;
                res_data['OLORUNSOGO GAS'].kv = max_voltage;                
                res_data['OLORUNSOGO GAS'].time = time;
                res_data['OLORUNSOGO GAS'].seconds = seconds;
            }
            if (filtered_station[0].station === 'olorunsogo1' || filtered_station[0].station === 'olorunsogoPhase1Gs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'r1w' || curr.line_name === 'r2a') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc - Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'r1w' || curr.line_name === 'r2a') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc - Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'r1w' || curr.line_name === 'r2a') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc - Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['OLORUNSOGO NIPP'].mw = res_data['OLORUNSOGO NIPP'].mw + mw_sum;
                res_data['OLORUNSOGO NIPP'].amp = res_data['OLORUNSOGO NIPP'].amp + amp_sum;
                res_data['OLORUNSOGO NIPP'].mvar = res_data['OLORUNSOGO NIPP'].mvar + mvar_sum;
                res_data['OLORUNSOGO NIPP'].time = time;
                res_data['OLORUNSOGO NIPP'].seconds = seconds;
                res_data['OLORUNSOGO NIPP'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'eket') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['EKET'].mw = sum;
                res_data['EKET'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'phMain') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['PORT-HARCOURT MAIN'].mw = sum;
                res_data['PORT-HARCOURT MAIN'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'phMain') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['TRANS AMADI'].mw = sum;
                res_data['TRANS AMADI'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'afamViTs') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['AFAM VI'].mw = sum;
                res_data['AFAM VI'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'alaoji') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['ALAOJI'].mw = sum;
                res_data['ALAOJI'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'lokojaTs') {
                let max_voltage = 0;
                let mw_sum = 0
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'j1l' || curr.line_name === 'j2l') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    if (curr.line_name === 'l6g' || curr.line_name === 'l7g') {
                        mw_sum = acc - Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['LOKOJA TS'].mw = sum;
                res_data['LOKOJA TS'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'sapeleNippPs') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'st1' || curr.line_name === 'st3') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['SAPELE STEAM'].mw = sum;
                res_data['SAPELE STEAM'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'sapeleNippPs') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['SAPELE NIPP'].mw = sum;
                res_data['SAPELE NIPP'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omotoshoNippPs') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['OMOTOSHO NIPP'].mw = sum;
                res_data['OMOTOSHO NIPP'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'odukpaniGs') {
                let max_voltage = 0;              
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;                   
                    const sum = acc + Math.abs(curr.mw);
                    return sum;                    
                },0)
                res_data['ODUKPANI GS'].mw = res_data['ODUKPANI GS'].mw + mw_sum;
                res_data['ODUKPANI GS'].kv = max_voltage;
            }   
            if (filtered_station[0].station === 'ikotEkpene') {
                const mw_sum = filtered_station.reduce((acc, curr) => {  
                    if (curr.line_name === 'd1k' || curr.line_name === 'd2k') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['ODUKPANI GS'].mw = res_data['ODUKPANI GS'].mw + mw_sum;
            }   
            if (filtered_station[0].station === 'omotosho1') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds; 
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.amp);
                    return sum;
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mvar);
                    return sum;
                },0)
                res_data['OMOTOSHO GAS'].mw = res_data['OMOTOSHO GAS'].mw + mw_sum;
                res_data['OMOTOSHO GAS'].kv = max_voltage;
                res_data['OMOTOSHO GAS'].amp = res_data['OMOTOSHO GAS'].amp + amp_sum;
                res_data['OMOTOSHO GAS'].mvar = res_data['OMOTOSHO GAS'].mvar + mvar_sum;
                res_data['OMOTOSHO GAS'].time = time;
                res_data['OMOTOSHO GAS'].seconds = seconds;
            }
            if (filtered_station[0].station === 'omotosho2') { 
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    return sum;
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.amp);
                    return sum;
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mvar);
                    return sum;
                },0)
                res_data['OMOTOSHO GAS'].mw = res_data['OMOTOSHO GAS'].mw + mw_sum;
                res_data['OMOTOSHO GAS'].amp = res_data['OMOTOSHO GAS'].amp + amp_sum;
                res_data['OMOTOSHO GAS'].mvar = res_data['OMOTOSHO GAS'].mvar + mvar_sum;
            }
            if (filtered_station[0].station === 'delta3') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['DELTA 3'].mw = sum;
                res_data['DELTA 3'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ekim') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['EKIM'].mw = sum;
                res_data['EKIM'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gereguPs') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }                    
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['GEREGU GAS'].mw = sum;
                res_data['GEREGU GAS'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gereguPs') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        mw_sum = acc - Math.abs(curr.mw);
                    }
                    if (curr.line_name === 'r1j' || curr.line_name === 'r2j') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['GEREGU NIPP'].mw = sum;
                res_data['GEREGU NIPP'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ikotEkpene') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'a1k' || curr.line_name === 'a2k' || curr.line_name === 'd1k' || curr.line_name === 'd2k') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    if (curr.line_name === 'k1u' || curr.line_name === 'k2u' || curr.line_name === 'k3u'|| curr.line_name === 'k4u') {
                        mw_sum = acc - Math.abs(curr.mw);                        
                    }                    
                    return mw_sum;                  
                },0)
                res_data['IKOT EKPENE'].mw = sum;
                res_data['IKOT EKPENE'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'riversIppPs') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['RIVERS IPP'].mw = sum;
                res_data['RIVERS IPP'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gwagwalada') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['GWAGWALADA'].mw = sum;
                res_data['GWAGWALADA'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omokuPs1') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['OMOKU GS'].mw = sum;
                res_data['OMOKU GS'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ihovborNippPs') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['IHOVBOR NIPP'].mw = sum;
                res_data['IHOVBOR NIPP'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ihovborNippPs') {
                let max_voltage = 0;
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    // It seems this calculation is wrong, as Azura should cover the totality of ohl1 and ohl2
                    // if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                    //     mw_sum = acc - Math.abs(curr.mw);
                    // }
                    if (curr.line_name === 'ohl1' || curr.line_name === 'ohl2') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['AZURA'].mw = sum;
                res_data['AZURA'].kv = max_voltage;
            }            
            if (filtered_station[0].station === 'delta2') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['DELTA 2'].mw = sum;
                res_data['DELTA 2'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ugwuaji') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['UGWUAJI'].mw = sum;
                res_data['UGWUAJI'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'asaba') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['ASABA'].mw = sum;
                res_data['ASABA'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'parasEnergyPs') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['PARAS ENERGY'].mw = sum;
                res_data['PARAS ENERGY'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ekim' || filtered_station[0].station === 'eket') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)
                res_data['IBOM POWER'].mw = res_data['IBOM POWER'].mw + mw_sum;
                res_data['IBOM POWER'].kv = max_voltage;
            }
        }

    })

    return res_data;
}
