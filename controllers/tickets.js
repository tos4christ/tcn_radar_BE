const { Pool } = require("pg");
var model = require('../models/tickets');
// Connecting to a different client
const pool_1 =  new Pool({
    user: 'postgres',
    host: '172.16.200.9',
    database: 'tcn-nas-2',
    password: '000000',
    port: 5432
});      
pool_1.on('error', (err, client) => {
    console.log(err, 'error from pool 2');
});
pool_1.on('connect', () => {
    console.log('connected on pool 1')
});

// Using the second method of query
// pool_1.connect((err, client, done) => {
//     if (err) throw err;
//     client.query('null')
//         .then( resp => {
            
//         })
//         .catch(err => console.log(err))
//         .finally(() => done())
// })

const tickets = {};

tickets.get = (req, res) => {
    const {disco} = req.query;
    pool_1.connect((err, client, done) => {
        if (err) throw err;
        client.query(model.get_all_tickets, [disco])
            .then( resp => {
                const data = resp.rows;
                console.log(data);
                res.send({data});
            })
            .catch(err => console.log(err))
            .finally(() => done())
    });
}
tickets.get_tcn = (req, res) => {
    pool_1.connect((err, client, done) => {
        if (err) throw err;
        client.query(model.get_all_tickets_tcn)
            .then( resp => {
                const data = resp.rows;
                res.send({data});
            })
            .catch(err => console.log(err))
            .finally(() => done())
    });
}

tickets.create = (req, res, next) => {
    const { body } = req;
    const {disco, station, equipment, comment, date, ticket_id, priority } = body;
    pool_1.connect((err, client, done) => {
        if (err) throw err;
        client.query(model.create_ticket,[disco, station, equipment, comment, date, ticket_id, priority])
            .then( resp => {
                const data = resp.rows;
                console.log(data, " THE DATA");
                res.send({data});
            })
            .catch(err => console.log(err))
            .finally(() => done())
    });
}

tickets.update = (req, res, next) => {
    const { body } = req;
    const {disco, station, equipment, comment, date, ticket_id, priority } = body;
    pool_1.connect((err, client, done) => {
        if (err) throw err;
        client.query(model.update_ticket,[station, equipment, comment, priority, disco,  ticket_id])
            .then( resp => {
                const data = resp.rows;
                console.log(data, " THE DATA");
                res.send({data});
            })
            .catch(err => console.log(err))
            .finally(() => done())
    });
}

tickets.update_status = (req, res, next) => {
    const { body } = req;
    const {disco, ticket_id, appr_number, appr_value } = body;
    let query_type, status;
    if(appr_number == 1) {
        query_type = model.update_appr_1;
        if(appr_value == false) {
            status = "declined";
        } else if(appr_value == true) status = "pending";
    };
    if(appr_number == 2) {
        query_type = model.update_appr_2;
        if(appr_value == false) {
            status = "declined";
        } else if(appr_value == true) status = "pending";
    }
    if(appr_number == 3) {
        query_type = model.update_appr_3;
        if(appr_value == false) {
            status = "declined";
        } else if(appr_value == true) status = "approved";
    }
    pool_1.connect((err, client, done) => {
        if (err) throw err;
        client.query(query_type, [appr_value, status,   disco,  ticket_id])
            .then( resp => {
                const data = {};
                data.payload = resp.rows;
                data.status = 'success';
                console.log(data, " THE DATA");
                res.send(data);
            })
            .catch(err => console.log(err))
            .finally(() => done())
    });
}

tickets.delete = (req, res, next) => {
    const { body } = req;
    if (1 == 2) {
        pool_1.query()
        .then(respo => {
            return res.send({res: respo.rows})
        })
        .catch(err => console.log(err))
    }
}

module.exports =  tickets;
