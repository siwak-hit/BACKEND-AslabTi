const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

// Endpoint: POST /api/sessions/init
// Hanya Guru yang bisa menyiapkan sesi
router.post('/init', verifyToken, isTeacher, sessionController.initLiveSession);
router.post('/throw-question', verifyToken, isTeacher, sessionController.throwQuestion);
router.post('/raise-hand', verifyToken, sessionController.raiseHand);

// Endpoint Guru
router.post('/start-timer', verifyToken, isTeacher, sessionController.startTimer);
router.post('/evaluate', verifyToken, isTeacher, sessionController.evaluateAnswer);

// Endpoint Mahasiswa
router.post('/tap-timer', verifyToken, sessionController.tapTimer);
router.post('/buy-hint', verifyToken, sessionController.buyHint);

module.exports = router;