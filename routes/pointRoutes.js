const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

// Endpoint: GET /api/points/leaderboard/:classId
router.get('/leaderboard/:classId', verifyToken, isTeacher, pointController.getClassLeaderboard);

module.exports = router;