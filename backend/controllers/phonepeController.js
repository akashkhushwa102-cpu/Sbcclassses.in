/**
 * PhonePe Payment Gateway Controller
 * ============================================================
 * Standard Checkout API integration:
 *   POST {host}/pg/v1/pay              - initiate
 *   GET  {host}/pg/v1/status/{mid}/{txn} - status query
 *
 * Signature scheme:
 *   X-VERIFY = SHA256(<payload-or-path> + saltKey) + "###" + saltIndex
 *
 *   For /pay:    base = base64(JSON_PAYLOAD) + "/pg/v1/pay"
 *   For /status: base = "/pg/v1/status/{mid}/{txn}"
 *   For webhook: base = JSON.stringify(req.body)        (PhonePe sends raw body)
 *
 * Test env:  https://api-preprod.phonepe.com/apis/pg-sandbox
 * Prod env:  https://api.phonepe.com/apis/hermes
 *
 * Flow:
 *  1. Frontend hits POST /api/phonepe/initiate
 *     - We resolve plan/batch -> amount/duration
 *     - Create Payment(status=pending, gateway='phonepe')
 *     - Call PhonePe /pg/v1/pay with signed payload
 *     - Return { redirectUrl } - frontend window.location to it
 *  2. User completes payment on PhonePe page
 *  3. PhonePe calls our webhook POST /api/phonepe/webhook
 *     - Verify X-VERIFY header
 *     - Mark Payment success/failed
 *     - On success, provision Subscription
 *  4. PhonePe also redirects user back to /payment-result?status=...
 *  5. Frontend calls POST /api/phonepe/verify { merchantTransactionId }
 *     to be safe (idempotent re-check via PhonePe status API)
 */
import crypto from 'node:crypto';
import https from 'node:https';
import Joi from 'joi';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import { provisionFromPayment } from './subscriptionController.js';
import { sendSubscriptionReceipt } from '../utils/email.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// ---------- Config (from env, with safe defaults for sandbox) ----------
const PHONEPE = {
  merchantId: process.env.PHONEPE_MERCHANT_ID || '',
  saltKey:    process.env.PHONEPE_SALT_KEY    || '',
  saltIndex:  process.env.PHONEPE_SALT_INDEX  || '1',
  // Sandbox by default. Switch to https://api.phonepe.com/apis/hermes for prod.
  host:       process.env.PHONEPE_HOST        || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  redirectUrl: process.env.PHONEPE_REDIRECT_URL || `${env.frontendUrl}/payment-result`,
  callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'http://localhost:5000/api/phonepe/webhook',
  redirectMode: process.env.PHONEPE_REDIRECT_MODE || 'REDIRECT', // REDIRECT | POST
};

// ---------- Validation ----------
export const initiateSchema = Joi.object({
  planId:  Joi.string().allow(null, ''),
  batchId: Joi.string().allow(null, ''),
  type:    Joi.string().valid('batch', 'subject', 'all_access').required(),
});

// ---------- Helpers ----------
const sha256 = (str) => crypto.createHash('sha256').update(str, 'utf8').digest('hex');

/** PhonePe X-VERIFY header. `base` differs for /pay, /status, webhook. */
const buildXVerify = (base) => `${sha256(base + PHONEPE.saltKey)}###${PHONEPE.saltIndex}`;

const buildOrderId = (userId) =>
  `SBCPP${Date.now()}${String(userId).slice(-6)}${Math.floor(Math.random() * 1000)}`;

/** Resolve plan/batch -> amount, duration, name. */
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
  throw new ApiError(400, `planId required for type='${type}'`);
};

