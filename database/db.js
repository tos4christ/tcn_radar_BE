const { Pool } = require('pg');

const pool = new Pool();

pool.on('connect', () => {
    console.log('local db connected')
})

module.exports = pool;
