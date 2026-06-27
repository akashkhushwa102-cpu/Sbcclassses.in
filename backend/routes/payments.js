import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentLimiter } from '../middleware/rateLimit.js';
import {
  initiatePayment, paytmCallback, verifyPayment,
  myPayments, adminListPayments, initiateSchema,
} from '../controllers/paymentController.js';
import {
  getUpiConfig, claimUpi, upiClaimSchema,
  adminListUpiClaims, approveUpiClaim, rejectUpiClaim,
} from '../controllers/upiClaimController.js';

const router = Router();

// ---- Paytm gateway flow ----
router.post('/initiate', requireAuth, paymentLimiter, validate(initiateSchema), initiatePayment);
router.post('/verify',   requireAuth, paymentLimiter, verifyPayment);
router.get ('/me',       requireAuth, myPayments);

// Server-to-server callback from Paytm (public).
router.post('/paytm/callback', paytmCallback);

// ---- Direct-UPI manual flow ----
// Public — frontend reads receiver UPI ID + name to render QR/deep-link.
router.get ('/upi-config', getUpiConfig);

// Student claims they paid via UPI; backend stores a pending Payment.
router.post('/upi-claim', requireAuth, paymentLimiter, validate(upiClaimSchema), claimUpi);

// Admin: review + approve / reject UPI claims.
router.get ('/admin/upi/pending',     requireAuth, requireRole('admin'), adminListUpiClaims);
router.post('/admin/upi/:id/approve', requireAuth, requireRole('admin'), approveUpiClaim);
router.post('/admin/upi/:id/reject',  requireAuth, requireRole('admin'), rejectUpiClaim);

// ---- Admin payment listing ----
router.get('/admin', requireAuth, requireRole('admin'), adminListPayments);

export default router;
