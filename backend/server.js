/* ============================================================
   SBC CLASSES — PRODUCTION BACKEND  (v4.0)
   Node.js + Express + MongoDB (Mongoose) + Paytm UPI
   ============================================================ */
import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import env from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { ensureBootstrapAdmin } from './utils/bootstrapAdmin.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { startCronJobs } from './utils/cron.js';

const app = express();
app.set('trust proxy', 1);

// ---- Security & infra middleware ----
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin (no Origin header) and the configured frontend.
    const allowed = [env.frontendUrl, 'https://sbcclassses.in', 'https://www.sbcclassses.in'];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(null, true); // permissive — tighten in your deployment if needed
  },
  credentials: true,
}));
app.use(compression());
app.use(cookieParser(env.cookieSecret));

// ---- Body parsers ----
// Paytm callbacks are application/x-www-form-urlencoded; JSON for the API.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());

// ---- Logging ----
if (env.nodeEnv !== 'test') {
  app.use(
    morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http?.(msg.trim()) || logger.info(msg.trim()) },
    })
  );
}

// ---- Rate limit & API ----
app.use('/api', generalLimiter, routes);

// ---- Health root ----
app.get('/', (_req, res) =>
  res.json({ service: 'SBC Coaching Classes API', status: 'OK', version: '4.0.0' })
);

// ---- 404 + Error ----
app.use(notFound);
app.use(errorHandler);

// ---- Boot ----
const start = async () => {
  try {
    await connectDB();
    // Ensure a bootstrap admin user exists (uses BOOTSTRAP_ADMIN_* env vars)
    await ensureBootstrapAdmin();
    startCronJobs();
    app.listen(env.port, () => {
      logger.info(`SBC backend listening on http://localhost:${env.port} (${env.nodeEnv})`);
      logger.info(`Frontend URL allowed: ${env.frontendUrl}`);
      logger.info(`Paytm gateway: ${env.paytm.gatewayUrl} (MID=${env.paytm.mid})`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', () => process.exit(0));
process.on('unhandledRejection', (reason) =>
  logger.error('Unhandled rejection', { reason: reason?.message || reason })
);
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message });
  process.exit(1);
});

export default app;
