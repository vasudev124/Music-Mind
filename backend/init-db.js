const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        await db.query(schemaSql);
        console.log('✅ Database initialized successfully!');
    } catch (err) {
        console.error('❌ Error initializing database:', err);
    } finally {
        process.exit();
    }
}

initDb();
