const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Endpoint: POST /api/meetings (Bikin Pertemuan)
router.post('/', verifyToken, isTeacher, meetingController.addMeeting);

// Endpoint: POST /api/meetings/upload (Upload modul, pastikan key form-data nya bernama 'file')
router.post('/upload', verifyToken, isTeacher, upload.single('file'), meetingController.uploadMaterial);

module.exports = router;