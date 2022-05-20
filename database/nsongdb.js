const mssql = require("mssql");
const mydb = require("../database/db");
const queryString = require("../models/lines");
var model = require("../models/lines");

const config = {
    user: 'remoter',
    password: 'remoter@1$',
    server: '172.16.200.200',
    database: 'VPNIOT',
    options: {
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true
    }
}

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
        const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
        var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');    
        const Hour = time.split(':')[0];
        
        // connect to my local db to get items to save on the nsong platform        
        // get all the data for the given time and order them by station   
        mydb.query(model.get_nsong, [ date, Number(Hour), 0, 0, 10])
            .then(respo => {
                const data = respo.rows;
                // filter the data to return only one station for each
                const stationHold = [];
                const filteredStationArray = data.filter( station => {
                    const condition = !stationHold.includes(station.station);
                    stationHold.push(station.station);
                    return condition;
                })
                console.log(filteredStationArray, 'the filtered station');
                filteredStationArray.forEach(dt => {
                    const { station, kv, mw, amp, time, seconds, mvar } = dt;

                    // match the station name to the station id
                    const stations = {                       
                        "eket" : 109,
                        "phMain" : 108,
                        "afamViTs" : 2,
                        "alaoji" : 21,
                        "lokojaTs" : 103,
                        "sapeleNippPs" : 7,
                        "SAPELE STEAM" : 19,
                        "omotoshoNippPs" : 5,
                        "odukpaniGs" : 20,
                        "omotosho1" : 4,
                        "delta3" : 6,
                        "ekim" : 107,
                        "gereguPs" : 3,
                        "ikotEkpene" : 101,
                        "riversIppPs" : 1,
                        "gwagwalada" : 102,
                        "omokuGs" : 8,
                        "ihovborNippPs" : 22,
                        "OLORUNSOGO GAS": 17,
                        "olorunsogo1": 18,
                        "ugwuaji" : 106,
                        "ugwuaji" : 105,
                        "asaba" : 104,
                        "ihovborNippPs" : 9,
                        "phMain" : 10,
                        "GEREGU NIPP" : 11,
                        "GBARAIN" : 12,
                        "DADIN-KOWA HYDRO" : 13,
                        "PARAS ENERGY" : 14,
                        "IBOM POWER" : 15,
                        "delta2" : 16
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
                    table.rows.add(stations[station], station, time, date, amp, kv, Hour, 0, seconds, mw, mvar);
                    request.bulk(table, (err, record, rows) => {
                        if(err) {
                            console.error(err)
                            return;
                        }
                        console.log('the record was inserted successfully at ' + new Date)
                    });
                });
                
            })
            .catch(err => console.log(err))
    }

    const time = new Date().toLocaleTimeString("en-GB").split(' ')[0];
    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleDateString("en-GB", options).split('/').reverse().join('-');    
    const Hour = time.split(':')[0];
    const Minute = time.split(':')[1];
    const Seconds = time.split(':')[2];

    // nsongdb();

    // get the amount of time needed to get to 10seconds of the next hour
    const extraMinute = (59 - Number(Minute))*60*1000
    const extraSeconds = (70 - Number(Seconds))*1000;
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