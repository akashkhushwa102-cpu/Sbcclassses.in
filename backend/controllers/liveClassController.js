import LiveClass from '../models/LiveClass.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';

export const createLiveClass = asyncHandler(async (req, res) => {
  const { topic, description, batchId, teacherId, startAt, durationMinutes, joinUrl } = req.body;
  if (!topic || !batchId || !startAt) throw new ApiError(400, 'Missing required fields');

  // Ensure batch exists
  const batch = await Batch.findById(batchId);
  if (!batch) throw new ApiError(404, 'Batch not found');

  const lc = await LiveClass.create({ topic, description, batchId, teacherId, startAt: new Date(startAt), durationMinutes: durationMinutes || 60, joinUrl });

  // Link to batch by incrementing a counter (we avoid storing ids array to keep batch small)
  batch.metadata = batch.metadata || {};
  batch.metadata.lastLiveClassAt = lc.startAt;
  await batch.save();

  // Update enrolled students' metadata.schedule to include this class reference
  const students = await User.find({ role: 'student', enrolledBatches: batchId });
  await Promise.all(students.map(async (s) => {
    s.metadata = s.metadata || {};
    s.metadata.scheduledClasses = s.metadata.scheduledClasses || [];
    s.metadata.scheduledClasses.push({ liveClassId: lc._id, topic: lc.topic, startAt: lc.startAt, durationMinutes: lc.durationMinutes, batchId });
    await s.save();
  }));

  return created(res, lc, 'Live class scheduled');
});

export const listLiveClasses = asyncHandler(async (req, res) => {
  const { batchId, upcoming } = req.query;
  const q = {};
  if (batchId) q.batchId = batchId;
  if (upcoming === '1') q.startAt = { $gte: new Date() };
  const items = await LiveClass.find(q).sort({ startAt: 1 }).limit(200);
  return ok(res, items);
});

export const getLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lc = await LiveClass.findById(id);
  if (!lc) throw new ApiError(404, 'Live class not found');
  return ok(res, lc);
});

export const updateLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const lc = await LiveClass.findByIdAndUpdate(id, updates, { new: true });
  if (!lc) throw new ApiError(404, 'Live class not found');
  return ok(res, lc, 'Live class updated');
});

export const deleteLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await LiveClass.findByIdAndDelete(id);
  return ok(res, null, 'Live class deleted');
});

export default {
  createLiveClass,
  listLiveClasses,
  getLiveClass,
  updateLiveClass,
  deleteLiveClass,
};
