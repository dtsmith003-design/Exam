const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Configure Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Connect to the university database
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

// Home page
app.get('/', (req, res) => {
    const role = req.query.role;
    const ID = req.query.ID;

    if (role === 'Student') {
        return res.redirect('/student?ID=' + encodeURIComponent(ID));
    }

    if (role === 'Faculty') {
        return res.redirect('/faculty?ID=' + encodeURIComponent(ID));
    }
    
    if (role === 'Registrar') {
        return res.redirect('/registrar');
    }

    res.render('index', { title: 'University Portal' });
});


app.get('/student', (req, res) => {
    const studentID = req.query.ID;

    const sql = `
        SELECT StdFirstName, StdLastName
        FROM Student
        WHERE StdSSN = ?
    `;

    db.get(sql, [studentID], (err, student) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        if (!student) {
            return res.status(404).send('Student not found');
        }

        const studentName =
            student.StdFirstName + ' ' + student.StdLastName;

        
        const enrollmentSQL = `
            SELECT
                Offering.CourseNo,
                Offering.OffTerm,
                Offering.OffYear,
                Faculty.FacFirstName || ' ' || Faculty.FacLastName AS Instructor,
                Enrollment.EnrGrade
            FROM Enrollment
            JOIN Offering ON Enrollment.OfferNo = Offering.OfferNo
            LEFT JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN
            WHERE Enrollment.StdSSN = ?
            ORDER BY Offering.OffYear, Offering.OffTerm, Offering.CourseNo
        `;

        db.all(enrollmentSQL, [studentID], (err, enrollments) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            
            const offeringsSQL = `
                SELECT
                    Offering.CourseNo,
                    Faculty.FacFirstName || ' ' || Faculty.FacLastName AS Instructor,
                    Offering.OffLocation,
                    Offering.OffTime,
                    Offering.OffDays,
                    CASE
                        WHEN Enrollment.StdSSN IS NOT NULL THEN 'Yes'
                        ELSE 'No'
                    END AS Enrolled
                FROM Offering
                LEFT JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN
                LEFT JOIN Enrollment
                    ON Offering.OfferNo = Enrollment.OfferNo
                    AND Enrollment.StdSSN = ?
                WHERE Offering.OffTerm = 'WINTER'
                AND Offering.OffYear = 2026
                ORDER BY Offering.CourseNo
            `;

            db.all(offeringsSQL, [studentID], (err, offerings) => {
                if (err) {
                    return res.status(500).send(err.message);
                }

                res.render('student', {
                    title: 'Student Dashboard',
                    studentName: studentName,
                    enrollments: enrollments,
                    offerings: offerings
                });
            });
        });
    });
});

app.get('/faculty', (req, res) => {
    const facultyID = req.query.ID;

    const sql = `
        SELECT FacFirstName, FacLastName
        FROM Faculty
        WHERE FacSSN = ?
    `;

    db.get(sql, [facultyID], (err, faculty) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        if (!faculty) {
            return res.status(404).send('Faculty member not found');
        }

        const facultyName =
            faculty.FacFirstName + ' ' + faculty.FacLastName;

        const offeringsSQL = `
            SELECT CourseNo, OffTerm, OffYear
            FROM Offering
            WHERE FacSSN = ?
            ORDER BY OffYear, OffTerm, CourseNo
        `;

        db.all(offeringsSQL, [facultyID], (err, offerings) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.render('faculty', {
                title: 'Faculty Dashboard',
                facultyName: facultyName,
                offerings: offerings
            });
        });
    });
});

app.get('/registrar', (req, res) => {
    const sql = `
        SELECT
            Offering.OfferNo,
            Offering.CourseNo,
            Faculty.FacFirstName || ' ' || Faculty.FacLastName AS Instructor,
            Offering.OffLocation,
            Offering.OffTime,
            Offering.OffDays
        FROM Offering
        LEFT JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN
        WHERE Offering.OffTerm = 'WINTER'
          AND Offering.OffYear = 2026
        ORDER BY Offering.CourseNo, Offering.OfferNo
    `;

    db.all(sql, [], (err, offerings) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        res.render('registrar', {
            title: 'Registrar Dashboard',
            offerings: offerings
        });
    });
});

app.get('/test-students', (req, res) => {
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
app.get('/test-db', (req, res) => {
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

app.get('/test-columns', (req, res) => {
    const tables = ['Student', 'Faculty', 'Course', 'Offering', 'Enrollment'];
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

app.get('/test-faculty', (req, res) => {
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
