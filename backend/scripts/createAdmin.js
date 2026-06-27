/* Bootstraps the first admin user if none exists. */
import '../config/env.js';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const run = async () => {
  await connectDB();
  const existing = await User.findOne({ email: env.bootstrapAdmin.email });
  if (existing) {
    logger.info(`Admin already exists: ${existing.email}`);
  } else {
    const admin = await User.create({
      name: env.bootstrapAdmin.name,
      email: env.bootstrapAdmin.email,
      password: env.bootstrapAdmin.password,
      role: 'admin',
    });
    logger.info(`Admin created: ${admin.email} (password from BOOTSTRAP_ADMIN_PASSWORD)`);
  }
  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  logger.error('createAdmin failed', { error: err.message });
  process.exit(1);
});
