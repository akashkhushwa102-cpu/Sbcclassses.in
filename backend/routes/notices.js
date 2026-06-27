import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { list, create, update, remove, noticeSchema } from '../controllers/noticeController.js';

const router = Router();

router.get('/', optionalAuth, list);
router.post('/', requireAuth, requireRole('admin', 'teacher'), validate(noticeSchema), create);
router.put('/:id', requireAuth, requireRole('admin', 'teacher'), update);
router.delete('/:id', requireAuth, requireRole('admin'), remove);

export default router;
