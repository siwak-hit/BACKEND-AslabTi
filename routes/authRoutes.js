const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login/student', authController.loginStudent);

// Tambahkan baris ini untuk login Guru
router.post('/login/teacher', authController.loginTeacher);

router.post('/logout', authController.logout);

module.exports = router;