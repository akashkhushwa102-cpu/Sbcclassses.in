/**
 * Paytm UPI Payment Controller
 * ============================================================
 * Flow:
 *  1. POST /api/payments/initiate
 *       Body: { planId | batchId, type } and optional { paymentMethod }
 *       → creates a Payment(status=pending) and returns Paytm txn params
 *         + the gateway URL to POST them to (or to render an auto-submit form).
 *  2. Frontend POSTs the params to PAYTM_GATEWAY_URL/order/processTransaction
 *     and the user completes payment on Paytm's hosted page.
 *  3. Paytm calls back our server-to-server callback at
 *       POST /api/payments/paytm/callback
 *       (configured via PAYTM_CALLBACK_URL).
 *       We verify the checksum, mark the Payment success/failed, and
 *       (on success) provision a Subscription automatically.
 *  4. The frontend can also call POST /api/payments/verify { orderId }
 *     after returning from Paytm to confirm status.
 */
import https from 'node:https';
import Joi from 'joi';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import { generateChecksum, verifyChecksum } from '../utils/paytm.js';
import { provisionFromPayment } from './subscriptionController.js';
import { sendSubscriptionReceipt } from '../utils/email.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';
import Profile from '../models/Profile.js';
import { matchesAccess } from '../utils/accessControl.js';

export const initiateSchema = Joi.object({
  planId: Joi.string().allow(null, ''),
  batchId: Joi.string().allow(null, ''),
  type: Joi.string().valid('batch', 'subject', 'all_access').required(),
  paymentMethod: Joi.string().valid('upi', 'card', 'net_banking', 'wallet').default('upi'),
});

const buildOrderId = (userId) =>
  `SBC${Date.now()}${String(userId).slice(-6)}${Math.floor(Math.random() * 1000)}`;

/**
 * POST /api/payments/initiate
 */
