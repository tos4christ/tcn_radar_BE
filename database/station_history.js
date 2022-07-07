const db = require('./db');
const model = require('../models/lines');

const station_keys1 = [
    'omotosho2', 'eket', 'phMain', 'afamViTs', 'alaoji', 'lokojaTs', 'sapeleNippPs', 'omotoshoNippPs',
    'odukpaniGs', 'omotosho1', 'delta3', 'ekim', 'gereguPs', 'ikotEkpene', 'riversIppPs', 'gwagwalada',
    'omokuGs', 'ihovborNippPs', 'olorunsogo1', 'delta2', 'ugwuaji', 'asaba', 'parasEnergyPs'
]; 

module.exports = (data) => {
    let res_data = { 
        'OMOTOSHO 2' : {mw: null, kv: null, station: 'OMOTOSHO 2', amp: null, time: null, seconds: null, mvar:null},
        'EKET': {mw: null, kv: null, station: 'EKET', amp: null, time: null, seconds: null, mvar:null},
        'PORT-HARCOURT MAIN' : {mw: null, kv: null, station: 'PORT-HARCOURT MAIN', amp: null, time: null, seconds: null, mvar:null}, 
        'AFAM VI' : {mw: null, kv: null, station: 'AFAM VI', amp: null, time: null, seconds: null, mvar:null},
        'ALAOJI' : {mw: null, kv: null, station: 'ALAOJI', amp: null, time: null, seconds: null, mvar:null},
        'SAPELE NIPP' : {mw: null, kv: null, station: 'SAPELE NIPP', amp: null, time: null, seconds: null, mvar:null},
        'SAPELE STEAM' : {mw: null, kv: null, station: 'SAPELE STEAM', amp: null, time: null, seconds: null, mvar:null},
        'ODUKPANI GS' : {mw: null, kv: null, station: 'ODUKPANI GS', amp: null, time: null, seconds: null, mvar:null},
        'OMOTOSHO 1' : {mw: null, kv: null, station: 'OMOTOSHO 1', amp: null, time: null, seconds: null, mvar:null},
        'DELTA 3' : {mw: null, kv: null, station: 'DELTA 3', amp: null, time: null, seconds: null, mvar:null},
        'EKIM' : {mw: null, kv: null, station: 'EKIM', amp: null, time: null, seconds: null, mvar:null},
        'GEREGU GAS' : {mw: null, kv: null, station: 'GEREGU GAS', amp: null, time: null, seconds: null, mvar:null},
        'IKOT EKPENE' : {mw: null, kv: null, station: 'IKOT EKPENE', amp: null, time: null, seconds: null, mvar:null},
        'RIVERS IPP' : {mw: null, kv: null, station: 'RIVERS IPP', amp: null, time: null, seconds: null, mvar:null}, 
        'GWAGWALADA' : {mw: null, kv: null, station: 'GWAGWALADA', amp: null, time: null, seconds: null, mvar:null},
        'OMOKU GS' : {mw: null, kv: null, station: 'OMOKU GS', amp: null, time: null, seconds: null, mvar:null}, 
        'IHOVBOR NIPP' : {mw: null, kv: null, station: 'IHOVBOR NIPP', amp: null, time: null, seconds: null, mvar:null},
        'OLORUNSOGO 1' : {mw: null, kv: null, station: 'OLORUNSOGO 1', amp: null, time: null, seconds: null, mvar:null},
        'DELTA 2' : {mw: null, kv: null, station: 'DELTA 2', amp: null, time: null, seconds: null, mvar:null},
        'UGWUAJI' : {mw: null, kv: null, station: 'UGWUAJI', amp: null, time: null, seconds: null, mvar:null},
        'ASABA' : {mw: null, kv: null, station: 'ASABA', amp: null, time: null, seconds: null, mvar:null},
        'PARAS ENERGY': {mw: null, kv: null, station: 'PARAS ENERGY', amp: null, time: null, seconds: null, mvar:null},
        'OMOTOSHO NIPP' : {mw: null, kv: null, station: 'OMOTOSHO NIPP', amp: null, time: null, seconds: null, mvar:null},
        'GEREGU NIPP' : {mw: null, kv: null, station: 'GEREGU NIPP', amp: null, time: null, seconds: null, mvar:null},
        'AZURA' : {mw: null, kv: null, station: 'AZURA', amp: null, time: null, seconds: null, mvar:null},
        'TRANS AMADI' : {mw: null, kv: null, station: 'TRANS AMADI', amp: null, time: null, seconds: null, mvar:null},
        'IBOM POWER' : {mw: null, kv: null, station: 'TRANS AMADI', amp: null, time: null, seconds: null, mvar:null}
    };

    station_keys1.forEach(station => {
        // filter the station from the data
        const filtered_station = data.filter( dat => dat.station === station);
        if (filtered_station.length > 0) {
            if (filtered_station[0].station === 'omotosho2') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['OMOTOSHO 2'].mw = sum;
                res_data['OMOTOSHO 2'].kv = max_voltage;
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
                let mw_sum = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    if (curr.line_name === 'd1k' || curr.line_name === 'd2k' || curr.line_name === 'd1b' || curr.line_name === 'd2b') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['ODUKPANI GS'].mw = sum;
                res_data['ODUKPANI GS'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'omotosho1') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['OMOTOSHO 1'].mw = sum;
                res_data['OMOTOSHO 1'].kv = max_voltage;
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
            if (filtered_station[0].station === 'omokuGs') {
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
                    if (curr.line_name === 'gt1' || curr.line_name === 'gt2' || curr.line_name === 'gt3' || curr.line_name === 'gt4') {
                        mw_sum = acc - Math.abs(curr.mw);
                    }
                    if (curr.line_name === 'ohl1' || curr.line_name === 'ohl2') {
                        mw_sum = acc + Math.abs(curr.mw);
                    }
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['AZURA'].mw = sum;
                res_data['AZURA'].kv = max_voltage;
            }
            if (filtered_station[0].station === 'olorunsogo1') {
                let max_voltage = 0;
                const sum = filtered_station.reduce((acc, curr) => {
                    const mw_sum = acc + Math.abs(curr.mw);
                    max_voltage = max_voltage > curr.kv ? max_voltage : curr.kv;
                    return mw_sum;
                },0)
                res_data['OLORUNSOGO 1'].mw = sum;
                res_data['OLORUNSOGO 1'].kv = max_voltage;
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
        }

    })

    return res_data;
}
