const tickets = {
    create_ticket: 'INSERT INTO tickets_table(disco, station, equipment, comment, date, ticket_id, status, priority) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    update_ticket: 'UPDATE tickets_table SET station=$1, equipment=$2, comment=$3, priority=$4 where disco=$5 and ticket_id=$6',
    update_appr_1: 'UPDATE tickets_table SET appr_one=$1, status=$2 where disco=$3 and ticket_id=$4',
    update_appr_2: 'UPDATE tickets_table SET appr_two=$1, status=$2 where disco=$3 and ticket_id=$4',
    update_appr_3: 'UPDATE tickets_table SET appr_three=$1, status=$2 where disco=$3 and id=$4',
    get_all_tickets_disco: 'select * from tickets_table where disco=$1',
    get_all_tickets_tcn: 'select * from tickets_table',
    get_pending_tickets: 'select * from tickets_table where disco=$1 and status=$2',   
    delete_ticket: 'delete from lines_table where station=$1 and equipent=$2',
    
}

module.exports =  tickets;
