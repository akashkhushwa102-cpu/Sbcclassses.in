import express from 'express';
import { PayTMController } from '../controllers/paytmController.js';

const router = express.Router();

/**
 * GET /api/paytm/plans
 * Get all available subscription plans
 */
router.get('/plans', PayTMController.getPlans);

/**
 * POST /api/paytm/initiate-payment
 * Initiate payment - returns PayTM params and redirect URL
 * Body: { studentId, planType: 'monthly' | 'quarterly' | 'annual' }
 */
router.post('/initiate-payment', PayTMController.initiatePayment);

/**
 * POST /api/paytm/callback
 * Callback from PayTM after payment
 * PayTM redirects user back with payment status
 * This is called by PayTM servers
 */
router.post('/callback', PayTMController.handleCallback);

/**
 * POST /api/paytm/verify-payment
 * Verify payment status by querying PayTM
 * Body: { orderId }
 */
router.post('/verify-payment', PayTMController.verifyPayment);

/**
 * GET /api/paytm/subscription/:studentId
 * Get active subscription for a student
 */
router.get('/subscription/:studentId', PayTMController.getSubscriptionStatus);

/**
 * GET /api/paytm/history/:studentId
 * Get payment history for a student
 */
router.get('/history/:studentId', PayTMController.getPaymentHistory);

export default router;
