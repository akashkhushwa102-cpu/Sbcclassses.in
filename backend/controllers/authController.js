import Joi from 'joi';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';
import Profile from '../models/Profile.js';
import { ok, created } from '../utils/response.js';

const sanitize = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
};

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\d{10,15}$/).optional().allow(''),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher').default('student'),
  inviteCode: Joi.string().optional().allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, profile } = req.body;
  const { inviteCode } = req.body || {};
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email is already registered');

  // Protect teacher registrations: require a server-side invite code
  if (role === 'teacher') {
    const expected = process.env.TEACHER_INVITE_CODE || '';
    if (!expected) throw new ApiError(403, 'Teacher registration is disabled');
    if (!inviteCode || inviteCode !== expected) throw new ApiError(403, 'Invalid teacher invite code');
  }

  const user = await User.create({ name, email, phone, password, role });
  // If onboarding profile provided (board/state/class), persist into Profile
  try {
    if (role === 'student' && profile && email) {
      const q = { email: String(email).toLowerCase() };
      let p = await Profile.findOne(q);
      if (!p) {
        await Profile.create({ email: q.email, role: 'student', onboarding: profile });
      } else {
        p.onboarding = Object.assign({}, p.onboarding || {}, profile || {});
        await p.save();
      }
    }
  } catch (err) {
    // Non-fatal: profile persistence should not block registration
    console.warn('Failed saving profile during register:', err.message);
  }
  const token = signToken({ id: user._id, role: user.role });
  return created(res, { token, user: sanitize(user) }, 'Registration successful');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (user.status === 'blocked') throw new ApiError(403, 'Account is blocked');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role });
  return ok(res, { token, user: sanitize(user) }, 'Login successful');
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  return ok(res, sanitize(user));
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token');
  return ok(res, null, 'Logged out');
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    throw new ApiError(400, 'New password must be at least 6 characters');

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  const match = await user.comparePassword(currentPassword || '');
  if (!match) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  return ok(res, null, 'Password updated');
});
