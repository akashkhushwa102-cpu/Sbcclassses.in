import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listUsers, getUser, createUser, updateUser, deleteUser, toggleBlock,
  createUserSchema, updateUserSchema,
} from '../controllers/userController.js';

const router = Router();

// All user-management endpoints are admin-only.
router.use(requireAuth);

router.get('/', requireRole('admin'), listUsers);
router.get('/:id', requireRole('admin', 'teacher'), getUser);
router.post('/', requireRole('admin'), validate(createUserSchema), createUser);
router.put('/:id', requireRole('admin'), validate(updateUserSchema), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);
router.post('/:id/toggle-block', requireRole('admin'), toggleBlock);

export default router;
