import Joi from 'joi';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created, paginate } from '../utils/response.js';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\d{10,15}$/).allow(''),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher', 'admin').required(),
  rollNo: Joi.string().allow(''),
  subjects: Joi.array().items(Joi.string()),
  qualifications: Joi.string().allow(''),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  phone: Joi.string().pattern(/^\d{10,15}$/).allow(''),
  status: Joi.string().valid('active', 'blocked'),
  rollNo: Joi.string().allow(''),
  subjects: Joi.array().items(Joi.string()),
  qualifications: Joi.string().allow(''),
  enrolledBatches: Joi.array().items(Joi.string()),
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, q, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { rollNo: new RegExp(q, 'i') },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  return paginate(res, users, total, Number(page), Number(limit));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('enrolledBatches', 'name subject');
  if (!user) throw new ApiError(404, 'User not found');
  return ok(res, user);
});

export const createUser = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw new ApiError(409, 'Email already exists');
  const user = await User.create(req.body);
  return created(res, user, 'User created');
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, 'User not found');
  return ok(res, user, 'User updated');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  return ok(res, null, 'User deleted');
});

export const toggleBlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.status = user.status === 'blocked' ? 'active' : 'blocked';
  await user.save();
  return ok(res, user, `User ${user.status}`);
});
