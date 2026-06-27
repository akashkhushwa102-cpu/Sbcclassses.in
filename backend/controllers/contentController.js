import Joi from 'joi';
import Content from '../models/Content.js';
import Batch from '../models/Batch.js';
import Subscription from '../models/Subscription.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';

export const contentSchema = Joi.object({
  batchId: Joi.string().required(),
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow(''),
  type: Joi.string().valid('video', 'document', 'note', 'live', 'recording', 'link').required(),
  url: Joi.string().uri().allow(''),
  durationMinutes: Joi.number().min(0),
  isPublished: Joi.boolean(),
  sortOrder: Joi.number(),
});

const userHasBatchAccess = async (userId, role, batchId) => {
  if (role === 'admin' || role === 'teacher') return true;
  const sub = await Subscription.findOne({
    userId,
    status: 'active',
    expiryDate: { $gt: new Date() },
    $or: [{ type: 'all_access' }, { batchId }],
  });
  return Boolean(sub);
};

export const listByBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const batch = await Batch.findById(batchId);
  if (!batch) throw new ApiError(404, 'Batch not found');

  if (req.user) {
    const hasAccess = await userHasBatchAccess(req.user.id, req.user.role, batchId);
    if (!hasAccess) throw new ApiError(403, 'No active subscription for this batch');
  } else {
    throw new ApiError(401, 'Authentication required');
  }
  const items = await Content.find({ batchId, isPublished: true }).sort({ sortOrder: 1, createdAt: 1 });
  return ok(res, items);
});

export const create = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.body.batchId);
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (req.user.role === 'teacher' && String(batch.teacherId) !== req.user.id) {
    throw new ApiError(403, 'You can only upload content to your own batches');
  }
  const item = await Content.create({ ...req.body, uploadedBy: req.user.id });
  return created(res, item, 'Content added');
});

export const update = asyncHandler(async (req, res) => {
  const item = await Content.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Content not found');
  Object.assign(item, req.body);
  await item.save();
  return ok(res, item, 'Content updated');
});

export const remove = asyncHandler(async (req, res) => {
  const item = await Content.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Content not found');
  return ok(res, null, 'Content deleted');
});
