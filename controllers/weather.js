const { Pool } = require("pg");
var model = require('../models/weather');
var pool_1 = require('../database/db');
const { default: axios } = require('axios');
const epochConverter = require('../utility/epochConverter');
var XLSX = require('xlsx');
const stations = [
    "Aba TS", "Afam TS", "Aja Area Control", "Ajaokuta Area Control", `Akangba 330`, "Akure 132KV TS", `Gwagwalada`, `ALAOJI PS`,
    "Akwanga TS", `Alagbon 132`, `Alaoji TS`, `Apo 132`, `Asaba 132KV`, `Ayede`, `Bauchi`, `Benin Main`, `Ijora 132KV`, `DELTA GS`,
    `Bida TS`, `Birnin Kebbi`, `Calabar TS`, `Delta TS`, `Egbin 330`, `Ganmo Area Control`, `Gombe Area Control`, `OMOKU PS`,
    `Ikeja W Area Control`, `Ikorodu 132KV`, `Ilupeju 132KV TS`, `Iwo Area Control`, `Jericho 132KV TS`, `Jos Area Control`, `Katampe 330`,
    `Katsina TS`, `Lokoja 132KV`, `Maiduguri TS`, `Minna TS`, `New haven`, `Nkalagu`, `Obajana 330KV`, `Ondo 132KV TS`, `Onitsha`,
    `Osogbo TS`, `Papalanto TS`, `PH Main`, `Shiroro Area Control`, `Sokoto TS`, `Suleja TS`, `Tegina TS`, `GEREGU PS`, `DADINKOWA GS`, 
    `KAINJI HYDRO`, `JEBBA HYDRO`, `SHIRORO HYDRO`, `EGBIN PS`, `OLORUNSOGO PS`, `OMOTOSHO PS`, `GBARAIN PS`, `AZURA EDO IPP`, `AFAM VI PS`
    ];

function sortWeather(weather_data=[]) {
    // Sort all the data according to station in ascending order
    const station_container = {};
    stations.forEach(station => {
        const station_data = weather_data.filter(items => [`${station}`].includes(items.station_name));
        if(station_data[0]) {
        const station_name = station_data[0].station_name;
        station_container[station_name] = station_data;
        }
    });
    const station_keys = Object.keys(station_container);
    const stations_array = [];
    let weather_timeline = [];
    let station_weather_report = {};
    let start_time = '', end_time = '';
    station_keys.forEach(station => {
        const current_station = station_container[station].sort((a,b) => a.time < b.time);
        current_station.sort((a,b) => a.time < b.time).forEach((item, index, array) => {
        const next_data = array[index+1];
        if(next_data) {      
            // check if it starts with rainfall        
            if(array[0].main_weather == "Rain" && index == 0) {
            start_time = array[0].time;
            } else if(item.main_weather !== "Rain" && next_data.main_weather == "Rain" && index > 0) {
            // condition to pick a start
            start_time = next_data.time;
            }
            // condition to pick a stop
            if(item.main_weather == "Rain" && next_data.main_weather !== "Rain" && index > 0) {
            end_time = next_data.time;
            }
            if(end_time.length > 0 && start_time.length > 0) {
                const time_obj = epochConverter(start_time, end_time, "weather");
                const duration_epoch = Math.round((end_time - start_time)/60) + " minutes";
                const time_line_array = {START_DATE: time_obj.start_date, START_TIME: time_obj.rainfall_start_time,
                    START_MW: " ", END_DATE: time_obj.end_date, END_TIME: time_obj.rainfall_end_time, END_MW: " ",
                    duration_of_rainfall: duration_epoch, MAIN_TEMP: item.main_temperature,  RAIN_VOLUME_1H: item.rain_volume_1h,
                    HUMIDITY: item.main_humidity, WIND_SPEED: item.wind_speed, MW_INTERRUPTED: " "};
                weather_timeline.push(time_line_array);
                start_time = '';
                end_time = '';
            }        
        }
        });
        station_weather_report[station] = weather_timeline;
        stations_array.push(station_weather_report);
        station_weather_report = {};
        weather_timeline = [];
    });
    // console.log("station_weather_report  " , station_weather_report); 
    // console.log("stations_array   ", stations_array);   
    return stations_array;
}

const weather = {};

weather.getStations = (req, res, next) => {
    pool_1.query(model.get_station_coords)
        .then( resp => {
            const stations = resp.rows;
            res.send({stations});
        });
}

weather.getWeather = async (req, res, next) => {
    const { lat, lon } = req.body;
    const daily_count = 16;
    try {
        // First get all the URLs you want to hit
        // const onecall_url_3 = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${long}&exclude=minutely,hourly&appid=${process.env.WEATHER_API}`;
        const onecall_current_url_2 = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API}&units=metric`;
        const onecall_3hourly_url_2 = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API}&units=metric`;
        const onecall_daily_url_2 = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=${daily_count}&appid=${process.env.WEATHER_API}&units=metric`;
        
        const response_1 = await axios.get(onecall_current_url_2);
        const response_2 = await axios.get(onecall_3hourly_url_2);
        const response_3 = await axios.get(onecall_daily_url_2);  
        const data = {current: response_1.data, hourly: response_2.data, daily: response_3.data};
        res.send({data})
    } catch (e_1) {
        return console.error(e_1);
    }
      
}

weather.getWeather_report = async (req, res, next) => {
    const { startDate } = req.body;
    try {
        pool_1.query(model.get_weather_data_main, [startDate])
        .then( resp => {
            const weather_report = resp.rows;
            const result = sortWeather(weather_report);
            // Create a new workbook
            const workbook = XLSX.utils.book_new();
            result.forEach( (temp) => {
                const key = Object.keys(temp)[0];
                const worksheet = XLSX.utils.json_to_sheet(temp[key])
                XLSX.utils.book_append_sheet(workbook, worksheet, key);
            });            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            // res.setHeader("Content-Disposition", "attachment; filename=" + 'tem');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); 
            res.attachment('weather.xlsx');
            res.send(buffer);
        });
    } catch (e_1) {
        return console.error(e_1);
    }      
}

module.exports =  weather;
