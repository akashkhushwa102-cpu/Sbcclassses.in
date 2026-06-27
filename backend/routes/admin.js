import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { dashboardStats } from '../controllers/adminController.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', dashboardStats);

export default router;
