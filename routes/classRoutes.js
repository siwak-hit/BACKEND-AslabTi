const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

// GET /api/classes (Semua kelas)
router.get('/', classController.getClasses);

// GET /api/classes/:id (Ambil detail 1 kelas) --> TAMBAHKAN BARIS INI
router.get('/:id', classController.getClassById);

// POST /api/classes
router.post('/', classController.addClass);

router.put('/:id', verifyToken, isTeacher, classController.editClass);
router.delete('/:id', verifyToken, isTeacher, classController.removeClass);

module.exports = router;