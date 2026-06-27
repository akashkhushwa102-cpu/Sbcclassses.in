import express from 'express';
import { TeacherPaymentController } from '../controllers/teacherPaymentController.js';

const router = express.Router();

// ====================================
// TEACHER PAYMENT ROUTES
// ====================================

// Get all teacher payments (admin)
router.get('/', TeacherPaymentController.getAllPayments);

// Get statistics
router.get('/stats', TeacherPaymentController.getStats);

// Get payments for specific teacher
router.get('/teacher/:teacherId', TeacherPaymentController.getTeacherPayments);

// Get specific payment
router.get('/:paymentId', TeacherPaymentController.getPaymentById);

// Create payment
router.post('/create', TeacherPaymentController.createPayment);

// Update payment
router.put('/:paymentId', TeacherPaymentController.updatePayment);

// Delete payment (only pending/failed)
router.delete('/:paymentId', TeacherPaymentController.deletePayment);

export default router;
