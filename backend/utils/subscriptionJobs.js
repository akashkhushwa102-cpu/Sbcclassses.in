/**
 * Subscription Management Jobs
 * Handles automatic subscription expiry, renewal reminders, and status updates
 */

import { SubscriptionModel } from '../models/subscription.js';
import { PaymentModel } from '../models/payment.js';
import { StudentModel } from '../models/student.js';
import { sendEmailNotification } from '../utils/email.js';

export const SubscriptionJobs = {
  /**
   * Check and deactivate expired subscriptions
   * Should be run every hour or as a cron job
   */
  async deactivateExpiredSubscriptions() {
    try {
      console.log('[Subscription Job] Checking for expired subscriptions...');
      
      const expiredSubscriptions = await SubscriptionModel.getExpiredSubscriptions();
      
      if (expiredSubscriptions.length === 0) {
        console.log('[Subscription Job] No expired subscriptions found');
        return;
      }

      console.log(`[Subscription Job] Found ${expiredSubscriptions.length} expired subscriptions`);

      for (const subscription of expiredSubscriptions) {
        try {
          // Deactivate the subscription
          await SubscriptionModel.deactivate(subscription.id);

          // Get student details for notification
          const student = await StudentModel.getById(subscription.studentId);

          // Send expiry notification email
          if (student && student.email) {
            await sendEmailNotification(
              student.email,
              'Subscription Expired',
              `Hi ${student.name},\n\nYour subscription to ${subscription.planName} has expired on ${new Date(subscription.endDate).toLocaleDateString()}.\n\nYou can renew your subscription by visiting your account dashboard.\n\nBest regards,\nSBC Classes Team`
            );
          }

          console.log(`[Subscription Job] Deactivated subscription: ${subscription.id}`);
        } catch (error) {
          console.error(`[Subscription Job] Error deactivating subscription ${subscription.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[Subscription Job] Error in deactivateExpiredSubscriptions:', error);
    }
  },

  /**
   * Send renewal reminders for subscriptions expiring soon
   * Should be run daily
   */
  async sendRenewalReminders() {
    try {
      console.log('[Subscription Job] Checking for subscriptions expiring soon...');
      
      // Get subscriptions expiring in 7 days
      const expiringSubscriptions = await SubscriptionModel.getExpiringSubscriptions(7);
      
      if (expiringSubscriptions.length === 0) {
        console.log('[Subscription Job] No subscriptions expiring soon');
        return;
      }

      console.log(`[Subscription Job] Found ${expiringSubscriptions.length} subscriptions expiring soon`);

      for (const subscription of expiringSubscriptions) {
        try {
          // Get student details
          const student = await StudentModel.getById(subscription.studentId);

          if (student && student.email) {
            const daysUntilExpiry = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            await sendEmailNotification(
              student.email,
              'Subscription Expiring Soon - Renew Now',
              `Hi ${student.name},\n\nYour ${subscription.planName} subscription will expire in ${daysUntilExpiry} days on ${new Date(subscription.endDate).toLocaleDateString()}.\n\nRenew your subscription now to continue uninterrupted access to all classes.\n\nRenew: [Your App Link]\n\nBest regards,\nSBC Classes Team`
            );

            console.log(`[Subscription Job] Sent reminder to: ${student.email}`);
          }
        } catch (error) {
          console.error(`[Subscription Job] Error sending reminder for subscription ${subscription.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[Subscription Job] Error in sendRenewalReminders:', error);
    }
  },

  /**
   * Generate subscription reports
   * Should be run daily or weekly
   */
  async generateSubscriptionReport() {
    try {
      console.log('[Subscription Job] Generating subscription report...');
      
      const stats = await SubscriptionModel.getStats();
      
      console.log('[Subscription Job] Subscription Statistics:');
      console.log(`  - Active: ${stats.active}`);
      console.log(`  - Inactive: ${stats.inactive}`);
      console.log(`  - Expired: ${stats.expired}`);
      console.log(`  - Cancelled: ${stats.cancelled}`);
      console.log(`  - Total: ${stats.total}`);

      return stats;
    } catch (error) {
      console.error('[Subscription Job] Error in generateSubscriptionReport:', error);
    }
  },

  /**
   * Retry failed payments
   * Should be run periodically (every 6 hours)
   */
  async retryFailedPayments() {
    try {
      console.log('[Subscription Job] Checking for failed payments to retry...');
      
      const failedPayments = await PaymentModel.getAll({ status: 'failed' });
      
      if (failedPayments.length === 0) {
        console.log('[Subscription Job] No failed payments to retry');
        return;
      }

      console.log(`[Subscription Job] Found ${failedPayments.length} failed payments`);

      for (const payment of failedPayments) {
        try {
          // Only retry a few times
          if (payment.attemptCount >= 3) {
            console.log(`[Subscription Job] Payment ${payment.id} has reached max retry attempts`);
            continue;
          }

          // Get student details
          const student = await StudentModel.getById(payment.studentId);

          if (student && student.email) {
            // Send retry notification
            await sendEmailNotification(
              student.email,
              'Retry Payment for Your Subscription',
              `Hi ${student.name},\n\nYour recent payment for ${payment.planName} failed.\n\nPlease try again to activate your subscription.\n\nRetry Payment: [Your App Link]\n\nIf you need help, contact our support team.\n\nBest regards,\nSBC Classes Team`
            );

            console.log(`[Subscription Job] Sent retry notification to: ${student.email}`);
          }
        } catch (error) {
          console.error(`[Subscription Job] Error processing failed payment ${payment.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[Subscription Job] Error in retryFailedPayments:', error);
    }
  },

  /**
   * Initialize all subscription jobs with cron schedule
   * Call this in server startup
   */
  initializeJobs() {
    console.log('[Subscription Jobs] Initializing background jobs...');

    // Run expiry check every hour
    setInterval(() => {
      this.deactivateExpiredSubscriptions();
    }, 60 * 60 * 1000); // 1 hour

    // Send reminders daily at 9 AM
    this.scheduleDaily(() => {
      this.sendRenewalReminders();
    }, 9); // 9 AM

    // Generate report daily at 6 AM
    this.scheduleDaily(() => {
      this.generateSubscriptionReport();
    }, 6); // 6 AM

    // Retry failed payments every 6 hours
    setInterval(() => {
      this.retryFailedPayments();
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('[Subscription Jobs] All background jobs initialized');
  },

  /**
   * Schedule a function to run at specific hour daily
   */
  scheduleDaily(fn, hourUTC = 0) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setUTCHours(hourUTC, 0, 0, 0);

    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const initialDelay = scheduledTime.getTime() - now.getTime();

    // Schedule first run
    setTimeout(() => {
      fn();
      // Then run daily
      setInterval(fn, 24 * 60 * 60 * 1000);
    }, initialDelay);
  }
};
