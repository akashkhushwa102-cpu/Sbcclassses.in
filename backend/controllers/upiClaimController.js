/**
 * Direct-UPI Subscription Claim
 * ============================================================
 * Flow (no payment gateway, works with any plain UPI ID):
 *   1. Student picks a plan in the frontend.
 *   2. Frontend calls GET  /api/payments/upi-config to get the
 *      admin's UPI ID + display name.
 *   3. Student pays via GPay / PhonePe / Paytm / BHIM directly to
 *      that UPI ID and copies the UPI transaction reference.
 *   4. Frontend calls POST /api/payments/upi-claim with
 *      { planId|batchId, type, upiTxnId, payerName?, payerVpa? }.
 *      Backend creates a Payment(status='pending', gateway='upi_manual').
 *   5. Admin verifies on the bank/UPI side, then calls
 *      POST /api/payments/admin/upi/:id/approve which provisions
 *      the Subscription.
 *
 * Yeh manual flow specifically Indian coaching apps ke liye useful
 * hai — bina Paytm Business onboarding ke launch kiya ja sakta hai.
 */
import Joi from 'joi';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created, paginate } from '../utils/response.js';
import { provisionFromPayment } from './subscriptionController.js';
import logger from '../utils/logger.js';

// ---------- Validation ----------
export const upiClaimSchema = Joi.object({
  planId: Joi.string().allow(null, ''),
  batchId: Joi.string().allow(null, ''),
  type: Joi.string().valid('batch', 'subject', 'all_access').required(),
  upiTxnId: Joi.string().min(6).max(64).required(),
  payerName: Joi.string().max(120).allow('', null),
  payerVpa: Joi.string().max(120).allow('', null),
  amount: Joi.number().min(0), // optional — server resolves from plan/batch
  note: Joi.string().max(500).allow('', null),
});

// ---------- Public: UPI config ----------
/**
 * GET /api/payments/upi-config
 * Returns the admin's UPI receiver details so the frontend can render
 * a deep-link / QR. Public so unauthenticated users can preview pricing.
 */
export const getUpiConfig = asyncHandler(async (_req, res) => {
  const upiId = process.env.UPI_RECEIVER_ID || '';
  const name  = process.env.UPI_RECEIVER_NAME || 'SBC Classes';
  return ok(res, {
    upiId,
    name,
    available: Boolean(upiId),
    instructions: upiId
      ? 'Scan the QR or pay to this UPI ID, then submit the transaction reference.'
      : 'UPI receiver not configured yet — contact admin.',
  });
});

// ---------- Helper: resolve plan / amount / duration ----------
const resolvePlan = async ({ planId, batchId, type }) => {
  if (planId) {
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) throw new ApiError(404, 'Plan not found or inactive');
    if (plan.type !== type) throw new ApiError(400, `Plan type mismatch (${plan.type} vs ${type})`);
    return {
      plan,
      amount: plan.price,
      durationDays: plan.duration,
      planName: plan.name,
      resolvedBatchId: plan.batchId || (type === 'batch' ? batchId : null),
    };
  }
  if (type === 'batch') {
    if (!batchId) throw new ApiError(400, 'batchId required when no planId');
    const batch = await Batch.findById(batchId);
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (!batch.isPublished) throw new ApiError(400, 'Batch is not published');
    return {
      plan: null,
      amount: batch.price,
      durationDays: batch.duration,
      planName: batch.name,
      resolvedBatchId: batch._id,
    };
  }
  // 'subject' and 'all_access' MUST be purchased via a planId.
  throw new ApiError(400, `planId required for type='${type}'`);
};

// ---------- Student: claim UPI payment ----------
/**
 * POST /api/payments/upi-claim
 * Body: { planId?, batchId?, type, upiTxnId, payerName?, payerVpa? }
 */
