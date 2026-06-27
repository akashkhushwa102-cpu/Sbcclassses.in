import logger from '../utils/logger.js';
import { supabase } from './supabase.js';

export const connectDB = async () => {
  // Supabase client is initialized on import; expose a resolved promise for compatibility
  logger.info('Supabase client ready');
  return Promise.resolve(supabase);
};

export const disconnectDB = async () => {
  // No-op for Supabase client
  logger.info('Supabase disconnect no-op');
  return Promise.resolve();
};

export default { connectDB, disconnectDB };
