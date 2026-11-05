const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
// Connect to the university database
require('./db');

// Import routes
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const registrarRoutes = require('./routes/registrar');
const testRoutes = require('./routes/test');

// Configure Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

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

    res.render('index', {
        title: 'University Portal'
    });
});

// Connect routes
app.use('/student', studentRoutes);
app.use('/faculty', facultyRoutes);
app.use('/registrar', registrarRoutes);
app.use('/', testRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});