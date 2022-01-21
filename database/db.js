const { Pool, Client, Connection } = require('pg');

const pool = new Pool();

module.exports = pool;
