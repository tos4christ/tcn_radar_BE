const { Pool } = require("pg");
var model = require('../models/weather');
var pool_1 = require('../database/db');

const weather = {};

weather.getStations = (req, res, next) => {

    pool_1.query(model.get_station_coords)
        .then( resp => {
            const stations = resp.rows;
            res.send({stations});
        });
}

module.exports =  weather;
