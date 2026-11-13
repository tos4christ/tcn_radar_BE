const { Pool } = require('pg');

// One pool for the whole server. Connection settings come from the standard PG* variables in .env
// (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD): see database/DB_MAINTENANCE.md.
const pool = new Pool({
    keepAlive: process.env.PG_KEEP_ALIVE === 'true',
    max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 100,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 300000
});

// An idle connection that breaks (database restarted, network drop) is reported here and removed
// from the pool; the next query opens a fresh connection by itself. (The earlier code built a new
// pool here that no module ever used, leaking one pool per error.)
pool.on('error', (err) => {
    console.error('❌ Unexpected DB error on an idle connection:', err.code || err.message, '- the next query reconnects.');
});

module.exports = pool;
