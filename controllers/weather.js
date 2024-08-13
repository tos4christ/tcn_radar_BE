const { Pool } = require("pg");
var model = require('../models/weather');
var pool_1 = require('../database/db');
const { default: axios } = require('axios');

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
            res.send({weather_report});
        });
    } catch (e_1) {
        return console.error(e_1);
    }      
}

module.exports =  weather;
