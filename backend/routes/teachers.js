import express from 'express';
import { teacherController } from '../controllers/teacherController.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

const router = express.Router();

// Get all teachers (public)
router.get('/', teacherController.getAll);

// Get teacher by ID
router.get('/:id', teacherController.getById);

// Update teacher (protected)
router.put('/:id', verifyToken, teacherController.update);

// Delete teacher (admin only)
router.delete('/:id', verifyToken, verifyRole(['admin']), teacherController.delete);

export default router;
