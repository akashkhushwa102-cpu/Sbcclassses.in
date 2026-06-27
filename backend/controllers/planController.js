import Joi from 'joi';
import Plan from '../models/Plan.js';
import { matchesAccess } from '../utils/accessControl.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';

export const planSchema = Joi.object({
  name: Joi.string().min(2).max(160).required(),
  // Access scope:
  //   batch / specific_batches  → batch(es) access
  //   subject / multi_subject   → subject(s) access
  //   all_access                → everything
  //   premium_only              → only premium-flagged content
  type: Joi.string().valid(
    'batch', 'subject', 'all_access',
    'specific_batches', 'multi_subject', 'premium_only'
  ).required(),
  batchId:  Joi.string().allow(null, ''),
  subject:  Joi.string().allow('', null).max(80),
  batchIds: Joi.array().items(Joi.string()).default([]),
  subjects: Joi.array().items(Joi.string().max(80)).default([]),
  accessSelectors: Joi.object({
    boards: Joi.array().items(Joi.string()).default([]),
    states: Joi.array().items(Joi.string()).default([]),
    classes: Joi.array().items(Joi.alternatives().try(Joi.number().integer().min(6).max(12), Joi.string().valid('All Classes'))).default([]),
    batches: Joi.array().items(Joi.string()).default([]),
  }).default(),
  grantsPremiumContent: Joi.boolean().default(false),
  description: Joi.string().allow(''),
  price: Joi.number().min(0).required(),
  duration: Joi.number().integer().min(1).required(),
  billingCycle: Joi.string().valid('monthly', 'quarterly', 'annual', 'lifetime', 'custom'),
  features: Joi.array().items(Joi.string()),
  // Percentage discount (0-100). Shown on student subscription page.
  offerPercentage: Joi.number().min(0).max(100).default(0),
  isActive: Joi.boolean(),
  sortOrder: Joi.number(),
});

export const listPlans = asyncHandler(async (req, res) => {
  const { type, includeInactive } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (!includeInactive) filter.isActive = true;
  // Pull raw plans, then optionally apply onboarding-based filtering using accessSelectors
  const plans = await Plan.find(filter).sort({ sortOrder: 1, price: 1 });

  // Optional client-side onboarding filters: board, state, class
  const { board, state, class: classQuery, classLevel } = req.query;
  const classVal = classQuery || classLevel;

  if (board || state || classVal) {
    const filtered = plans.filter((p) => {
      try {
        return matchesAccess(p.accessSelectors || {}, {
          board: board || undefined,
          state: state || undefined,
          classLevel: classVal != null ? Number(classVal) : undefined,
        });
      } catch (e) {
        // If matching fails, exclude the plan to be safe
        return false;
      }
    });
    return ok(res, filtered);
  }

  return ok(res, plans);
});

export const getPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) throw new ApiError(404, 'Plan not found');
  return ok(res, plan);
});

export const createPlan = asyncHandler(async (req, res) => {
  // Validate incoming payload
  await planSchema.validateAsync(req.body);
  const plan = await Plan.create(req.body);
  return created(res, plan, 'Plan created');
});

export const updatePlan = asyncHandler(async (req, res) => {
  // Allow partial updates — validate only provided keys
  const updateSchema = planSchema.fork(Object.keys(req.body || {}), (s) => s.optional());
  await updateSchema.validateAsync(req.body);
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!plan) throw new ApiError(404, 'Plan not found');
  return ok(res, plan, 'Plan updated');
});

export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findByIdAndDelete(req.params.id);
  if (!plan) throw new ApiError(404, 'Plan not found');
  return ok(res, null, 'Plan deleted');
});
