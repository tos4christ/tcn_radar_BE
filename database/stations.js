const station_keys1 = [
    'omotosho2', 'eket', 'phMain', 'afamViTs', 'alaoji', 'lokojaTs', 'sapeleNippPs', 'omotoshoNippPs',
    'odukpaniGs', 'omotosho1', 'delta3', 'ekim', 'gereguPs', 'ikotEkpene', 'riversIppPs', 'gwagwalada',
    'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'ugwuaji', 'asaba', 'parasEnergyPs', 
    'olorunsogoPhase1Gs', 'okpaiGs', 'gbarain', 'jebbaTs', 'dadinKowaGs', 'kainjiTs', 'egbinPs', 
    'afamIv_vPs', 'shiroroPs', 'delta2', 'delta3', 'deltaGs'
];

module.exports = (data) => {
    let res_data = { 
        'EKET': {mw: null, kv: null, station: 'EKET'},
        'PORT-HARCOURT MAIN' : {mw: null, kv: null, station: 'PORT-HARCOURT MAIN'},
        'LOKOJA TS' : {mw: null, kv: null, station: 'LOKOJA TS'},
        'EKIM' : {mw: null, kv: null, station: 'EKIM'},
        'IKOT EKPENE' : {mw: null, kv: null, station: 'IKOT EKPENE'}, 
        'GWAGWALADA' : {mw: null, kv: null, station: 'GWAGWALADA'},
        'UGWUAJI' : {mw: null, kv: null, station: 'UGWUAJI'},
        'ASABA' : {mw: null, kv: null, station: 'ASABA'},
        'SHIRORO (HYDRO)' : {mw: null, kv: null, station: 'SHIRORO (HYDRO)'},
        'AFAM IV & V (GAS)' : {mw: null, kv: null, station: 'AFAM IV & V (GAS)'},
        'KAINJI (HYDRO)' : {mw: null, kv: null, station: 'KAINJI (HYDRO)'},
        'EGBIN (STEAM)' : {mw: null, kv: null, station: 'EGBIN (STEAM)'},
        'OKPAI (GAS/STEAM)' : {mw: null, kv: null, station: 'OKPAI (GAS/STEAM)'},
        'DELTA (GAS)' : {mw: null, kv: null, station: 'DELTA (GAS)'},
        'JEBBA (HYDRO)' : {mw: null, kv: null, station: 'JEBBA (HYDRO)'},
        'AFAM VI (GAS/STEAM)' : {mw: null, kv: null, station: 'AFAM VI (GAS/STEAM)'},
        'ALAOJI NIPP (GAS)' : {mw: null, kv: null, station: 'ALAOJI NIPP (GAS)'},
        'SAPELE (STEAM)' : {mw: null, kv: null, station: 'SAPELE (STEAM)'},
        'SAPELE NIPP (GAS)' : {mw: null, kv: null, station: 'SAPELE NIPP (GAS)'},
        'ODUKPANI NIPP (GAS)' : {mw: null, kv: null, station: 'ODUKPANI NIPP (GAS)'},
        'OMOTOSHO (GAS)' : {mw: null, kv: null, station: 'OMOTOSHO (GAS)'},
        'GEREGU (GAS)' : {mw: null, kv: null, station: 'GEREGU (GAS)'},
        'RIVERS IPP (GAS)' : {mw: null, kv: null, station: 'RIVERS IPP (GAS)'},
        'OMOKU (GAS)' : {mw: null, kv: null, station: 'OMOKU (GAS)'},
        'IHOVBOR NIPP (GAS)' : {mw: null, kv: null, station: 'IHOVBOR NIPP (GAS)'},
        'OLORUNSOGO NIPP' : {mw: null, kv: null, station: 'OLORUNSOGO NIPP'},
        'PARAS ENERGY (GAS)' : {mw: null, kv: null, station: 'PARAS ENERGY (GAS)'},
        'OMOTOSHO NIPP (GAS)' : {mw: null, kv: null, station: 'OMOTOSHO NIPP (GAS)'},
        'GEREGU NIPP (GAS)' : {mw: null, kv: null, station: 'GEREGU NIPP (GAS)'},
        'AZURA-EDO IPP (GAS)' : {mw: null, kv: null, station: 'AZURA-EDO IPP (GAS)'},
        'TRANS-AMADI (GAS)' : {mw: null, kv: null, station: 'TRANS-AMADI (GAS)'},
        'IBOM POWER (GAS)' : {mw: null, kv: null, station: 'IBOM POWER (GAS)'},
        'GBARAIN NIPP (GAS)' : {mw: null, kv: null, station: 'GBARAIN NIPP (GAS)'},
        'OLORUNSOGO (GAS)' : {mw: null, kv: null, station: 'OLORUNSOGO (GAS)'},
        'DADINKOWA G.S (HYDRO)' : {mw: null, kv: null, station: 'DADINKOWA G.S (HYDRO)'},
    };

    station_keys1.forEach(station => {
        // filter the station from the data
        const filtered_station = data.filter( dat => dat.station === station);
        if (filtered_station.length > 0) {
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
            if (filtered_station[0].station === 'shiroroPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['SHIRORO (HYDRO)'].mw = mw_sum;
                res_data['SHIRORO (HYDRO)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'afamIv_vPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['AFAM IV & V (GAS)'].mw = mw_sum;
                res_data['AFAM IV & V (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'kainjiTs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['KAINJI (HYDRO)'].mw = mw_sum;
                res_data['KAINJI (HYDRO)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'egbinPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['EGBIN (STEAM)'].mw = mw_sum;
                res_data['EGBIN (STEAM)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'jebbaTs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['JEBBA (HYDRO)'].mw = mw_sum;
                res_data['JEBBA (HYDRO)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'dadinKowaGs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['DADINKOWA G.S (HYDRO)'].mw = mw_sum;
                res_data['DADINKOWA G.S (HYDRO)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gbarain') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['GBARAIN NIPP (GAS)'].mw = mw_sum;
                res_data['GBARAIN NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'olorunsogoPhase1Gs' || filtered_station[0].station === 'olorunsogo1') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['OLORUNSOGO (GAS)'].mw = res_data['OLORUNSOGO (GAS)'].mw + mw_sum;
                res_data['OLORUNSOGO (GAS)'].kv = res_data['OLORUNSOGO (GAS)'].kv ? res_data['OLORUNSOGO (GAS)'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'olorunsogo1' || filtered_station[0].station === 'olorunsogoPhase1Gs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'r1w' || curr.line_name === 'r2a') {
                        const sum = acc + curr.mw;
                        return sum;
                    }
                    if (curr.line_name === 'tr1' || curr.line_name === 'tr2' || curr.line_name === 'tr3' || curr.line_name === 'tr4') {
                        const sum = acc - curr.mw;
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['OLORUNSOGO NIPP'].mw = res_data['OLORUNSOGO NIPP'].mw + mw_sum;
                res_data['OLORUNSOGO NIPP'].kv = res_data['OLORUNSOGO NIPP'].kv ? res_data['OLORUNSOGO NIPP'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'phMain') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['TRANS-AMADI (GAS)'].mw = mw_sum;
                res_data['TRANS-AMADI (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'afamViTs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['AFAM VI (GAS/STEAM)'].mw = mw_sum;
                res_data['AFAM VI (GAS/STEAM)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'alaoji') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['ALAOJI NIPP (GAS)'].mw = mw_sum;
                res_data['ALAOJI NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'sapeleNippPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'st1' || curr.line_name === 'st3') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['SAPELE (STEAM)'].mw = mw_sum;
                res_data['SAPELE (STEAM)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'sapeleNippPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;  
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    } else {
                        return acc
                    }
                },0);
                res_data['SAPELE NIPP (GAS)'].mw = mw_sum;
                res_data['SAPELE NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omotoshoNippPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['OMOTOSHO NIPP (GAS)'].mw = mw_sum;
                res_data['OMOTOSHO NIPP (GAS)'].kv = max_voltage;
            }            
            if (filtered_station[0].station === 'odukpaniGs') {
                let max_voltage = 0;                
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;                   
                    const sum = acc + Math.abs(curr.mw);
                    return sum;                    
                },0);
                res_data['ODUKPANI NIPP (GAS)'].mw = res_data['ODUKPANI NIPP (GAS)'].mw + mw_sum;
                res_data['ODUKPANI NIPP (GAS)'].kv = res_data['ODUKPANI NIPP (GAS)'].kv ? res_data['ODUKPANI NIPP (GAS)'].kv : max_voltage;
            }   
            if (filtered_station[0].station === 'ikotEkpene') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'd1k' || curr.line_name === 'd2k') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['ODUKPANI NIPP (GAS)'].mw = res_data['ODUKPANI NIPP (GAS)'].mw + mw_sum;
                res_data['ODUKPANI NIPP (GAS)'].kv = res_data['ODUKPANI NIPP (GAS)'].kv ? res_data['ODUKPANI NIPP (GAS)'].kv : max_voltage;
            }         
            if (filtered_station[0].station === 'omotosho1') {
                let max_voltage = 0; 
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['OMOTOSHO (GAS)'].mw = res_data['OMOTOSHO (GAS)'].mw + mw_sum;
                res_data['OMOTOSHO (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omotosho2') { 
                let max_voltage = 0; 
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    return sum;
                },0);
                res_data['OMOTOSHO (GAS)'].mw = res_data['OMOTOSHO (GAS)'].mw + mw_sum;
                res_data['OMOTOSHO (GAS)'].kv = res_data['OMOTOSHO (GAS)'].kv ? res_data['OMOTOSHO (GAS)'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'deltaGs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['DELTA (GAS)'].mw = res_data['DELTA (GAS)'].mw + mw_sum;
                res_data['DELTA (GAS)'].kv = res_data['DELTA (GAS)'].kv ? res_data['DELTA (GAS)'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'delta3') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['DELTA (GAS)'].mw = res_data['DELTA (GAS)'].mw + mw_sum;
                res_data['DELTA (GAS)'].kv = res_data['DELTA (GAS)'].kv ? res_data['DELTA (GAS)'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'delta2') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['DELTA (GAS)'].mw = res_data['DELTA (GAS)'].mw + mw_sum;
                res_data['DELTA (GAS)'].kv = res_data['DELTA (GAS)'].kv ? res_data['DELTA (GAS)'].kv : max_voltage;
            }            
            if (filtered_station[0].station === 'okpaiGs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['OKPAI (GAS/STEAM)'].mw = mw_sum;
                res_data['OKPAI (GAS/STEAM)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gereguPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['GEREGU (GAS)'].mw = mw_sum;
                res_data['GEREGU (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gereguPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc - Math.abs(curr.mw);
                        return sum;
                    }
                    if (curr.line_name === 'r1j' || curr.line_name === 'r2j') {
                        const sum = acc + -(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['GEREGU NIPP (GAS)'].mw = mw_sum;
                res_data['GEREGU NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'riversIppPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['RIVERS IPP (GAS)'].mw = mw_sum;
                res_data['RIVERS IPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omokuPs1') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['OMOKU (GAS)'].mw = mw_sum;
                res_data['OMOKU (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ihovborNippPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['IHOVBOR NIPP (GAS)'].mw = mw_sum;
                res_data['IHOVBOR NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ihovborNippPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;                    
                    if (curr.line_name === 'ohl1' || curr.line_name === 'ohl2') {
                        const sum = acc + -(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['AZURA-EDO IPP (GAS)'].mw = mw_sum;
                res_data['AZURA-EDO IPP (GAS)'].kv = max_voltage;
            }            
            if (filtered_station[0].station === 'parasEnergyPs') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)
                res_data['PARAS ENERGY (GAS)'].mw = mw_sum;
                res_data['PARAS ENERGY (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'eket') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + -(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['IBOM POWER (GAS)'].mw = res_data['IBOM POWER (GAS)'].mw  + mw_sum;
                res_data['IBOM POWER (GAS)'].kv = res_data['IBOM POWER (GAS)'].kv ? res_data['IBOM POWER (GAS)'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'ekim') {
                let max_voltage = 0;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + -(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0);
                res_data['IBOM POWER (GAS)'].mw = res_data['IBOM POWER (GAS)'].mw  - mw_sum;
                res_data['IBOM POWER (GAS)'].kv = res_data['IBOM POWER (GAS)'].kv ? res_data['IBOM POWER (GAS)'].kv : max_voltage;
            }
        }
    });
    return res_data;
}
