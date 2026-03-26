const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parsing JSON body
app.use(express.urlencoded({ extended: true }));

// Import Routes (Kita buat contoh route untuk kelas nanti)
const classRoutes = require('./routes/classRoutes');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const pointRoutes = require('./routes/pointRoutes');

// Gunakan Routes
app.use('/api/classes', classRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/points', pointRoutes);

// Basic route untuk test ping
app.get('/', (req, res) => {
    res.json({ message: "Backend Aslab API berjalan lancar!" });
});

module.exports = app;