import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  myActive, myAccess, adminList, adminGrant, adminExtend, adminCancel,
} from '../controllers/subscriptionController.js';

const router = Router();
router.use(requireAuth);

// Student
router.get('/me', myActive);
router.get('/me/access/:batchId', myAccess);

// Admin
router.get('/admin', requireRole('admin'), adminList);
router.post('/admin/grant', requireRole('admin'), adminGrant);
router.post('/admin/:id/extend', requireRole('admin'), adminExtend);
router.post('/admin/:id/cancel', requireRole('admin'), adminCancel);

export default router;
