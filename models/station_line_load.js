// Step 1: Get all the station name and their statio id 
// Step 2: loop through all the stations and get the 330kv lines for each station in the equipment table with station id
// and level=330 and type=line, store all these in an object with the station as the key,each line as a subkey and an array
// of their values as the values of the subkeys
// Step 3: while looping the lines store their MW and Hour for each key and object in  json
const sll = {
    get_stations: 'SELECT id, name from station_table',
    get_lines: 'SELECT * FROM equipment_table where station_id=$1 AND level=$2 AND type=$3',
    get_line_load: 'SELECT mw, hour FROM power_table WHERE equipment_name=$1 AND level=330 AND type=line ORDER BY hour'
}

exports.module = sll;
