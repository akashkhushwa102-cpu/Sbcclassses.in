import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, paginate } from '../utils/response.js';
import { matchesAccess } from '../utils/accessControl.js';

/** Student: list my subscriptions (active first). */
export const myActive = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ userId: req.user.id })
    .populate('batchId', 'name subject')
    .populate('planId', 'name type price duration')
    .sort({ status: 1, expiryDate: -1 });
  return ok(res, subs);
});

/**
 * Student: do I currently have access to a given batch (or subject/premium)?
 *   GET /api/subscriptions/me/access/:batchId
 *   ?subject=<name>     → also pass subject to check subject-scoped plans
 *   ?premium=1          → check premium-only plans (no batchId required)
 *
 * Returns the first active subscription that grants the requested scope.
 * Access logic:
 *   - type='all_access' → always grants
 *   - type='batch'             → batchId must match
 *   - type='specific_batches'  → batchId must be in batchIds[]
 *   - type='subject'           → subject query param must equal sub.subject
 *   - type='multi_subject'     → subject must be in sub.subjects[]
 *   - type='premium_only'      → only when ?premium=1 query is set
 */
export const myAccess = asyncHandler(async (req, res) => {
  const now = new Date();
  const { batchId } = req.params;
  const subject = req.query.subject || '';
  const premium = req.query.premium === '1' || req.query.premium === 'true';

  // Fetch ALL active subscriptions for this user once, then evaluate in memory.
  const subs = await Subscription.find({
    userId: req.user.id,
    status: 'active',
    expiryDate: { $gt: now },
  });

  // Evaluate subscriptions sequentially (may need to fetch batch metadata).
  let matched = null;
  for (const s of subs) {
    if (s.type === 'all_access') { matched = s; break; }
    if (premium && (s.type === 'premium_only' || s.grantsPremiumContent)) { matched = s; break; }
    if (batchId) {
      if (s.type === 'batch' && String(s.batchId) === String(batchId)) { matched = s; break; }
      if (s.type === 'specific_batches' && (s.batchIds || []).map(String).includes(String(batchId))) { matched = s; break; }
      // If subscription has accessSelectors, evaluate against batch metadata
      if (s.accessSelectors && Object.keys(s.accessSelectors || {}).length > 0) {
        const batch = await Batch.findById(batchId).lean();
        if (batch) {
          if (matchesAccess(s.accessSelectors, { board: batch.board, state: batch.state, classLevel: batch.classLevel, batchId })) {
            matched = s; break;
          }
        }
      }
    }
    if (subject) {
      if (s.type === 'subject' && s.subject === subject) { matched = s; break; }
      if (s.type === 'multi_subject' && (s.subjects || []).includes(subject)) { matched = s; break; }
    }
  }

  return ok(res, { hasAccess: Boolean(matched), subscription: matched });
});

/** Admin: list all subscriptions with optional filters. */
export const adminList = asyncHandler(async (req, res) => {
  const { status, type, userId, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (userId) filter.userId = userId;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Subscription.find(filter)
      .populate('userId', 'name email')
      .populate('batchId', 'name')
      .populate('planId', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Subscription.countDocuments(filter),
  ]);
  return paginate(res, items, total, Number(page), Number(limit));
});

/**
 * Admin: manually grant a subscription (e.g. cash payment, free access).
 */
export const adminGrant = asyncHandler(async (req, res) => {
  const { userId, planId, batchId, type, durationDays, planName } = req.body;
  if (!userId || !type) throw new ApiError(400, 'userId and type are required');
  if (type === 'batch' && !batchId) throw new ApiError(400, 'batchId required for batch type');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  let durDays = durationDays;
  let resolvedPlanName = planName || (type === 'all_access' ? 'All Access (manual)' : 'Batch (manual)');

  let plan = null;
  if (planId) {
    plan = await Plan.findById(planId);
    if (!plan) throw new ApiError(404, 'Plan not found');
    durDays = durDays || plan.duration;
    resolvedPlanName = resolvedPlanName || plan.name;
  }
  if (!durDays || durDays < 1) throw new ApiError(400, 'durationDays is required when no planId');

  if (type === 'batch') {
    const batch = await Batch.findById(batchId);
    if (!batch) throw new ApiError(404, 'Batch not found');
  }

  const start = new Date();
  const expiry = new Date(start.getTime() + durDays * 86400000);

  const sub = await Subscription.create({
    userId,
    planId: planId || undefined,
    batchId: type === 'batch' ? batchId : null,
    type,
    planName: resolvedPlanName,
    startDate: start,
    expiryDate: expiry,
    status: 'active',
    accessSelectors: plan?.accessSelectors || { boards: [], states: [], classes: [], batches: [] },
    metadata: { source: 'admin-manual', grantedBy: req.user.id },
  });

  return ok(res, sub, 'Subscription granted');
});

/** Admin: extend an existing subscription by N days. */
export const adminExtend = asyncHandler(async (req, res) => {
  const { days } = req.body;
  if (!days || days < 1) throw new ApiError(400, 'days must be ≥ 1');
  const sub = await Subscription.findById(req.params.id);
  if (!sub) throw new ApiError(404, 'Subscription not found');
  const base = sub.expiryDate > new Date() ? sub.expiryDate : new Date();
  sub.expiryDate = new Date(base.getTime() + days * 86400000);
  if (sub.status === 'expired') sub.status = 'active';
  await sub.save();
  return ok(res, sub, 'Subscription extended');
});

export const adminCancel = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) throw new ApiError(404, 'Subscription not found');
  sub.status = 'cancelled';
  await sub.save();
  return ok(res, sub, 'Subscription cancelled');
});

/**
 * Activate or extend a subscription for a user after a successful payment.
 * Used internally by the payments flow.
 *
 * Behaviour:
 *   - If the user already has an active subscription of the same `type` and
 *     `batchId`, the expiry is *extended* by `durationDays`.
 *   - Otherwise a new active subscription is created starting today.
 */
export const provisionFromPayment = async (payment) => {
  const now = new Date();

  // Snapshot access scope from the Plan at purchase time. Future plan edits
  // do NOT retroactively change what an existing active subscriber can see.
  const plan = payment.planId ? await Plan.findById(payment.planId) : null;
  const accessSnapshot = {
    batchIds: plan?.batchIds?.length ? plan.batchIds : [],
    subjects: plan?.subjects?.length ? plan.subjects : [],
    subject: plan?.subject || '',
    grantsPremiumContent: plan?.grantsPremiumContent || (payment.planType === 'all_access'),
    accessSelectors: plan?.accessSelectors || { boards: [], states: [], classes: [], batches: [] },
  };

  const filter = {
    userId: payment.userId,
    type: payment.planType,
    status: 'active',
    expiryDate: { $gt: now },
  };
  if (payment.planType === 'batch') filter.batchId = payment.batchId;
  else filter.batchId = null;

  let sub = await Subscription.findOne(filter);
  if (sub) {
    sub.expiryDate = new Date(sub.expiryDate.getTime() + payment.durationDays * 86400000);
    sub.amountPaid += payment.amount / 100;
    sub.paymentIds.push(payment._id);
    await sub.save();
  } else {
    sub = await Subscription.create({
      userId: payment.userId,
      planId: payment.planId,
      batchId: payment.planType === 'batch' ? payment.batchId : null,
      type: payment.planType,
      planName: payment.planName,
      amountPaid: payment.amount / 100,
      startDate: now,
      expiryDate: new Date(now.getTime() + payment.durationDays * 86400000),
      status: 'active',
      paymentIds: [payment._id],
      ...accessSnapshot,
    });
  }
  return sub;
};
