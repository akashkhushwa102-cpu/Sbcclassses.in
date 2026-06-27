import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listBatches, getBatch, createBatch, updateBatch, deleteBatch,
  togglePublish, checkAccess, batchSchema, batchUpdateSchema,
} from '../controllers/batchController.js';

const router = Router();

// Public — but may be customised by optional auth (admin/teacher can see drafts).
router.get('/', optionalAuth, listBatches);
router.get('/:id', optionalAuth, getBatch);

// Authenticated routes
router.get('/:id/access', requireAuth, checkAccess);

// Admin / teacher
router.post('/', requireAuth, requireRole('admin', 'teacher'), validate(batchSchema), createBatch);
router.put('/:id', requireAuth, requireRole('admin', 'teacher'), validate(batchUpdateSchema), updateBatch);
router.delete('/:id', requireAuth, requireRole('admin'), deleteBatch);
router.post('/:id/toggle-publish', requireAuth, requireRole('admin'), togglePublish);

export default router;
