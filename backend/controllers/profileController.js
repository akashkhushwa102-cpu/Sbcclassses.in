import Profile from '../models/Profile.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { created, ok } from '../utils/response.js';

export const createOrUpdateProfile = asyncHandler(async (req, res) => {
  const { email, supabaseId, profile, role } = req.body || {};
  if (!email) throw new ApiError(400, 'Email is required');
  const q = { email: email.toLowerCase() };
  let p = await Profile.findOne(q);
  if (!p) {
    p = await Profile.create({ email: q.email, supabaseId, role: role || 'student', onboarding: profile || {} });
    return created(res, p, 'Profile created');
  }
  p.supabaseId = supabaseId || p.supabaseId;
  p.role = role || p.role;
  p.onboarding = Object.assign({}, p.onboarding || {}, profile || {});
  await p.save();
  return ok(res, p, 'Profile updated');
});

export const getMyProfile = asyncHandler(async (req, res) => {
  // Authenticated: return profile for current user
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const email = req.user.email && String(req.user.email).toLowerCase();
  let p = null;
  if (email) p = await Profile.findOne({ email });
  if (!p && req.user.id) p = await Profile.findOne({ supabaseId: req.user.id });
  if (!p) return ok(res, null);
  return ok(res, p);
});

export const getProfileByEmail = asyncHandler(async (req, res) => {
  const email = (req.query.email || '').toLowerCase();
  if (!email) throw new ApiError(400, 'email query required');
  const p = await Profile.findOne({ email });
  if (!p) return ok(res, null);
  return ok(res, p);
});

export default { createOrUpdateProfile };
