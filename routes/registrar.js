const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
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

module.exports = router;