/** Tiny HTTPS POST helper that returns parsed JSON. */
const httpsPostJson = (urlString, headers, body) =>
  new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data || '{}') }); }
        catch (e) { resolve({ status: res.statusCode, json: null, raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });

const httpsGetJson = (urlString, headers) =>
  new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data || '{}') }); }
        catch (e) { resolve({ status: res.statusCode, json: null, raw: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });

// ============================================================
// 1. POST /api/phonepe/initiate
// ============================================================
export const initiatePayment = asyncHandler(async (req, res) => {
  if (!PHONEPE.merchantId || !PHONEPE.saltKey) {
    throw new ApiError(503, 'PhonePe is not configured. Set PHONEPE_MERCHANT_ID + PHONEPE_SALT_KEY in .env');
  }

  const { planId, batchId, type } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const { plan, amount, durationDays, planName, resolvedBatchId } =
    await resolvePlan({ planId, batchId, type });

  if (!amount || amount <= 0) throw new ApiError(400, 'Invalid amount');
  if (!Number.isInteger(durationDays) || durationDays < 1)
    throw new ApiError(400, 'Invalid duration');

  const orderId = buildOrderId(user._id);

  // Pending payment row
  const payment = await Payment.create({
    userId: user._id,
    planId: plan?._id,
    batchId: resolvedBatchId,
    gateway: 'phonepe',
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
    metadata: { initiatedBy: user._id.toString() },
  });

  // Build PhonePe payload
  const payloadObj = {
    merchantId: PHONEPE.merchantId,
    merchantTransactionId: orderId,
    merchantUserId: String(user._id),
    amount: payment.amount, // in paise
    redirectUrl: `${PHONEPE.redirectUrl}?orderId=${orderId}`,
    redirectMode: PHONEPE.redirectMode,
    callbackUrl: PHONEPE.callbackUrl,
    mobileNumber: user.phone || '',
    paymentInstrument: { type: 'PAY_PAGE' },
  };
  const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
  const xVerify = buildXVerify(base64Payload + '/pg/v1/pay');

  let resp;
  try {
    resp = await httpsPostJson(
      `${PHONEPE.host}/pg/v1/pay`,
      { 'X-VERIFY': xVerify, accept: 'application/json' },
      { request: base64Payload }
    );
  } catch (err) {
    payment.status = 'failed';
    payment.failureReason = `Network error: ${err.message}`;
    payment.failedAt = new Date();
    await payment.save();
    throw new ApiError(502, `PhonePe gateway unreachable: ${err.message}`);
  }

  if (resp.status !== 200 || !resp.json?.success) {
    payment.status = 'failed';
    payment.failureReason = resp.json?.message || `HTTP ${resp.status}`;
    payment.failedAt = new Date();
    payment.metadata = { ...(payment.metadata || {}), phonepeError: resp.json };
    await payment.save();
    throw new ApiError(502, `PhonePe: ${resp.json?.message || 'init failed'}`);
  }

  const redirectUrl = resp.json?.data?.instrumentResponse?.redirectInfo?.url;
  if (!redirectUrl) {
    payment.status = 'failed';
    payment.failureReason = 'No redirect URL in PhonePe response';
    await payment.save();
    throw new ApiError(502, 'PhonePe: missing redirect URL');
  }

  return created(res, {
    paymentId: payment._id,
    orderId,
    amount,
    currency: 'INR',
    planName,
    durationDays,
    type,
    gateway: 'phonepe',
    redirectUrl,
  }, 'PhonePe payment initiated');
});

// ============================================================
// 2. POST /api/phonepe/webhook  (server-to-server callback)
// ============================================================
/**
 * PhonePe sends:
 *   Headers:  X-VERIFY: <sha256(rawBody + saltKey)>###<saltIndex>
 *   Body:     { response: <base64-encoded JSON> }
 *
 * The decoded JSON contains `data.merchantTransactionId`, `code`,
 * `data.transactionId`, etc.
 */
export const webhook = asyncHandler(async (req, res) => {
  const xVerify = req.headers['x-verify'] || '';
  const body = req.body || {};
  const rawResponseB64 = body.response || '';

  // Verify signature: sha256(response + saltKey) + ### + saltIndex
  const expected = buildXVerify(rawResponseB64);
  const verified = expected === xVerify;

  let decoded = {};
  try {
    decoded = JSON.parse(Buffer.from(rawResponseB64, 'base64').toString('utf8'));
  } catch (e) {
    decoded = {};
  }

  const orderId =
    decoded?.data?.merchantTransactionId ||
    decoded?.merchantTransactionId ||
    body.merchantTransactionId;

  const code = decoded?.code || body.code;

  logger.info('PhonePe webhook received', { orderId, code, verified });

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'merchantTransactionId missing' });
  }

  const payment = await Payment.findOne({ gatewayOrderId: orderId, gateway: 'phonepe' });
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  payment.rawCallback = decoded || body;
  payment.gatewayPaymentId = decoded?.data?.transactionId || payment.gatewayPaymentId;

  if (!verified) {
    payment.status = 'failed';
    payment.failureReason = 'X-VERIFY mismatch';
    payment.failedAt = new Date();
    await payment.save();
    logger.warn('PhonePe webhook checksum FAILED', { orderId });
    return res.status(403).json({ success: false, message: 'Signature verification failed' });
  }

  if (code === 'PAYMENT_SUCCESS') {
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
    return res.status(200).json({ success: true });
  }

  // Anything else (PAYMENT_ERROR, PAYMENT_DECLINED, ...) -> failed
  payment.status = 'failed';
  payment.failedAt = new Date();
  payment.failureReason = decoded?.message || code || 'Payment not successful';
  await payment.save();
  return res.status(200).json({ success: true, status: 'failed' });
});

