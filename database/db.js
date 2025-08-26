const { Pool } = require('pg');

let pool = new Pool({
    keepAlive: process.env.PG_KEEP_ALIVE === 'true',
    max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 100,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 300000
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected DB error:', err.code || err.message);
    if (['ECONNRESET', 'EHOSTUNREACH', 'ETIMEDOUT'].includes(err.code)) {
      console.log(`🔄 Retrying DB connection in ${process.env.DB_RETRY_DELAY_MS || 5000}ms...`);
      setTimeout(() => {
        pool = new Pool({
            keepAlive: process.env.PG_KEEP_ALIVE === 'true',
            max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 100,
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 30000
        });
      }, parseInt(process.env.DB_RETRY_DELAY_MS, 10) || 5000);
    }
})

module.exports = pool;
