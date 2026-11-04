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

module.exports = router;