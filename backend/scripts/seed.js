/* Optional dev seed: an admin, a teacher, two batches, two plans. */
import '../config/env.js';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Plan from '../models/Plan.js';
import logger from '../utils/logger.js';

const run = async () => {
  await connectDB();

  const admin = await User.findOneAndUpdate(
    { email: env.bootstrapAdmin.email },
    { $setOnInsert: { name: env.bootstrapAdmin.name, role: 'admin' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (!admin.password) {
    admin.password = env.bootstrapAdmin.password;
    await admin.save();
  }

  const teacherEmail = 'teacher@sbcclasses.com';
  let teacher = await User.findOne({ email: teacherEmail });
  if (!teacher) {
    teacher = await User.create({
      name: 'Demo Teacher',
      email: teacherEmail,
      password: 'Teacher@123',
      role: 'teacher',
      subjects: ['Mathematics', 'Physics'],
    });
  }

  const batches = [
    {
      name: 'Class 10 — Foundation Batch',
      description: 'Complete CBSE Class 10 syllabus with weekly tests.',
      subject: 'All Subjects',
      level: 'Class 10',
      price: 1499,
      duration: 90,
      teacherId: teacher._id,
      isPublished: true,
      features: ['Live classes', 'Recorded lectures', 'Doubt sessions', 'Mock tests'],
    },
    {
      name: 'JEE Main — Crash Course',
      description: 'Intensive 60-day JEE Main preparation.',
      subject: 'Physics, Chemistry, Maths',
      level: 'JEE Main',
      price: 2999,
      duration: 60,
      teacherId: teacher._id,
      isPublished: true,
      features: ['Daily live classes', 'Test series', 'Previous year solving'],
    },
  ];
  for (const b of batches) {
    await Batch.findOneAndUpdate({ name: b.name }, b, { upsert: true, new: true });
  }

  const plans = [
    {
      name: 'All Access — Monthly',
      type: 'all_access',
      price: 999,
      duration: 30,
      billingCycle: 'monthly',
      features: ['Access to ALL batches', 'All recordings', 'Live classes'],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'All Access — Lifetime',
      type: 'all_access',
      price: 14999,
      duration: 36500,
      billingCycle: 'lifetime',
      features: ['One-time payment', 'Access to ALL batches forever'],
      isActive: true,
      sortOrder: 2,
    },
  ];
  for (const p of plans) {
    await Plan.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true });
  }

  logger.info('Seed complete');
  logger.info(`Admin: ${env.bootstrapAdmin.email} / ${env.bootstrapAdmin.password}`);
  logger.info(`Teacher: ${teacherEmail} / Teacher@123`);

  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  logger.error('Seed failed', { error: err.message });
  process.exit(1);
});
