import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { validateStudent } from '../middleware/validation.js';

const router = express.Router();

// Get all students (protected)
router.get('/', verifyToken, studentController.getAll);

// Get student by ID
router.get('/:id', verifyToken, studentController.getById);

// Update student
router.put('/:id', verifyToken, validateStudent, studentController.update);

// Delete student
router.delete('/:id', verifyToken, verifyRole(['admin']), studentController.delete);

// Get students by batch
router.get('/batch/:batchId', verifyToken, studentController.getByBatch);

export default router;
