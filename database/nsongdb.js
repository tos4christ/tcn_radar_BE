const mssql = require("mssql");
const mydb = require("../database/db");
const queryString = require("../models/lines");
var model = require("../models/lines");
var dateFormatter = require('../utility/dateFormatter');
var refined_stations = require('../database/nsong_stations');
const { Pool } = require('pg');
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
}

// Connecting to a different client
// const db_2 =  new Pool({
//     user: 'postgres',
//     host: '172.16.200.9',
//     database: 'tcn-nas-2',
//     password: '000000',
//     port: 5432
//   });
        
//   db_2.on('error', (err, client) => {
//     console.log(err, 'error from pool 2');
//   })
//   db_2.on('connect', () => {
//     console.log('connected on pool 2')
//   })

mssql.connect(config, err => {
    console.log(' It has connected')
    if(err) {
        console.error(err.stack);
        return;
    }
    // create a Request Object
    var request = new mssql.Request();
    // Create the function that will be supplied to setTimeout as an input to setInterval
    const nsongdb = () => {
        console.log( Date(), 'the nsong function just activated now');
        const {date, Hour} = dateFormatter();     
        // connect to my local db to get items to save on the nsong platform
        // get all the data for the given time and order them by station  
        mydb.connect((err, client, done) => {
            if (err) throw err;
            client.query(model.get_nsong_2, [ date, Number(Hour), 0, 5, 0, 59])
            .then(respo => {
                console.log(Date(), 'this is the time the query completed');
                const data = respo.rows;  
                console.log(data, data.length, 'the raw data');
                // filter the data to return only one station for each
                const stationHold = [];
                const filteredStationArray = data.filter( station => {
                    const condition = !stationHold.includes(station.station+'-'+station.line_name);
                    stationHold.push(station.station+'-'+station.line_name)
                    return condition;
                });
                // console.log(filteredStationArray, filteredStationArray.length, 'the filtered station ')
                const refine_stations = refined_stations(filteredStationArray);
                // console.log(refine_stations, 'the refined station')
                const mappedObj = Object.entries(refine_stations)
                // console.log(mappedObj, 'the mapped object');
                const tempArr = []
                mappedObj.forEach(obj => {                
                    const value = obj[1]               
                    tempArr.push(value)
                })  
                const finalArray = tempArr.filter( tar => tar.seconds !== null);
                console.log(finalArray, 'the final array without null');
                finalArray.forEach(dt => {
                    const { station, kv, mw, amp, time, seconds, mvar } = dt;
                    // match the station name to the station id
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
                    }
                    // Create a temporary table
                    const table = new mssql.Table('generation');
                    table.create = false; // Table already exists.
                    // Add tables with columns as it corresponds to the database
                    // declare the type of the columns
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
                    // Add corresponding row values to the column in similar order                    
                    if(stations[station]) {
                        table.rows.add(stations[station], station, time, date, amp, kv, Hour, 0, 0, mw, mvar);
                        request.bulk(table, (err, record, rows) => {
                            if(err) {
                                console.error(err)
                                return;
                            }
                            console.log('the record was inserted successfully at ' + new Date)
                        });
                    }
                });
            })
            .catch(err => console.log(err))
            .finally(() => done())
        }) 
        // mydb.query(model.get_nsong_2, [ date, Number(Hour), 0, 5, 0, 59])
        //     .then(respo => {
        //         console.log(Date(), 'this is the time the query completed');
        //         const data = respo.rows;  
        //         // console.log(JSON.stringify(data), data.length, Hour, 'the raw data')
        //         // filter the data to return only one station for each
        //         const stationHold = [];
        //         const filteredStationArray = data.filter( station => {
        //             const condition = !stationHold.includes(station.station+'-'+station.line_name);
        //             stationHold.push(station.station+'-'+station.line_name)
        //             return condition;
        //         });
        //         // console.log(filteredStationArray, filteredStationArray.length, 'the filtered station ')
        //         const refine_stations = refined_stations(filteredStationArray);
        //         // console.log(refine_stations, 'the refined station')
        //         const mappedObj = Object.entries(refine_stations)
        //         // console.log(mappedObj, 'the mapped object');
        //         const tempArr = []
        //         mappedObj.forEach(obj => {                
        //             const value = obj[1]               
        //             tempArr.push(value)
        //         })  
        //         const finalArray = tempArr.filter( tar => tar.seconds !== null);
        //         console.log(finalArray, 'the final array without null');
        //         finalArray.forEach(dt => {
        //             const { station, kv, mw, amp, time, seconds, mvar } = dt;
        //             // match the station name to the station id
        //             const stations = {
        //                 "RIVERS IPP (GAS)" :       1,
        //                 "AFAM VI (GAS/STEAM)" :    2,
        //                 "GEREGU (GAS)" :           3,
        //                 "OMOTOSHO (GAS)" :         4,
        //                 "OMOTOSHO NIPP (GAS)" :    5,
        //                 "JEBBA (HYDRO)" :          6,
        //                 "SAPELE NIPP (GAS)" :      7,
        //                 "OMOKU (GAS)" :            8,
        //                 "AZURA-EDO IPP (GAS)" :    9,
        //                 "OKPAI (GAS/STEAM)" :     10,
        //                 "GEREGU NIPP (GAS)" :     11,
        //                 "GBARAIN NIPP (GAS)" :    12,
        //                 "DADINKOWA G.S (HYDRO)" : 13,
        //                 "PARAS ENERGY (GAS)" :    14,
        //                 "IBOM POWER (GAS)" :      15,
        //                 "EGBIN (STEAM)":          16,
        //                 "OLORUNSOGO (GAS)":       17,
        //                 "OLORUNSOGO NIPP":        18,
        //                 "SAPELE (STEAM)" :        19,
        //                 "ODUKPANI NIPP (GAS)" :   20,
        //                 "ALAOJI NIPP (GAS)" :     21,
        //                 "IHOVBOR NIPP (GAS)" :    22,
        //                 "TRANS-AMADI (GAS)" :     23,
        //                 "DELTA (GAS)" :           24,
        //                 "KAINJI (HYDRO)":         25,
        //                 "SHIRORO (HYDRO)":        26,
        //                 "AFAM IV & V (GAS)":      27,
        //             }
        //             // Create a temporary table
        //             const table = new mssql.Table('generation');
        //             table.create = false; // Table already exists.
        //             // Add tables with columns as it corresponds to the database
        //             // declare the type of the columns
        //             table.columns.add('gencoid', mssql.Int);
        //             table.columns.add('genconame', mssql.Text);
        //             table.columns.add('gentime', mssql.BigInt);
        //             table.columns.add('gendate', mssql.Date);
        //             table.columns.add('amp', mssql.Float);
        //             table.columns.add('kv', mssql.Float);
        //             table.columns.add('genhour', mssql.Int);
        //             table.columns.add('genminute', mssql.Int);
        //             table.columns.add('genseconds', mssql.Int);
        //             table.columns.add('mw', mssql.Float);
        //             table.columns.add('mvar', mssql.Float);
        //             // Add corresponding row values to the column in similar order                    
        //             if(stations[station]) {
        //                 table.rows.add(stations[station], station, time, date, amp, kv, Hour, 00, 0, mw, mvar);
        //                 request.bulk(table, (err, record, rows) => {
        //                     if(err) {
        //                         console.error(err)
        //                         return;
        //                     }
        //                     console.log('the record was inserted successfully at ' + new Date)
        //                 });
        //             }
        //         });
        //     })
        //     .catch(err => console.log(err));

        // mydb.end();
    }

    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');    
    const Hour = time.split(':')[0];
    const Minute = time.split(':')[1];
    const Seconds = time.split(':')[2];

    // nsongdb();

    // get the amount of time needed to get to 10seconds of the next hour
    const extraMinute = (62 - Number(Minute))*60*1000
    const extraSeconds = (90 - Number(Seconds))*1000;
    const totalTimeOut = extraMinute + extraSeconds;
    console.log(totalTimeOut, 'the total timeout');
    setTimeout(
        () => {
        nsongdb();         
        return setInterval(            
                    () => {
                        nsongdb();
                    }
                    , 3600000)},
                totalTimeOut);
})