export const initiatePayment = asyncHandler(async (req, res) => {
  const { planId, batchId, type, paymentMethod } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  // Resolve plan / amount / duration
  let plan = null;
  let amountInRupees;
  let durationDays;
  let planName;
  let resolvedBatchId = null;

  if (planId) {
    plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) throw new ApiError(404, 'Plan not found or inactive');
    if (plan.type !== type) throw new ApiError(400, `Plan type does not match (${plan.type} vs ${type})`);
    amountInRupees = plan.price;
    durationDays = plan.duration;
    planName = plan.name;
    resolvedBatchId = plan.batchId || (type === 'batch' ? batchId : null);
  } else if (type === 'batch') {
    if (!batchId) throw new ApiError(400, 'batchId is required when no planId is provided');
    const batch = await Batch.findById(batchId);
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (!batch.isPublished) throw new ApiError(400, 'Batch is not published');
    amountInRupees = batch.price;
    durationDays = batch.duration;
    planName = batch.name;
    resolvedBatchId = batch._id;
  } else {
    // 'subject' and 'all_access' MUST come with a planId.
    throw new ApiError(400, `planId is required for type='${type}'`);
  }

  // Ensure the student's profile (onboarding) matches the plan/batch selectors
  try {
    const profile = await Profile.findOne({ email: user.email.toLowerCase() });
    const onboarding = profile?.onboarding || user.onboarding || {};
    const studentTarget = { board: onboarding.board, state: onboarding.state, classLevel: onboarding.class ? Number(onboarding.class) : null, batchId: resolvedBatchId };
    if (!onboarding || !onboarding.class) {
      throw new ApiError(400, 'Please complete onboarding (board/state/class) before purchase');
    }

    if (plan) {
      // If plan has accessSelectors and they're non-empty, ensure match
      const selectors = plan.accessSelectors || {};
      if (selectors && ( (selectors.boards || []).length || (selectors.states || []).length || (selectors.classes || []).length || (selectors.batches || []).length )) {
        if (!matchesAccess(selectors, studentTarget)) {
          throw new ApiError(403, 'This plan is not available for your board/state/class');
        }
      }
    }

    if (!plan && resolvedBatchId) {
      // batch-specific purchase — ensure batch metadata matches student
      const batch = await Batch.findById(resolvedBatchId);
      if (batch) {
        // Board check
        if (batch.board && String(batch.board).toLowerCase() !== 'all' && String(batch.board).toLowerCase() !== String(onboarding.board || '').toLowerCase()) {
          throw new ApiError(403, 'This batch is not available for your board');
        }
        // State check
        if (batch.state && String(batch.state).toLowerCase() !== 'all states' && String(batch.state).toLowerCase() !== String(onboarding.state || '').toLowerCase()) {
          throw new ApiError(403, 'This batch is not available for your state');
        }
        // Class check
        if (batch.classLevel != null && onboarding.class && Number(onboarding.class) !== Number(batch.classLevel)) {
          throw new ApiError(403, 'This batch is not available for your class');
        }
      }
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // If profile lookup failed for unexpected reason, log and continue (do not block)
    logger.warn('Profile check failed during payment initiation', { err: err?.message });
  }

  if (!amountInRupees || amountInRupees <= 0)
    throw new ApiError(400, 'Invalid amount');
  if (!Number.isInteger(durationDays) || durationDays < 1)
    throw new ApiError(400, 'Invalid duration');

  // Create pending payment
  const orderId = buildOrderId(user._id);
  const payment = await Payment.create({
    userId: user._id,
    planId: plan?._id,
    batchId: resolvedBatchId,
    gateway: 'paytm',
    gatewayOrderId: orderId,
    amount: Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    paymentMethod,
    planType: type,
    planName,
    durationDays,
    status: 'pending',
    contactEmail: user.email,
    contactPhone: user.phone || '',
    metadata: { initiatedBy: user._id.toString() },
  });

  // Build Paytm params
  const paytmParams = {
    MID: env.paytm.mid,
    WEBSITE: env.paytm.website,
    CHANNEL_ID: env.paytm.channelId,
    INDUSTRY_TYPE_ID: env.paytm.industryType,
    ORDER_ID: orderId,
    CUST_ID: user._id.toString(),
    TXN_AMOUNT: amountInRupees.toFixed(2),
    CALLBACK_URL: env.paytm.callbackUrl,
    EMAIL: user.email,
    MOBILE_NO: user.phone || '',
  };

  const checksumHash = await generateChecksum(paytmParams, env.paytm.key);

  return created(res, {
    paymentId: payment._id,
    orderId,
    amount: amountInRupees,
    amountInPaise: payment.amount,
    currency: 'INR',
    planName,
    durationDays,
    type,
    gateway: 'paytm',
    paytmGatewayUrl: `${env.paytm.gatewayUrl}/order/processTransaction?ORDER_ID=${orderId}`,
    paytmParams: { ...paytmParams, CHECKSUMHASH: checksumHash },
    callbackUrl: env.paytm.callbackUrl,
    // Convenience HTML snippet — frontend can drop this into a hidden form.
    autoPostForm: `<form id="paytmForm" method="post" action="${env.paytm.gatewayUrl}/order/processTransaction?ORDER_ID=${orderId}">${
      Object.entries({ ...paytmParams, CHECKSUMHASH: checksumHash })
        .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}" />`)
        .join('')
    }</form><script>document.getElementById('paytmForm').submit();</script>`,
  }, 'Payment initiated');
});

/**
 * POST /api/payments/paytm/callback
 *
 * Paytm sends `application/x-www-form-urlencoded` and expects a redirect.
 * We verify, persist, provision the subscription, then redirect to the FE.
 */
export const paytmCallback = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  const checksumHash = body.CHECKSUMHASH;
  delete body.CHECKSUMHASH;

  const verified = verifyChecksum(body, env.paytm.key, checksumHash);
  const orderId = body.ORDERID;
  const status = body.STATUS;

  logger.info('Paytm callback received', { orderId, status, verified });

  if (!orderId) {
    return res.redirect(`${env.frontendUrl}/payment-result?status=invalid`);
  }

  const payment = await Payment.findOne({ gatewayOrderId: orderId });
  if (!payment) {
    return res.redirect(`${env.frontendUrl}/payment-result?status=not_found&orderId=${orderId}`);
  }

  // Persist raw callback for audit
  payment.rawCallback = body;
  payment.gatewayPaymentId = body.TXNID || payment.gatewayPaymentId;

  if (!verified) {
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = 'Checksum verification failed';
    await payment.save();
    logger.warn('Paytm callback checksum FAILED', { orderId });
    return res.redirect(`${env.frontendUrl}/payment-result?status=invalid_signature&orderId=${orderId}`);
  }

  if (status === 'TXN_SUCCESS') {
    if (payment.status !== 'success') {
      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();
      try {
        const sub = await provisionFromPayment(payment);
        payment.subscriptionId = sub._id;
        await payment.save();
        const user = await User.findById(payment.userId);
        if (user) sendSubscriptionReceipt(user, sub, payment).catch(() => {});
      } catch (err) {
        logger.error('Subscription provisioning failed', { err: err.message, orderId });
      }
    }
    return res.redirect(`${env.frontendUrl}/payment-result?status=success&orderId=${orderId}`);
  }

  payment.status = 'failed';
  payment.failedAt = new Date();
  payment.failureReason = body.RESPMSG || `Paytm status: ${status}`;
  await payment.save();
  return res.redirect(`${env.frontendUrl}/payment-result?status=failed&orderId=${orderId}`);
});

/**
 * POST /api/payments/verify  { orderId }
 * Server-side verification by querying Paytm's status API.
 * The frontend can call this after returning from the callback,
 * to re-check status idempotently.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new ApiError(400, 'orderId is required');

  const payment = await Payment.findOne({ gatewayOrderId: orderId });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (req.user && req.user.role !== 'admin' && String(payment.userId) !== req.user.id) {
    throw new ApiError(403, 'Not your payment');
  }

  // If we already marked it success/failed via callback, just return state.
  if (payment.status !== 'pending') {
    return ok(res, { status: payment.status, payment });
  }

  // Otherwise query Paytm status API.
  const params = { MID: env.paytm.mid, ORDERID: orderId };
  const checksum = await generateChecksum(params, env.paytm.key);
  const postBody = JSON.stringify({ ...params, CHECKSUMHASH: checksum });

  const paytmResp = await new Promise((resolve, reject) => {
    const url = new URL(env.paytm.gatewayUrl);
    const reqOpts = {
      hostname: url.hostname,
      port: 443,
      path: '/order/status',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': postBody.length },
    };
    const r = https.request(reqOpts, (resp) => {
      let data = '';
      resp.on('data', (c) => (data += c));
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
      });
    });
    r.on('error', reject);
    r.write(postBody);
    r.end();
  });

  payment.rawCallback = paytmResp;
  if (paytmResp.STATUS === 'TXN_SUCCESS') {
    payment.status = 'success';
    payment.paidAt = new Date();
    payment.gatewayPaymentId = paytmResp.TXNID || payment.gatewayPaymentId;
    await payment.save();
    const sub = await provisionFromPayment(payment);
    payment.subscriptionId = sub._id;
    await payment.save();
  } else if (paytmResp.STATUS === 'TXN_FAILURE') {
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = paytmResp.RESPMSG || 'Failed';
    await payment.save();
  }
  return ok(res, { status: payment.status, payment, paytm: paytmResp });
});

/** Student: my payments. Admin: pass `?userId=` to list anyone. */
export const myPayments = asyncHandler(async (req, res) => {
  const targetUserId =
    req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;
  const payments = await Payment.find({ userId: targetUserId })
    .sort({ createdAt: -1 })
    .limit(200);
  return ok(res, payments);
});

export const adminListPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);
  return ok(res, items, 'Payments', { pagination: { total, page: Number(page), limit: Number(limit) } });
});
