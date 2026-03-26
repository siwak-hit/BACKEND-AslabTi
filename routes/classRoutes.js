const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

// GET /api/classes
router.get('/', classController.getClasses);

// POST /api/classes
router.post('/', classController.addClass);

router.put('/:id', verifyToken, isTeacher, classController.editClass);
router.delete('/:id', verifyToken, isTeacher, classController.removeClass);

module.exports = router;