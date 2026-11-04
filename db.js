const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
    path.join(__dirname, 'univdb.sqli'),
    sqlite3.OPEN_READONLY,
    (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
        } else {
            console.log('Connected to the university database!');
        }
    }
);

module.exports = db;
