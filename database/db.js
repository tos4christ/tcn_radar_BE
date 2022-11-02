const { Pool } = require('pg');

const pool = new Pool({
    password: '000000',
    user: 'postgres',
    database: 'tcn_nas',
    port: 5432,
    host: 'localhost'
});

pool.on('connect', () => {
    // console.log('local db connected')
})

module.exports = pool;
