const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool instance using environment variables
// Make sure your .env has DATABASE_URL or specific PGHOST, PGUSER, etc.
// Create a new pool instance
// Prefers DATABASE_URL for Neon.tech/Cloud setups, otherwise falls back to individual vars
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If you are using individual variables, you can keep them as fallbacks or remove connectionString
    // user: process.env.PGUSER,
    // host: process.env.PGHOST, 
    // ...
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // Required for Neon/Heroku
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};
