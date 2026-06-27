import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listByBatch, create, update, remove, contentSchema,
} from '../controllers/contentController.js';

const router = Router();

router.get('/batch/:batchId', requireAuth, listByBatch);
router.post('/', requireAuth, requireRole('admin', 'teacher'), validate(contentSchema), create);
router.put('/:id', requireAuth, requireRole('admin', 'teacher'), update);
router.delete('/:id', requireAuth, requireRole('admin', 'teacher'), remove);

export default router;
