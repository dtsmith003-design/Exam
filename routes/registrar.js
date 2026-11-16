const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    const sql = `
        SELECT
            Offering.OfferNo,
            Offering.CourseNo,
            Offering.FacSSN,
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

        const coursesSQL = `
            SELECT CourseNo, CrsDesc, CrsUnits
            FROM Course
            ORDER BY CourseNo
        `;

        const facultySQL = `
            SELECT FacSSN, FacFirstName, FacLastName
            FROM Faculty
            ORDER BY FacLastName, FacFirstName
        `;

        db.all(coursesSQL, [], (err, courses) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            db.all(facultySQL, [], (err, faculty) => {
                if (err) {
                    return res.status(500).send(err.message);
                }

                res.render('registrar', {
                    title: 'Registrar Dashboard',
                    offerings: offerings,
                    courses: courses,
                    faculty: faculty
                });
            });
        });
    });
});

router.post('/add', (req, res) => {
    const {
        OfferNo, CourseNo, FacSSN,
        OffLocation, OffTime, OffDays
    } = req.body;

    const offerNumber = Number(OfferNo);
    const location = String(OffLocation ?? '').trim();
    const time = String(OffTime ?? '').trim();
    const days = String(OffDays ?? '').trim();
    const instructor = FacSSN || null;

    if (
        !Number.isSafeInteger(offerNumber) ||
        offerNumber <= 0 ||
        !CourseNo ||
        !location || location.length > 50 ||
        !time || time.length > 50 ||
        !days || days.length > 20
    ) {
        return res.status(400).send('Invalid offering information');
    }

    db.get(
        'SELECT CourseNo FROM Course WHERE CourseNo = ?',
        [CourseNo],
        (err, course) => {
            if (err) return res.status(500).send(err.message);
            if (!course) return res.status(400).send('Invalid course');

            const insertOffering = () => {
                const sql = `
                    INSERT INTO Offering
                    (OfferNo, CourseNo, OffTerm, OffYear,
                     OffLocation, OffTime, FacSSN, OffDays)
                    VALUES (?, ?, 'WINTER', 2026, ?, ?, ?, ?)
                `;

                db.run(
                    sql,
                    [offerNumber, CourseNo, location, time, instructor, days],
                    function(err) {
                        if (err) {
                            if (err.code === 'SQLITE_CONSTRAINT') {
                                return res.status(400).send(
                                    'Offering number already exists or data violates a database constraint'
                                );
                            }
                            return res.status(500).send(err.message);
                        }

                        res.redirect('/registrar');
                    }
                );
            };

            if (!instructor) {
                return insertOffering();
            }

            db.get(
                'SELECT FacSSN FROM Faculty WHERE FacSSN = ?',
                [instructor],
                (err, faculty) => {
                    if (err) return res.status(500).send(err.message);
                    if (!faculty) {
                        return res.status(400).send('Invalid instructor');
                    }

                    insertOffering();
                }
            );
        }
    );
});

router.get('/edit', (req, res) => {
    const offerNo = req.query.OfferNo;

    if (!offerNo) {
        return res.status(400).send('Offering number is required');
    }

    const offeringSQL = `
        SELECT OfferNo, CourseNo, FacSSN,
               OffLocation, OffTime, OffDays
        FROM Offering
        WHERE OfferNo = ?
          AND OffTerm = 'WINTER'
          AND OffYear = 2026
    `;

    db.get(offeringSQL, [offerNo], (err, offering) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        if (!offering) {
            return res.status(404).send('Winter 2026 offering not found');
        }

        const facultySQL = `
            SELECT FacSSN, FacFirstName, FacLastName
            FROM Faculty
            ORDER BY FacLastName, FacFirstName
        `;

        db.all(facultySQL, [], (err, faculty) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.render('registrar_edit', {
                title: 'Edit Offering',
                offering: offering,
                faculty: faculty
            });
        });
    });
});

router.post('/edit', (req, res) => {
    const { OfferNo, FacSSN, OffLocation, OffTime, OffDays } = req.body;

    const location = String(OffLocation ?? '').trim();
    const time = String(OffTime ?? '').trim();
    const days = String(OffDays ?? '').trim();
    const instructor = FacSSN || null;

    if (
        !OfferNo ||
        !location || location.length > 50 ||
        !time || time.length > 50 ||
        !days || days.length > 20
    ) {
        return res.status(400).send('Invalid offering information');
    }

    const updateOffering = () => {
        const sql = `
            UPDATE Offering
            SET FacSSN = ?,
                OffLocation = ?,
                OffTime = ?,
                OffDays = ?
            WHERE OfferNo = ?
              AND OffTerm = 'WINTER'
              AND OffYear = 2026
        `;

        db.run(
            sql,
            [instructor, location, time, days, OfferNo],
            function(err) {
                if (err) {
                    return res.status(500).send(err.message);
                }

                if (this.changes === 0) {
                    return res.status(404).send('Winter 2026 offering not found');
                }

                res.redirect('/registrar');
            }
        );
    };

    if (!instructor) {
        return updateOffering();
    }

    db.get(
        'SELECT FacSSN FROM Faculty WHERE FacSSN = ?',
        [instructor],
        (err, faculty) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            if (!faculty) {
                return res.status(400).send('Invalid instructor');
            }

            updateOffering();
        }
    );
});

router.post('/cancel', (req, res) => {
    const offerNo = req.body.OfferNo;

    if (!offerNo) {
        return res.status(400).send('Offering number is required');
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            const rollback = (status, message) => {
                db.run('ROLLBACK', (rollbackErr) => {
                    if (rollbackErr) {
                        console.error('Rollback failed:', rollbackErr);
                    }
                    res.status(status).send(message);
                });
            };

            const checkSQL = `
                SELECT OfferNo
                FROM Offering
                WHERE OfferNo = ?
                  AND OffTerm = 'WINTER'
                  AND OffYear = 2026
            `;

            db.get(checkSQL, [offerNo], (err, offering) => {
                if (err) {
                    return rollback(500, err.message);
                }

                if (!offering) {
                    return rollback(404, 'Winter 2026 offering not found');
                }

                db.run(
                    'DELETE FROM Enrollment WHERE OfferNo = ?',
                    [offerNo],
                    (err) => {
                        if (err) {
                            return rollback(500, err.message);
                        }

                        const deleteSQL = `
                            DELETE FROM Offering
                            WHERE OfferNo = ?
                              AND OffTerm = 'WINTER'
                              AND OffYear = 2026
                        `;

                        db.run(deleteSQL, [offerNo], function(err) {
                            if (err) {
                                return rollback(500, err.message);
                            }

                            if (this.changes === 0) {
                                return rollback(404, 'Offering not found');
                            }

                            db.run('COMMIT', (err) => {
                                if (err) {
                                    return rollback(500, err.message);
                                }

                                res.redirect('/registrar');
                            });
                        });
                    }
                );
            });
        });
    });
});

module.exports = router;