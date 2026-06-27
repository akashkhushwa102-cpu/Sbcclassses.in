import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listPlans, getPlan, createPlan, updatePlan, deletePlan, planSchema,
} from '../controllers/planController.js';

const router = Router();

// Public — students need to see plans
router.get('/', listPlans);
router.get('/:id', getPlan);

// Admin only
router.post('/', requireAuth, requireRole('admin'), validate(planSchema), createPlan);
router.put('/:id', requireAuth, requireRole('admin'), validate(planSchema.fork(['name','type','price','duration'], (s) => s.optional())), updatePlan);
router.delete('/:id', requireAuth, requireRole('admin'), deletePlan);

export default router;
