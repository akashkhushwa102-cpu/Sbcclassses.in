import env from '../config/env.js';
import User from '../models/User.js';
import logger from './logger.js';

export const ensureBootstrapAdmin = async () => {
  try {
    const email = env.bootstrapAdmin.email;
    if (!email) return;
    const existing = await User.findOne({ email });
    if (existing) {
      logger.info(`Bootstrap admin exists: ${email}`);
      return;
    }
    const admin = await User.create({
      name: env.bootstrapAdmin.name,
      email: email,
      password: env.bootstrapAdmin.password,
      role: 'admin',
    });
    logger.info(`Bootstrap admin created: ${admin.email}`);
  } catch (err) {
    logger.error('ensureBootstrapAdmin failed', { error: err.message });
  }
};

export default ensureBootstrapAdmin;
