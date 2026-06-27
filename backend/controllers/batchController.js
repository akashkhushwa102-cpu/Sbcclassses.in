import Joi from 'joi';
import Batch from '../models/Batch.js';
import Profile from '../models/Profile.js';
import Subscription from '../models/Subscription.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created, paginate } from '../utils/response.js';
import { matchesAccess } from '../utils/accessControl.js';

export const batchSchema = Joi.object({
  name: Joi.string().min(2).max(160).required(),
  description: Joi.string().allow(''),
  subject: Joi.string().allow(''),
  level: Joi.string().allow(''),
  price: Joi.number().min(0).required(),
  duration: Joi.number().integer().min(1).required(),
  capacity: Joi.number().integer().min(0),
  schedule: Joi.string().allow(''),
  teacherId: Joi.string().allow('', null),
  coverImage: Joi.string().uri().allow(''),
  features: Joi.array().items(Joi.string()),
  isPublished: Joi.boolean(),
  board: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  classLevel: Joi.number().integer().min(6).max(12).allow(null),
});

const batchUpdateSchema = batchSchema.fork(
  ['name', 'price', 'duration'],
  (s) => s.optional()
);

/**
 * Public — list published batches.  Admin/teacher can request `?all=1`
 * to see drafts as well.
 */
export const listBatches = asyncHandler(async (req, res) => {
  const { all, q, teacherId, page = 1, limit = 50 } = req.query;
  const filter = {};
  const isPrivileged = req.user && ['admin', 'teacher'].includes(req.user.role);
  if (!(all && isPrivileged)) {
    filter.isPublished = true;
  }
  if (teacherId) filter.teacherId = teacherId;
  if (q) filter.$or = [
    { name: new RegExp(q, 'i') },
    { subject: new RegExp(q, 'i') },
  ];

  // If requester is a student, restrict batches to those matching their onboarding
  if (req.user && req.user.role === 'student') {
    try {
      const email = req.user.email && String(req.user.email).toLowerCase();
      const profile = email ? await Profile.findOne({ email }) : null;
      const onboarding = profile && profile.onboarding ? profile.onboarding : (req.user.onboarding || null);
      if (onboarding) {
        const bCond = [];
        // Board: allow 'All' or matching board
        bCond.push({ $or: [ { board: 'All' }, { board: new RegExp('^' + String(onboarding.board || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } ] });
        // State: allow 'All States' or matching
        bCond.push({ $or: [ { state: 'All States' }, { state: new RegExp('^' + String(onboarding.state || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } ] });
        // Class: allow null (not class-specific) or matching numeric class
        const clsNum = onboarding.class ? Number(onboarding.class) : null;
        if (clsNum) {
          bCond.push({ $or: [ { classLevel: null }, { classLevel: clsNum } ] });
        } else {
          bCond.push({});
        }
        filter.$and = filter.$and ? filter.$and.concat(bCond) : bCond;
      }
    } catch (_) {
      // ignore profile lookup errors — fall back to broad listing
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Batch.find(filter)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Batch.countDocuments(filter),
  ]);
  return paginate(res, items, total, Number(page), Number(limit));
});

export const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id).populate('teacherId', 'name email');
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (!batch.isPublished && (!req.user || !['admin', 'teacher'].includes(req.user.role))) {
    throw new ApiError(404, 'Batch not found');
  }
  return ok(res, batch);
});

export const createBatch = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  // Validate
  await batchSchema.validateAsync(data);
  if (!data.teacherId && req.user.role === 'teacher') data.teacherId = req.user.id;
  const batch = await Batch.create(data);
  return created(res, batch, 'Batch created');
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (req.user.role === 'teacher' && String(batch.teacherId) !== req.user.id) {
    throw new ApiError(403, 'You can only edit your own batches');
  }
  // Validate provided fields
  const updateSchema = batchUpdateSchema.fork(Object.keys(req.body || {}), (s) => s.optional());
  await updateSchema.validateAsync(req.body);
  Object.assign(batch, req.body);
  await batch.save();
  return ok(res, batch, 'Batch updated');
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  await batch.deleteOne();
  return ok(res, null, 'Batch deleted');
});

export const togglePublish = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  batch.isPublished = !batch.isPublished;
  await batch.save();
  return ok(res, batch, `Batch ${batch.isPublished ? 'published' : 'unpublished'}`);
});

/**
 * Returns whether the current user can access this batch's content.
 * Admins/teachers always can; students need an active matching subscription.
 */
export const checkAccess = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Batch not found');

  if (!req.user) return ok(res, { hasAccess: false, reason: 'unauthenticated' });
  if (['admin', 'teacher'].includes(req.user.role))
    return ok(res, { hasAccess: true, reason: 'staff' });

  const now = new Date();
  const subs = await Subscription.find({ userId: req.user.id, status: 'active', expiryDate: { $gt: now } });
  // Evaluate subs for matching access
  for (const s of subs) {
    if (s.type === 'all_access') return ok(res, { hasAccess: true, reason: 'all_access', subscription: s });
    if (s.type === 'batch' && String(s.batchId) === String(batch._id)) return ok(res, { hasAccess: true, reason: 'batch', subscription: s });
    if (s.type === 'specific_batches' && (s.batchIds || []).map(String).includes(String(batch._id))) return ok(res, { hasAccess: true, reason: 'specific_batches', subscription: s });
    if (s.accessSelectors && Object.keys(s.accessSelectors || {}).length > 0) {
      if (matchesAccess(s.accessSelectors, { board: batch.board, state: batch.state, classLevel: batch.classLevel, batchId: batch._id })) {
        return ok(res, { hasAccess: true, reason: 'selectors', subscription: s });
      }
    }
  }
  return ok(res, { hasAccess: false, reason: 'no_subscription' });
});

export { batchUpdateSchema };
