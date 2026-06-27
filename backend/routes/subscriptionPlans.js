import express from 'express';
import { SubscriptionPlanController } from '../controllers/subscriptionPlanController.js';

const router = express.Router();

/**
 * GET /api/subscription-plans
 * Get all active subscription plans (Public)
 */
router.get('/', SubscriptionPlanController.getAllPlans);

/**
 * GET /api/subscription-plans/:id
 * Get plan by ID (Public)
 */
router.get('/:id', SubscriptionPlanController.getPlanById);

/**
 * POST /api/subscription-plans
 * Create new plan - Admin only
 */
router.post('/', SubscriptionPlanController.createPlan);

/**
 * PUT /api/subscription-plans/:id
 * Update plan - Admin only
 */
router.put('/:id', SubscriptionPlanController.updatePlan);

/**
 * DELETE /api/subscription-plans/:id
 * Delete plan - Admin only
 */
router.delete('/:id', SubscriptionPlanController.deletePlan);

/**
 * POST /api/subscription-plans/:id/restore
 * Restore deleted plan - Admin only
 */
router.post('/:id/restore', SubscriptionPlanController.restorePlan);

/**
 * GET /api/subscription-plans/admin/all
 * Get all plans including inactive - Admin only
 */
router.get('/admin/all', SubscriptionPlanController.getAllPlansAdmin);

export default router;