export const claimUpi = asyncHandler(async (req, res) => {
  const { planId, batchId, type, upiTxnId, payerName, payerVpa, note } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const { plan, amount, durationDays, planName, resolvedBatchId } =
    await resolvePlan({ planId, batchId, type });

  // Reject obvious duplicates: same user + same upiTxnId in last 24h.
  const dup = await Payment.findOne({
    userId: user._id,
    'metadata.upiTxnId': upiTxnId,
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (dup) {
    throw new ApiError(409, 'This transaction reference is already submitted.');
  }

  const orderId = `UPI${Date.now()}${String(user._id).slice(-6)}`;

  const payment = await Payment.create({
    userId: user._id,
    planId: plan?._id,
    batchId: resolvedBatchId,
    gateway: 'upi_manual',
    gatewayOrderId: orderId,
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    paymentMethod: 'upi',
    planType: type,
    planName,
    durationDays,
    status: 'pending',
    contactEmail: user.email,
    contactPhone: user.phone || '',
    metadata: {
      upiTxnId: String(upiTxnId).trim(),
      payerName: payerName || user.name,
      payerVpa: payerVpa || '',
      note: note || '',
      claimedAt: new Date().toISOString(),
    },
  });

  logger.info('UPI claim submitted', {
    paymentId: payment._id.toString(),
    userId: user._id.toString(),
    upiTxnId,
    amount,
  });

  return created(res, {
    paymentId: payment._id,
    orderId,
    status: 'pending',
    message: 'Payment claim submitted — admin will verify and activate your subscription shortly.',
  }, 'UPI claim received');
});

// ---------- Admin: list pending claims ----------
/**
 * GET /api/payments/admin/upi/pending
 * Query: ?page&limit&status=pending|success|failed
 */
export const adminListUpiClaims = asyncHandler(async (req, res) => {
  const { status = 'pending', page = 1, limit = 50 } = req.query;
  const filter = { gateway: 'upi_manual' };
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('userId', 'name email phone')
      .populate('planId', 'name type')
      .populate('batchId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);
  return paginate(res, items, total, Number(page), Number(limit));
});

// ---------- Admin: approve a claim ----------
/**
 * POST /api/payments/admin/upi/:id/approve
 */
export const approveUpiClaim = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.gateway !== 'upi_manual') throw new ApiError(400, 'Not a UPI manual claim');
  if (payment.status === 'success') return ok(res, payment, 'Already approved');
  if (payment.status === 'failed')  throw new ApiError(400, 'Claim was rejected — cannot approve');

  payment.status = 'success';
  payment.paidAt = new Date();
  payment.metadata = {
    ...(payment.metadata || {}),
    approvedBy: req.user.id,
    approvedAt: new Date().toISOString(),
  };
  await payment.save();

  // Provision / extend subscription
  const sub = await provisionFromPayment(payment);
  payment.subscriptionId = sub._id;
  await payment.save();

  logger.info('UPI claim approved', {
    paymentId: payment._id.toString(),
    subscriptionId: sub._id.toString(),
  });
  return ok(res, { payment, subscription: sub }, 'Subscription activated');
});

// ---------- Admin: reject a claim ----------
/**
 * POST /api/payments/admin/upi/:id/reject
 * Body: { reason? }
 */
export const rejectUpiClaim = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.gateway !== 'upi_manual') throw new ApiError(400, 'Not a UPI manual claim');
  if (payment.status === 'success') throw new ApiError(400, 'Already approved — cannot reject');

  payment.status = 'failed';
  payment.failedAt = new Date();
  payment.failureReason = (req.body && req.body.reason) || 'Rejected by admin';
  payment.metadata = {
    ...(payment.metadata || {}),
    rejectedBy: req.user.id,
    rejectedAt: new Date().toISOString(),
  };
  await payment.save();

  logger.info('UPI claim rejected', {
    paymentId: payment._id.toString(),
    reason: payment.failureReason,
  });
  return ok(res, payment, 'Claim rejected');
});
