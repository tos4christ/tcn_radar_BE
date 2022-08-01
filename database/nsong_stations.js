const station_keys1 = [
    'omotosho2', 'eket', 'phMain', 'afamViTs', 'alaoji', 'sapeleNippPs', 'omotoshoNippPs', 'okpaiGs',
    'odukpaniGs', 'omotosho1', 'ekim', 'gereguPs', 'ikotEkpene', 'riversIppPs', 'gbarain',
    'omokuPs1', 'ihovborNippPs', 'olorunsogo1', 'parasEnergyPs', 'olorunsogoPhase1Gs', 'dadinKowaGs'
]; 

module.exports = (data) => {
    let res_data = {
        'OKPAI (GAS/STEAM)' : {mw: null, kv: null, station: 'OKPAI (GAS/STEAM)', amp: null, time: null, seconds: null, mvar:null},
        // 'DELTA (GAS)' : {mw: null, kv: null, station: 'DELTA (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'AFAM VI (GAS/STEAM)' : {mw: null, kv: null, station: 'AFAM VI (GAS/STEAM)', amp: null, time: null, seconds: null, mvar:null},
        'ALAOJI NIPP (GAS)' : {mw: null, kv: null, station: 'ALAOJI NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'SAPELE NIPP (GAS)' : {mw: null, kv: null, station: 'SAPELE NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'SAPELE (STEAM)' : {mw: null, kv: null, station: 'SAPELE (STEAM)', amp: null, time: null, seconds: null, mvar:null},
        'ODUKPANI NIPP (GAS)' : {mw: null, kv: null, station: 'ODUKPANI NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'OMOTOSHO (GAS)' : {mw: null, kv: null, station: 'OMOTOSHO (GAS)', amp: null, time: null, seconds: null, mvar:null},      
        'GEREGU (GAS)' : {mw: null, kv: null, station: 'GEREGU (GAS)', amp: null, time: null, seconds: null, mvar:null},        
        'RIVERS IPP (GAS)' : {mw: null, kv: null, station: 'RIVERS IPP (GAS)', amp: null, time: null, seconds: null, mvar:null},       
        'OMOKU (GAS)' : {mw: null, kv: null, station: 'OMOKU (GAS)', amp: null, time: null, seconds: null, mvar:null}, 
        'IHOVBOR NIPP (GAS)' : {mw: null, kv: null, station: 'IHOVBOR NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'OLORUNSOGO NIPP' : {mw: null, kv: null, station: 'OLORUNSOGO NIPP', amp: null, time: null, seconds: null, mvar:null},     
        'PARAS ENERGY (GAS)': {mw: null, kv: null, station: 'PARAS ENERGY (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'OMOTOSHO NIPP (GAS)' : {mw: null, kv: null, station: 'OMOTOSHO NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'GEREGU NIPP (GAS)' : {mw: null, kv: null, station: 'GEREGU NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'AZURA-EDO IPP (GAS)' : {mw: null, kv: null, station: 'AZURA-EDO IPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'TRANS-AMADI (GAS)' : {mw: null, kv: null, station: 'TRANS-AMADI (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'IBOM POWER (GAS)' : {mw: null, kv: null, station: 'IBOM POWER (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'OLORUNSOGO (GAS)' : {mw: null, kv: null, station: 'OLORUNSOGO (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'GBARAIN NIPP (GAS)' : {mw: null, kv: null, station: 'GBARAIN NIPP (GAS)', amp: null, time: null, seconds: null, mvar:null},
        'DADINKOWA G.S (HYDRO)' : {mw: null, kv: null, station: 'DADINKOWA G.S (HYDRO)', amp: null, time: null, seconds: null, mvar:null}
    };

    
    station_keys1.forEach(station => {
        // filter the station from the data
        const filtered_station = data.filter( dat => dat.station === station);
        // console.log(data.filter( dat => dat.station === 'olorunsogo1'), 'the olorunsogo filtered station name in the nsong_station')
        if (filtered_station.length > 0) {
            if (filtered_station[0].station === 'dadinKowaGs') {
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
                res_data['DADINKOWA G.S (HYDRO)'].mw = mw_sum;
                res_data['DADINKOWA G.S (HYDRO)'].kv = max_voltage;
                res_data['DADINKOWA G.S (HYDRO)'].amp = amp_sum;
                res_data['DADINKOWA G.S (HYDRO)'].mvar = mvar_sum;
                res_data['DADINKOWA G.S (HYDRO)'].time = time;
                res_data['DADINKOWA G.S (HYDRO)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'gbarain') {
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
                res_data['GBARAIN NIPP (GAS)'].mw = mw_sum;
                res_data['GBARAIN NIPP (GAS)'].kv = max_voltage;
                res_data['GBARAIN NIPP (GAS)'].amp = amp_sum;
                res_data['GBARAIN NIPP (GAS)'].mvar = mvar_sum;
                res_data['GBARAIN NIPP (GAS)'].time = time;
                res_data['GBARAIN NIPP (GAS)'].seconds = seconds;
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
                res_data['OLORUNSOGO (GAS)'].mw = res_data['OLORUNSOGO (GAS)'].mw + mw_sum;
                res_data['OLORUNSOGO (GAS)'].amp = res_data['OLORUNSOGO (GAS)'].amp + amp_sum;
                res_data['OLORUNSOGO (GAS)'].mvar = res_data['OLORUNSOGO (GAS)'].mvar + mvar_sum;
                res_data['OLORUNSOGO (GAS)'].kv = res_data['OLORUNSOGO (GAS)'].kv ? res_data['OLORUNSOGO (GAS)'].kv : max_voltage;                
                res_data['OLORUNSOGO (GAS)'].time = res_data['OLORUNSOGO (GAS)'].time ? res_data['OLORUNSOGO (GAS)'].time : time;
                res_data['OLORUNSOGO (GAS)'].seconds = res_data['OLORUNSOGO (GAS)'].seconds ? res_data['OLORUNSOGO (GAS)'].seconds : seconds;
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
                res_data['OLORUNSOGO NIPP'].mw = res_data['OLORUNSOGO NIPP'].mw + mw_sum <= 0 ? 0 : mw_sum;
                res_data['OLORUNSOGO NIPP'].amp = res_data['OLORUNSOGO NIPP'].amp + amp_sum <= 0 ? 0 : amp_sum;
                res_data['OLORUNSOGO NIPP'].mvar = res_data['OLORUNSOGO NIPP'].mvar + mvar_sum <= 0 ? 0 : mvar_sum;
                res_data['OLORUNSOGO NIPP'].time = res_data['OLORUNSOGO NIPP'].time ? res_data['OLORUNSOGO NIPP'].time : time;
                res_data['OLORUNSOGO NIPP'].seconds = res_data['OLORUNSOGO NIPP'].seconds ? res_data['OLORUNSOGO NIPP'].seconds : seconds;
                res_data['OLORUNSOGO NIPP'].kv = res_data['OLORUNSOGO NIPP'].kv ? res_data['OLORUNSOGO NIPP'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'phMain') {
                // console.log(filtered_station, 'the filtered station for phMain')
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
                res_data['TRANS-AMADI (GAS)'].mw = mw_sum;
                res_data['TRANS-AMADI (GAS)'].kv = max_voltage;
                res_data['TRANS-AMADI (GAS)'].amp = amp_sum;
                res_data['TRANS-AMADI (GAS)'].mvar = mvar_sum;
                res_data['TRANS-AMADI (GAS)'].time = time;
                res_data['TRANS-AMADI (GAS)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'afamViTs') {
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
                res_data['AFAM VI (GAS/STEAM)'].mw = mw_sum;
                res_data['AFAM VI (GAS/STEAM)'].kv = max_voltage;
                res_data['AFAM VI (GAS/STEAM)'].amp = amp_sum;
                res_data['AFAM VI (GAS/STEAM)'].mvar = mvar_sum;
                res_data['AFAM VI (GAS/STEAM)'].time = time;
                res_data['AFAM VI (GAS/STEAM)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'alaoji') {
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
                res_data['ALAOJI NIPP (GAS)'].mw = mw_sum;
                res_data['ALAOJI NIPP (GAS)'].kv = max_voltage;
                res_data['ALAOJI NIPP (GAS)'].amp = amp_sum;
                res_data['ALAOJI NIPP (GAS)'].mvar = mvar_sum;
                res_data['ALAOJI NIPP (GAS)'].time = time;
                res_data['ALAOJI NIPP (GAS)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'sapeleNippPs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'st1' || curr.line_name === 'st3') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'st1' || curr.line_name === 'st3') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'st1' || curr.line_name === 'st3') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['SAPELE (STEAM)'].mw = mw_sum;
                res_data['SAPELE (STEAM)'].kv = max_voltage;
                res_data['SAPELE (STEAM)'].amp = amp_sum;
                res_data['SAPELE (STEAM)'].mvar = mvar_sum;
                res_data['SAPELE (STEAM)'].time = time;
                res_data['SAPELE (STEAM)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'sapeleNippPs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;  
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    } else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    } else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    } else {
                        return acc
                    }
                },0)
                res_data['SAPELE NIPP (GAS)'].mw = mw_sum;
                res_data['SAPELE NIPP (GAS)'].kv = max_voltage;
                res_data['SAPELE NIPP (GAS)'].amp = amp_sum;
                res_data['SAPELE NIPP (GAS)'].mvar = mvar_sum;
                res_data['SAPELE NIPP (GAS)'].time = time;
                res_data['SAPELE NIPP (GAS)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'omotoshoNippPs') {
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
                res_data['OMOTOSHO NIPP (GAS)'].mw = mw_sum;
                res_data['OMOTOSHO NIPP (GAS)'].kv = max_voltage;
                res_data['OMOTOSHO NIPP (GAS)'].amp = amp_sum;
                res_data['OMOTOSHO NIPP (GAS)'].mvar = mvar_sum;
                res_data['OMOTOSHO NIPP (GAS)'].time = time;
                res_data['OMOTOSHO NIPP (GAS)'].seconds = seconds;
            }            
            if (filtered_station[0].station === 'odukpaniGs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;                
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;                   
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
                res_data['ODUKPANI NIPP (GAS)'].mw = res_data['ODUKPANI NIPP (GAS)'].mw + mw_sum;                
                res_data['ODUKPANI NIPP (GAS)'].amp = res_data['ODUKPANI NIPP (GAS)'].amp + amp_sum;
                res_data['ODUKPANI NIPP (GAS)'].mvar = res_data['ODUKPANI NIPP (GAS)'].mvar + mvar_sum;
                res_data['ODUKPANI NIPP (GAS)'].kv = res_data['ODUKPANI NIPP (GAS)'].kv ? res_data['ODUKPANI NIPP (GAS)'].kv : max_voltage
                res_data['ODUKPANI NIPP (GAS)'].time = res_data['ODUKPANI NIPP (GAS)'].time ? res_data['ODUKPANI NIPP (GAS)'].time : time
                res_data['ODUKPANI NIPP (GAS)'].seconds = res_data['ODUKPANI NIPP (GAS)'].seconds ? res_data['ODUKPANI NIPP (GAS)'].seconds : seconds
            }   
            if (filtered_station[0].station === 'ikotEkpene') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'd1k' || curr.line_name === 'd2k') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'd1k' || curr.line_name === 'd2k') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'd1k' || curr.line_name === 'd2k') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['ODUKPANI NIPP (GAS)'].mw = res_data['ODUKPANI NIPP (GAS)'].mw + mw_sum;
                res_data['ODUKPANI NIPP (GAS)'].amp = res_data['ODUKPANI NIPP (GAS)'].amp + amp_sum;
                res_data['ODUKPANI NIPP (GAS)'].mvar = res_data['ODUKPANI NIPP (GAS)'].mvar + mvar_sum;
                res_data['ODUKPANI NIPP (GAS)'].kv = res_data['ODUKPANI NIPP (GAS)'].kv ? res_data['ODUKPANI NIPP (GAS)'].kv : max_voltage
                res_data['ODUKPANI NIPP (GAS)'].time = res_data['ODUKPANI NIPP (GAS)'].time ? res_data['ODUKPANI NIPP (GAS)'].time : time
                res_data['ODUKPANI NIPP (GAS)'].seconds = res_data['ODUKPANI NIPP (GAS)'].seconds ? res_data['ODUKPANI NIPP (GAS)'].seconds : seconds
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
                res_data['OMOTOSHO (GAS)'].mw = res_data['OMOTOSHO (GAS)'].mw + mw_sum;                
                res_data['OMOTOSHO (GAS)'].amp = res_data['OMOTOSHO (GAS)'].amp + amp_sum;
                res_data['OMOTOSHO (GAS)'].mvar = res_data['OMOTOSHO (GAS)'].mvar + mvar_sum;
                res_data['OMOTOSHO (GAS)'].kv = max_voltage;
                res_data['OMOTOSHO (GAS)'].time = time;
                res_data['OMOTOSHO (GAS)'].seconds = seconds;
            }
            if (filtered_station[0].station === 'omotosho2') { 
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds; 
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
                res_data['OMOTOSHO (GAS)'].mw = res_data['OMOTOSHO (GAS)'].mw + mw_sum;
                res_data['OMOTOSHO (GAS)'].amp = res_data['OMOTOSHO (GAS)'].amp + amp_sum;
                res_data['OMOTOSHO (GAS)'].mvar = res_data['OMOTOSHO (GAS)'].mvar + mvar_sum;
                res_data['OMOTOSHO (GAS)'].kv = res_data['OMOTOSHO (GAS)'].kv ? res_data['OMOTOSHO (GAS)'].kv : max_voltage;
                res_data['OMOTOSHO (GAS)'].time = res_data['OMOTOSHO (GAS)'].time ? res_data['OMOTOSHO (GAS)'].time : time;
                res_data['OMOTOSHO (GAS)'].seconds = res_data['OMOTOSHO (GAS)'].seconds ? res_data['OMOTOSHO (GAS)'].seconds : seconds;
            }
            if (filtered_station[0].station === 'deltaGs') {
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
                res_data['DELTA (GAS)'].mw = res_data['DELTA (GAS)'].mw + mw_sum;
                res_data['DELTA (GAS)'].amp = res_data['DELTA (GAS)'].amp + amp_sum;
                res_data['DELTA (GAS)'].mvar = res_data['DELTA (GAS)'].mvar + mvar_sum;
                res_data['DELTA (GAS)'].kv = res_data['DELTA (GAS)'].kv ? res_data['DELTA (GAS)'].kv : max_voltage
                res_data['DELTA (GAS)'].time = res_data['DELTA (GAS)'].time ? res_data['DELTA (GAS)'].time : time
                res_data['DELTA (GAS)'].seconds = res_data['DELTA (GAS)'].seconds ? res_data['DELTA (GAS)'].seconds : seconds
            }
            if (filtered_station[0].station === 'delta3') {
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
                res_data['DELTA (GAS)'].mw = res_data['DELTA (GAS)'].mw + mw_sum;
                res_data['DELTA (GAS)'].amp = res_data['DELTA (GAS)'].amp + amp_sum;
                res_data['DELTA (GAS)'].mvar = res_data['DELTA (GAS)'].mvar + mvar_sum;
                res_data['DELTA (GAS)'].kv = res_data['DELTA (GAS)'].kv ? res_data['DELTA (GAS)'].kv : max_voltage
                res_data['DELTA (GAS)'].time = res_data['DELTA (GAS)'].time ? res_data['DELTA (GAS)'].time : time
                res_data['DELTA (GAS)'].seconds = res_data['DELTA (GAS)'].seconds ? res_data['DELTA (GAS)'].seconds : seconds
            }
            if (filtered_station[0].station === 'delta2') {
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
                res_data['DELTA (GAS)'].mw = res_data['DELTA (GAS)'].mw + mw_sum;
                res_data['DELTA (GAS)'].amp = res_data['DELTA (GAS)'].amp + amp_sum;
                res_data['DELTA (GAS)'].mvar = res_data['DELTA (GAS)'].mvar + mvar_sum;
                res_data['DELTA (GAS)'].kv = res_data['DELTA (GAS)'].kv ? res_data['DELTA (GAS)'].kv : max_voltage
                res_data['DELTA (GAS)'].time = res_data['DELTA (GAS)'].time ? res_data['DELTA (GAS)'].time : time
                res_data['DELTA (GAS)'].seconds = res_data['DELTA (GAS)'].seconds ? res_data['DELTA (GAS)'].seconds : seconds
            }            
            if (filtered_station[0].station === 'okpaiGs') {
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
                res_data['OKPAI (GAS/STEAM)'].mw = mw_sum;
                res_data['OKPAI (GAS/STEAM)'].amp = amp_sum;
                res_data['OKPAI (GAS/STEAM)'].mvar = mvar_sum;
                res_data['OKPAI (GAS/STEAM)'].time = time;
                res_data['OKPAI (GAS/STEAM)'].seconds = seconds;
                res_data['OKPAI (GAS/STEAM)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gereguPs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv; 
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['GEREGU (GAS)'].mw = mw_sum;
                res_data['GEREGU (GAS)'].amp = amp_sum;
                res_data['GEREGU (GAS)'].mvar = mvar_sum;
                res_data['GEREGU (GAS)'].time = time;
                res_data['GEREGU (GAS)'].seconds = seconds;
                res_data['GEREGU (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'gereguPs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc - Math.abs(curr.mw);
                        return sum;
                    }
                    if (curr.line_name === 'r1j' || curr.line_name === 'r2j') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc - Math.abs(curr.amp);
                        return sum;
                    }
                    if (curr.line_name === 'r1j' || curr.line_name === 'r2j') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt11' || curr.line_name === 'gt12' || curr.line_name === 'gt13') {
                        const sum = acc - Math.abs(curr.mvar);
                        return sum;
                    }
                    if (curr.line_name === 'r1j' || curr.line_name === 'r2j') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['GEREGU NIPP (GAS)'].mw = mw_sum;
                res_data['GEREGU NIPP (GAS)'].amp = amp_sum;
                res_data['GEREGU NIPP (GAS)'].mvar = mvar_sum;
                res_data['GEREGU NIPP (GAS)'].time = time;
                res_data['GEREGU NIPP (GAS)'].seconds = seconds;
                res_data['GEREGU NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'riversIppPs') {
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
                res_data['RIVERS IPP (GAS)'].mw = mw_sum;
                res_data['RIVERS IPP (GAS)'].amp = amp_sum;
                res_data['RIVERS IPP (GAS)'].mvar = mvar_sum;
                res_data['RIVERS IPP (GAS)'].time = time;
                res_data['RIVERS IPP (GAS)'].seconds = seconds;
                res_data['RIVERS IPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omokuPs1') {
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
                res_data['OMOKU (GAS)'].mw = mw_sum;
                res_data['OMOKU (GAS)'].amp = amp_sum;
                res_data['OMOKU (GAS)'].mvar = mvar_sum;
                res_data['OMOKU (GAS)'].time = time;
                res_data['OMOKU (GAS)'].seconds = seconds;
                res_data['OMOKU (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ihovborNippPs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0);
                res_data['IHOVBOR NIPP (GAS)'].mw = mw_sum;
                res_data['IHOVBOR NIPP (GAS)'].amp = amp_sum;
                res_data['IHOVBOR NIPP (GAS)'].mvar = mvar_sum;
                res_data['IHOVBOR NIPP (GAS)'].time = time;
                res_data['IHOVBOR NIPP (GAS)'].seconds = seconds;
                res_data['IHOVBOR NIPP (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'ihovborNippPs') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;                    
                    if (curr.line_name === 'ohl1' || curr.line_name === 'ohl2') {
                        const sum = acc + Math.abs(curr.mw);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'ohl1' || curr.line_name === 'ohl2') {
                        const sum = acc + Math.abs(curr.amp);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'ohl1' || curr.line_name === 'ohl2') {
                        const sum = acc + Math.abs(curr.mvar);
                        return sum;
                    }else {
                        return acc
                    }
                },0)
                res_data['AZURA-EDO IPP (GAS)'].mw = mw_sum;
                res_data['AZURA-EDO IPP (GAS)'].amp = amp_sum;
                res_data['AZURA-EDO IPP (GAS)'].mvar = mvar_sum;
                res_data['AZURA-EDO IPP (GAS)'].time = time;
                res_data['AZURA-EDO IPP (GAS)'].seconds = seconds;
                res_data['AZURA-EDO IPP (GAS)'].kv = max_voltage;
            }            
            if (filtered_station[0].station === 'parasEnergyPs') {
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
                res_data['PARAS ENERGY (GAS)'].mw = mw_sum;
                res_data['PARAS ENERGY (GAS)'].amp = amp_sum;
                res_data['PARAS ENERGY (GAS)'].mvar = mvar_sum;
                res_data['PARAS ENERGY (GAS)'].time = time;
                res_data['PARAS ENERGY (GAS)'].seconds = seconds;
                res_data['PARAS ENERGY (GAS)'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'eket') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + curr.mw;
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + curr.amp;
                    return sum;
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + curr.mvar;
                    return sum;
                },0)
                res_data['IBOM POWER (GAS)'].mw = res_data['IBOM POWER (GAS)'].mw  + mw_sum;
                res_data['IBOM POWER (GAS)'].amp = res_data['IBOM POWER (GAS)'].amp + amp_sum;
                res_data['IBOM POWER (GAS)'].mvar = res_data['IBOM POWER (GAS)'].mvar + mvar_sum;
                res_data['IBOM POWER (GAS)'].time = res_data['IBOM POWER (GAS)'].time ? res_data['IBOM POWER (GAS)'].time : time;
                res_data['IBOM POWER (GAS)'].seconds = res_data['IBOM POWER (GAS)'].seconds ? res_data['IBOM POWER (GAS)'].seconds : seconds;
                res_data['IBOM POWER (GAS)'].kv = res_data['IBOM POWER (GAS)'].kv ? res_data['IBOM POWER (GAS)'].kv : max_voltage;
            }
            if (filtered_station[0].station === 'ekim') {
                let max_voltage = 0, time = filtered_station[0].time, seconds = filtered_station[0].seconds;
                const mw_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + curr.mw;
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return sum;
                },0)
                const amp_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + curr.amp;
                    return sum;
                },0)
                const mvar_sum = filtered_station.reduce((acc, curr) => {
                    const sum = acc + curr.mvar;
                    return sum;
                },0)
                res_data['IBOM POWER (GAS)'].mw = res_data['IBOM POWER (GAS)'].mw  - mw_sum;
                res_data['IBOM POWER (GAS)'].amp = res_data['IBOM POWER (GAS)'].amp - amp_sum;
                res_data['IBOM POWER (GAS)'].mvar = res_data['IBOM POWER (GAS)'].mvar - mvar_sum;
                res_data['IBOM POWER (GAS)'].time = res_data['IBOM POWER (GAS)'].time ? res_data['IBOM POWER (GAS)'].time : time;
                res_data['IBOM POWER (GAS)'].seconds = res_data['IBOM POWER (GAS)'].seconds ? res_data['IBOM POWER (GAS)'].seconds : seconds;
                res_data['IBOM POWER (GAS)'].kv = res_data['IBOM POWER (GAS)'].kv ? res_data['IBOM POWER (GAS)'].kv : max_voltage;
            }
        }
    })
    return res_data;
}
