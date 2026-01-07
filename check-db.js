const db = require('./db');

async function checkUser() {
    try {
        console.log('Checking database for users...');
        const res = await db.query('SELECT * FROM users');
        console.log('Users found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('User Record:', res.rows[0]);
        }
    } catch (err) {
        console.error('Error checking DB:', err);
    } finally {
        process.exit();
    }
}

checkUser();
