const epochConverter = (start, end, type) => {
    // type = {weather, lines, frequency}
    const start_time = type == 'weather' ? start*1000 : type == 'lines' || type == 'frequency' ? start : 0;
    const end_time = type == 'weather' ? end*1000 : type == 'lines' || type == 'frequency' ? end : 0;
    const utcDate_start = new Date(start_time);
    const utcDate_end = new Date(end_time);
    // Start
    const start_year = utcDate_start.getFullYear(); //2024
    const start_month = utcDate_start.getMonth() + 1; // 5
    const start_day_of_month = utcDate_start.getDate(); // 31
    const start_hour = utcDate_start.getHours(); // 23
    const start_minute = utcDate_start.getMinutes(); // 58
    const start_seconds = utcDate_start.getSeconds();  // 16
    // End
    const end_hour = utcDate_end.getHours(); // 23
    const end_minute = utcDate_end.getMinutes(); // 58
    const end_seconds = utcDate_end.getSeconds();  // 16
    const end_year = utcDate_start.getFullYear(); //2024
    const end_month = utcDate_start.getMonth() + 1; // 5
    const end_day_of_month = utcDate_start.getDate(); // 31
    // return data
    const start_date = `${start_day_of_month}-${start_month}-${start_year}`;
    const end_date = `${end_day_of_month}-${end_month}-${end_year}`;
    const rainfall_start_time = `${start_hour}:${start_minute}:${start_seconds}`;
    const rainfall_end_time = `${end_hour}:${end_minute}:${end_seconds}`;
    // Return time and date components
    return {start_date, end_date, rainfall_start_time, rainfall_end_time};
}
module.exports = epochConverter;
