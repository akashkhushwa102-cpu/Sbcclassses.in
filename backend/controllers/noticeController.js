import Joi from 'joi';
import Notice from '../models/Notice.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';

export const noticeSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  body: Joi.string().min(1).required(),
  audience: Joi.string().valid('all', 'students', 'teachers').default('all'),
  batchId: Joi.string().allow(null, ''),
  pinned: Joi.boolean(),
  isPublished: Joi.boolean(),
});

export const list = asyncHandler(async (req, res) => {
  const { audience, batchId } = req.query;
  const filter = { isPublished: true };
  if (audience) filter.audience = { $in: [audience, 'all'] };
  if (batchId) filter.$or = [{ batchId }, { batchId: null }];
  const notices = await Notice.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(200);
  return ok(res, notices);
});

export const create = asyncHandler(async (req, res) => {
  const notice = await Notice.create({ ...req.body, createdBy: req.user.id });
  return created(res, notice, 'Notice posted');
});

export const update = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!notice) throw new ApiError(404, 'Notice not found');
  return ok(res, notice, 'Notice updated');
});

export const remove = asyncHandler(async (req, res) => {
  const n = await Notice.findByIdAndDelete(req.params.id);
  if (!n) throw new ApiError(404, 'Notice not found');
  return ok(res, null, 'Notice deleted');
});
