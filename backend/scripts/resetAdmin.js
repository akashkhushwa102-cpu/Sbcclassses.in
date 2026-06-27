/* Resets the bootstrap admin's password to BOOTSTRAP_ADMIN_PASSWORD from .env.
   Use this when `create-admin` says "Admin already exists" but you forgot
   the password / 401 on login.
   Usage: cd backend && npm run reset-admin
*/
import '../config/env.js';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const run = async () => {
  await connectDB();
  const email = env.bootstrapAdmin.email;
  const password = env.bootstrapAdmin.password;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: env.bootstrapAdmin.name,
      email,
      password,
      role: 'admin',
    });
    logger.info(`Admin created fresh: ${email}`);
  } else {
    user.password = password;          // pre-save hook will hash it
    user.role = 'admin';
    user.status = 'active';
    await user.save();
    logger.info(`Admin reset: ${email} (password updated, role=admin, status=active)`);
  }
  logger.info('Login with:');
  logger.info('  Email:    ' + email);
  logger.info('  Password: ' + password);
  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  logger.error('resetAdmin failed', { error: err.message });
  process.exit(1);
});
