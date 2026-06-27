import { Router } from 'express';
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentLimiter } from '../middleware/rateLimit.js';
import {
  initiatePayment, webhook, verifyPayment, phonepeConfig, initiateSchema,
} from '../controllers/phonepeController.js';

const router = Router();

// Diagnostic - check if PhonePe is configured (does NOT leak secrets)
router.get('/config', phonepeConfig);

// Student-initiated payment
router.post('/initiate', requireAuth, paymentLimiter, validate(initiateSchema), initiatePayment);

// Idempotent re-check after redirect
router.post('/verify', requireAuth, paymentLimiter, verifyPayment);

// Webhook (server-to-server). Public. PhonePe sends application/json.
// We add a JSON parser locally because some setups disable global JSON for
// raw-body routes; safest to be explicit here.
router.post('/webhook', express.json({ limit: '128kb' }), webhook);

export default router;
