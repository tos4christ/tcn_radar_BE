const mssql = require("mssql");
const mydb = require("../database/db"); // <- your pg Pool
var model = require("../models/lines");
var dateFormatter = require('../utility/dateFormatter');
var refined_stations = require('../database/nsong_stations');
const axios = require('axios');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: {
        port: Number(process.env.MSSQL_PORT),
        encrypt: true,
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true
    }
};

mssql.connect(config, err => {
    console.log(' It has connected');
    if (err) {
        console.error(err.stack);
        return;
    }
    var request = new mssql.Request();

    const nsongdb = async () => {
        console.log(Date(), 'the nsong function just activated now');
        const { date, Hour, Minute } = dateFormatter();

        try {
            // 🔹 Query PostgreSQL without connect()
            const respo = await mydb.query(model.get_nsong_2, [
                date,
                Number(Hour),
                Number(Minute),
                (Number(Minute) + 5),
                0,
                59
            ]);

            console.log(Date(), 'this is the time the query completed');
            const data = respo.rows;

            // filter stations
            const stationHold = [];
            const filteredStationArray = data.filter(station => {
                const condition = !stationHold.includes(station.station + '-' + station.line_name);
                stationHold.push(station.station + '-' + station.line_name);
                return condition;
            });

            const refine_stations = refined_stations(filteredStationArray);
            const mappedObj = Object.entries(refine_stations);
            const tempArr = mappedObj.map(obj => obj[1]);
            const finalArray = tempArr.filter(tar => tar.seconds !== null);

            console.log(finalArray, 'the final array without null');

            finalArray.forEach(dt => {
                const { station, kv, mw, amp, time, mvar } = dt;
                const stations = {
                    "RIVERS IPP (GAS)" :       1,
                    "AFAM VI (GAS/STEAM)" :    2,
                    "GEREGU (GAS)" :           3,
                    "OMOTOSHO (GAS)" :         4,
                    "OMOTOSHO NIPP (GAS)" :    5,
                    "JEBBA (HYDRO)" :          6,
                    "SAPELE NIPP (GAS)" :      7,
                    "OMOKU (GAS)" :            8,
                    "AZURA-EDO IPP (GAS)" :    9,
                    "OKPAI (GAS/STEAM)" :     10,
                    "GEREGU NIPP (GAS)" :     11,
                    "GBARAIN NIPP (GAS)" :    12,
                    "DADINKOWA G.S (HYDRO)" : 13,
                    "PARAS ENERGY (GAS)" :    14,
                    "IBOM POWER (GAS)" :      15,
                    "EGBIN (STEAM)":          16,
                    "OLORUNSOGO (GAS)":       17,
                    "OLORUNSOGO NIPP":        18,
                    "SAPELE (STEAM)" :        19,
                    "ODUKPANI NIPP (GAS)" :   20,
                    "ALAOJI NIPP (GAS)" :     21,
                    "IHOVBOR NIPP (GAS)" :    22,
                    "TRANS-AMADI (GAS)" :     23,
                    "DELTA (GAS)" :           24,
                    "KAINJI (HYDRO)":         25,
                    "SHIRORO (HYDRO)":        26,
                    "AFAM IV & V (GAS)":      27,
                    "ZUNGERU GS":             28,
                    "TAOPEX GS":              29,
                };

                const table = new mssql.Table('generation');
                table.create = false;
                table.columns.add('gencoid', mssql.Int);
                table.columns.add('genconame', mssql.Text);
                table.columns.add('gentime', mssql.BigInt);
                table.columns.add('gendate', mssql.Date);
                table.columns.add('amp', mssql.Float);
                table.columns.add('kv', mssql.Float);
                table.columns.add('genhour', mssql.Int);
                table.columns.add('genminute', mssql.Int);
                table.columns.add('genseconds', mssql.Int);
                table.columns.add('mw', mssql.Float);
                table.columns.add('mvar', mssql.Float);

                if (stations[station]) {
                    table.rows.add(stations[station], station, time, date, amp, kv, Hour, Minute, 0, mw, mvar);
                    request.bulk(table, (err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log('the record was inserted successfully at ' + new Date());
                    });
                }
            });
        } catch (err) {
            console.error("❌ Error running nsong query:", err);
        }
    };

    // scheduling logic (same as before)
    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');    
    const Hour = time.split(':')[0];
    const Minute = time.split(':')[1];
    const Seconds = time.split(':')[2];

    const extraMinute = (14 - (Number(Minute) % 15)) * 60 * 1000;
    const extraSeconds = Number(Seconds) * 1000;
    const totalTimeOut = extraMinute + extraSeconds;

    console.log(totalTimeOut, 'the total timeout');
    setTimeout(() => {
        nsongdb();
        return setInterval(nsongdb, 900000); // 15 mins
    }, totalTimeOut);
});
