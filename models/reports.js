const reports = {
    create: 'INSERT INTO reports(date, feederName, reportType, partyResponsible, event, dateout, timeout, datein, timein, comment, status) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    update: 'UPDATE current_table SET amp=$1 where current_id=$2',
    get: 'SELECT * FROM reports WHERE date=$1',
}

module.exports =  reports;
