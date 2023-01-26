const frequency = {
    create: 'INSERT INTO frequency_table(date, time, time_epoch, hz) VALUES($1, $2, $3, $4)', 
    get_history: 'select * from frequency_table where time between $1 and $2 order by time'    
}

// Todo list

module.exports =  frequency;
