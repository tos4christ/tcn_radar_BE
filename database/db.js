const { Pool } = require('pg');

const pool = new Pool({});

pool.on('error', (err, client) => {
    console.log(err, 'error from pool 1')
})

module.exports = pool;
