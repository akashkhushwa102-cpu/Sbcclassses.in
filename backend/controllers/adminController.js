import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const dashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [
    students, teachers, admins,
    batchesTotal, batchesPublished,
    activeSubs, allTimePayments, thirtyDayRevenueAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    Batch.countDocuments({}),
    Batch.countDocuments({ isPublished: true }),
    Subscription.countDocuments({ status: 'active', expiryDate: { $gt: now } }),
    Payment.countDocuments({ status: 'success' }),
    Payment.aggregate([
      { $match: {
          status: 'success',
          paidAt: { $gte: new Date(now.getTime() - 30 * 86400000) },
      } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const revenue30dPaise = thirtyDayRevenueAgg[0]?.total || 0;

  return ok(res, {
    users: { students, teachers, admins, total: students + teachers + admins },
    batches: { total: batchesTotal, published: batchesPublished },
    subscriptions: { active: activeSubs },
    payments: {
      successCount: allTimePayments,
      revenueLast30Days: revenue30dPaise / 100, // INR
      currency: 'INR',
    },
  });
});
