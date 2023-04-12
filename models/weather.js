const lines = {
    create: `INSERT INTO 
                weather_table(date, time, station_name, lon, lat, main_weather, weather_id, 
                    main_weather_description, weather_icon, main_temperature, ambient_temperature,
                    main_pressure, main_humidity, wind_speed, wind_degree, wind_gust) 
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    get_station_coords: `SELECT * from station_coords_2`,
    
}


// Todo list
// add one to the month and check if needed in the hour in order to make 
// the month and hour correspond in the view
module.exports =  lines;