// ============================================================
// 3. POST /api/phonepe/verify  { merchantTransactionId }
// ============================================================
/**
 * Idempotent re-check by querying PhonePe status API. Call this after the
 * frontend gets the redirect back with ?orderId=... — covers cases where the
 * webhook was delayed or missed.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { merchantTransactionId, orderId } = req.body;
  const txn = merchantTransactionId || orderId;
  if (!txn) throw new ApiError(400, 'merchantTransactionId is required');

  const payment = await Payment.findOne({ gatewayOrderId: txn, gateway: 'phonepe' });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (req.user && req.user.role !== 'admin' && String(payment.userId) !== req.user.id) {
    throw new ApiError(403, 'Not your payment');
  }

  // Already settled? Just return state.
  if (payment.status !== 'pending') {
    return ok(res, { status: payment.status, payment });
  }

  // Else query PhonePe status API.
  const path = `/pg/v1/status/${PHONEPE.merchantId}/${txn}`;
  const xVerify = buildXVerify(path);
  let resp;
  try {
    resp = await httpsGetJson(`${PHONEPE.host}${path}`, {
      'X-VERIFY': xVerify,
      'X-MERCHANT-ID': PHONEPE.merchantId,
    });
  } catch (err) {
    throw new ApiError(502, `PhonePe status query failed: ${err.message}`);
  }

  const code = resp.json?.code;
  if (code === 'PAYMENT_SUCCESS') {
    payment.status = 'success';
    payment.paidAt = new Date();
    payment.gatewayPaymentId = resp.json?.data?.transactionId || payment.gatewayPaymentId;
    await payment.save();
    try {
      const sub = await provisionFromPayment(payment);
      payment.subscriptionId = sub._id;
      await payment.save();
    } catch (err) {
      logger.error('Subscription provisioning failed', { err: err.message, orderId: txn });
    }
    return ok(res, { status: 'success', payment });
  }

  if (code === 'PAYMENT_PENDING') {
    return ok(res, { status: 'pending', payment, message: 'Still pending — try again later' });
  }

  payment.status = 'failed';
  payment.failedAt = new Date();
  payment.failureReason = resp.json?.message || code || 'Payment not successful';
  await payment.save();
  return ok(res, { status: 'failed', payment });
});

// Export config for diagnostic / test use
export const phonepeConfig = (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      configured: Boolean(PHONEPE.merchantId && PHONEPE.saltKey),
      host: PHONEPE.host,
      merchantIdSet: Boolean(PHONEPE.merchantId),
      saltKeySet: Boolean(PHONEPE.saltKey),
      saltIndex: PHONEPE.saltIndex,
      callbackUrl: PHONEPE.callbackUrl,
      redirectUrl: PHONEPE.redirectUrl,
    },
  });
};
