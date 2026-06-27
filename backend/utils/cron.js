import cron from 'node-cron';
import Subscription from '../models/Subscription.js';
import logger from './logger.js';
import LiveClass from '../models/LiveClass.js';

// Update live class statuses: scheduled -> live when startAt reached; live -> ended when past end time
const updateLiveClassStatuses = async () => {
  const now = new Date();
  try {
    // Start classes whose startAt <= now and status is scheduled
    const toStart = await LiveClass.updateMany(
      { status: 'scheduled', startAt: { $lte: now } },
      { $set: { status: 'live' } }
    );
    if (toStart.modifiedCount > 0) logger.info(`LiveClass cron: started ${toStart.modifiedCount} class(es)`);

    // End classes whose startAt + durationMinutes <= now and status is live or scheduled
    const ended = await LiveClass.updateMany(
      { status: { $in: ['live','scheduled'] }, $expr: { $lte: [ { $add: ['$startAt', { $multiply: ['$durationMinutes', 60000] }] }, now ] } },
      { $set: { status: 'ended' } }
    );
    if (ended.modifiedCount > 0) logger.info(`LiveClass cron: ended ${ended.modifiedCount} class(es)`);
  } catch (e) {
    logger.error('LiveClass cron error', { error: e.message });
  }
};

// Runs hourly: mark active+expired subscriptions as expired.
const expireSubscriptions = async () => {
  const now = new Date();
  const res = await Subscription.updateMany(
    { status: 'active', expiryDate: { $lte: now } },
    { $set: { status: 'expired' } }
  );
  if (res.modifiedCount > 0) {
    logger.info(`Subscription cron: expired ${res.modifiedCount} subscription(s)`);
  }
};

export const startCronJobs = () => {
  // Every hour at minute 5
  cron.schedule('5 * * * *', () => {
    expireSubscriptions().catch((e) =>
      logger.error('Subscription cron error', { error: e.message })
    );
  });

  // Every minute: update live class statuses
  cron.schedule('* * * * *', () => {
    updateLiveClassStatuses().catch((e) => logger.error('LiveClass cron error', { error: e.message }));
  });
  logger.info('Cron jobs started');
};
