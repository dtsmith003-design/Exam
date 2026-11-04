const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
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

module.exports = router;