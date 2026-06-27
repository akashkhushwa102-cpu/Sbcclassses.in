import express from 'express';
import { createLiveClass, listLiveClasses, getLiveClass, updateLiveClass, deleteLiveClass } from '../controllers/liveClassController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Admins and teachers may create and manage live classes
router.post('/', requireAuth, requireRole(['admin','teacher']), createLiveClass);
router.get('/', requireAuth, requireRole(['admin','teacher','student']), listLiveClasses);
router.get('/:id', requireAuth, requireRole(['admin','teacher','student']), getLiveClass);
router.put('/:id', requireAuth, requireRole(['admin','teacher']), updateLiveClass);
router.delete('/:id', requireAuth, requireRole(['admin','teacher']), deleteLiveClass);

export default router;
