import { Router } from 'express';
import auth from './auth.js';
import users from './users.js';
import batches from './batches.js';
import plans from './plans.js';
import subscriptions from './subscriptions.js';
import payments from './payments.js';
import notices from './notices.js';
import content from './content.js';
import admin from './admin.js';
import liveClasses from './liveClasses.js';
// Paytm Supabase stack — superseded by Mongoose-based /api/payments/initiate
// + /api/payments/paytm/callback flow. Disabled to avoid duplicate implementations.
// import paytm from './paytm.js';
// PhonePe payment gateway with webhook signature verification.
import phonepe from './phonepe.js';
import profiles from './profiles.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ status: 'OK', service: 'sbc-backend', time: new Date().toISOString() })
);

router.use('/auth', auth);
router.use('/users', users);
router.use('/batches', batches);
router.use('/plans', plans);
router.use('/subscriptions', subscriptions);
router.use('/payments', payments);
router.use('/notices', notices);
router.use('/content', content);
router.use('/admin', admin);
router.use('/live-classes', liveClasses);
// router.use('/paytm', paytm);  // disabled — use /api/payments/* instead
router.use('/phonepe', phonepe);
router.use('/profiles', profiles);

export default router;
