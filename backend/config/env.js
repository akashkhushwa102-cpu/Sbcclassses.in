import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/ (one level up from config/)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    // Soft warn instead of crash so `npm run create-admin` can still print useful errors
    // eslint-disable-next-line no-console
    console.warn(`[env] WARNING: ${key} is not set`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Optional Postgres/Supabase connection string (used when running against Supabase Postgres)
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  // Supabase configuration (backend may use these for server-side clients)
  supabase: {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY,
    jwksUrl: process.env.VITE_SUPABASE_JWKS_URL || process.env.SUPABASE_JWKS_URL,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'SBC Classes <noreply@sbcclasses.com>',
  },
  paytm: {
    mid: process.env.PAYTM_MID || 'YOUR_MID_HERE',
    key: process.env.PAYTM_KEY || 'YOUR_KEY_HERE',
    website: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
    gatewayUrl: process.env.PAYTM_GATEWAY_URL || 'https://securegw-stage.paytm.in',
    industryType: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
    channelId: process.env.PAYTM_CHANNEL_ID || 'WEB',
    callbackUrl: process.env.PAYTM_CALLBACK_URL || 'http://localhost:5000/api/payments/paytm/callback',
  },
  bootstrapAdmin: {
    name: process.env.BOOTSTRAP_ADMIN_NAME || 'Super Admin',
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@sbcclasses.com',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'ChangeThisStrong#1',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default env;
