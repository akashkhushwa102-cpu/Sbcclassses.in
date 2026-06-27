import '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import Plan from '../models/Plan.js';

const run = async () => {
  try {
    await connectDB();
    const name = `SMOKE_TEST_PLAN_${Date.now()}`;
    const data = {
      name,
      type: 'all_access',
      price: 10,
      duration: 30,
      description: 'Smoke test plan',
      billingCycle: 'monthly',
      isActive: true,
      metadata: { smoke: true },
    };
    const created = await Plan.create(data);
    console.log('CREATED_PLAN_ID', created._id);

    const found = await Plan.findById(created._id).lean();
    console.log('FOUND:', !!found, 'NAME:', found?.name);

    // Clean up
    await Plan.findByIdAndDelete(created._id);
    console.log('CLEANED_UP');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('SMOKE_TEST_FAILED', err.message || err);
    try { await disconnectDB(); } catch (_) {}
    process.exit(2);
  }
};

run();
