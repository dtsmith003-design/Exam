const express = require('express');
const router = express.Router();
const db = require('../db');

// Test students
router.get('/test-students', (req, res) => {
    const sql = `
        SELECT StdSSN, StdFirstName, StdLastName
        FROM Student
        LIMIT 5
    `;

    db.all(sql, [], (err, students) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        res.json(students);
    });
});

// Test database connection
router.get('/test-db', (req, res) => {
    db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.json(rows);
        }
    );
});

// Test database columns
router.get('/test-columns', (req, res) => {
    const tables = [
        'Student',
        'Faculty',
        'Course',
        'Offering',
        'Enrollment'
    ];

    const results = {};
    let completed = 0;

    tables.forEach((table) => {
        db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            results[table] = rows.map(row => row.name);
            completed++;

            if (completed === tables.length) {
                res.json(results);
            }
        });
    });
});

// Test faculty
router.get('/test-faculty', (req, res) => {
    db.all(
        `SELECT FacSSN, FacFirstName, FacLastName
         FROM Faculty
         LIMIT 5`,
        [],
        (err, faculty) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.json(faculty);
        }
    );
});

module.exports = router;