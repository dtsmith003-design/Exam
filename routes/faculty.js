const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
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
            SELECT OfferNo, CourseNo, OffTerm, OffYear
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
                facultyID: facultyID,
                facultyName: facultyName,
                offerings: offerings
            });
        });
    });
});

router.get('/grades', (req, res) => {
    const facultyID = req.query.ID;
    const offerNo = req.query.OfferNo;

    if (!facultyID || !offerNo) {
        return res.status(400).send('Faculty ID and offering number are required');
    }

    const offeringSQL = `
        SELECT OfferNo, CourseNo, OffTerm, OffYear
        FROM Offering
        WHERE OfferNo = ? AND FacSSN = ?
    `;

    db.get(offeringSQL, [offerNo, facultyID], (err, offering) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        if (!offering) {
            return res.status(404).send('Offering not found for this faculty member');
        }

        const studentsSQL = `
            SELECT
                Student.StdSSN,
                Student.StdFirstName,
                Student.StdLastName,
                Enrollment.EnrGrade
            FROM Enrollment
            JOIN Student ON Enrollment.StdSSN = Student.StdSSN
            WHERE Enrollment.OfferNo = ?
            ORDER BY Student.StdLastName, Student.StdFirstName
        `;

        db.all(studentsSQL, [offerNo], (err, students) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.render('faculty_grades', {
                title: 'Edit Grades',
                facultyID: facultyID,
                offering: offering,
                students: students
            });
        });
    });
});

router.post('/grades/update', (req, res) => {
    const { ID, OfferNo, StdSSN, grade } = req.body;

    if (!ID || !OfferNo || !StdSSN) {
        return res.status(400).send('Missing required information');
    }

    const gradeText = String(grade ?? '').trim();
    const newGrade = Number(gradeText);

    if (
        gradeText === '' ||
        !Number.isFinite(newGrade) ||
        newGrade < 0 ||
        newGrade > 4 ||
        Math.abs(newGrade * 10 - Math.round(newGrade * 10)) > 0.000001
    ) {
        return res.status(400).send('Grade must be between 0.0 and 4.0 in increments of 0.1');
    }

    const updateSQL = `
        UPDATE Enrollment
        SET EnrGrade = ?
        WHERE StdSSN = ?
          AND OfferNo IN (
              SELECT OfferNo
              FROM Offering
              WHERE OfferNo = ? AND FacSSN = ?
          )
    `;

    db.run(updateSQL, [newGrade, StdSSN, OfferNo, ID], function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }

        if (this.changes === 0) {
            return res.status(404).send('Enrollment not found for this faculty offering');
        }

        res.redirect(
            '/faculty/grades?ID=' + encodeURIComponent(ID) +
            '&OfferNo=' + encodeURIComponent(OfferNo)
        );
    });
});

module.exports = router;