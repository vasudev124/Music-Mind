const { Pool } = require('pg');

// Create a new pool instance using environment variables
// Centralized config: relies on process.env loaded by server.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // Required for Neon/Heroku
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};
