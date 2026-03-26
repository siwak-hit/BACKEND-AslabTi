const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

// Endpoint ini HANYA BISA diakses jika membawa Token valid DAN rolenya 'teacher'
router.post('/add-student', verifyToken, isTeacher, teacherController.addStudentToClass);
router.post('/add-students-bulk', verifyToken, isTeacher, teacherController.addStudentsBulk);

router.delete('/kick-student', verifyToken, isTeacher, teacherController.kickStudent);

module.exports = router;