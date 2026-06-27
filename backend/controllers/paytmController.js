import crypto from 'crypto';
import https from 'https';
// Supabase-backed helpers (filenames suffixed with `Supabase` to avoid
// clashing with Mongoose models on case-insensitive filesystems).
import { PaymentModel } from '../models/paymentSupabase.js';
import { SubscriptionModel } from '../models/subscriptionSupabase.js';
import { SubscriptionPlanModel } from '../models/subscriptionPlan.js';
import { StudentModel } from '../models/student.js';
import { supabase } from '../config/supabase.js';

// PayTM Configuration
// Accepts both `PAYTM_MID` / `PAYTM_KEY` (used in .env.example) and the longer
// `PAYTM_MERCHANT_ID` / `PAYTM_MERCHANT_KEY` aliases — historically both names
// have appeared in this codebase.
const PAYTM_CONFIG = {
  merchantId:  process.env.PAYTM_MID  || process.env.PAYTM_MERCHANT_ID  || '',
  merchantKey: process.env.PAYTM_KEY  || process.env.PAYTM_MERCHANT_KEY || '',
  website:     process.env.PAYTM_WEBSITE || 'WEBSTAGING',
  // TEST: https://securegw-stage.paytm.in
  // PROD: https://securegw.paytm.in
  paymentGateway: process.env.PAYTM_GATEWAY_URL || 'https://securegw-stage.paytm.in',
  callbackUrl:    process.env.PAYTM_CALLBACK_URL || 'http://localhost:5000/api/paytm/callback',
  industryType:   process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
  channelId:      process.env.PAYTM_CHANNEL_ID || 'WEB',
};

// Subscription plans
const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Monthly Plan',
    price: 99900, // ₹999 in paise
    duration: 30,
    description: 'One month access to all classes'
  },
  quarterly: {
    name: 'Quarterly Plan',
    price: 249900, // ₹2499 in paise
    duration: 90,
    description: 'Three months access to all classes'
  },
  annual: {
    name: 'Annual Plan',
    price: 849900, // ₹8499 in paise
    duration: 365,
    description: 'One year access to all classes'
  }
};

/**
 * Generate PayTM signature
 * @param {Object} data - Payment data
 * @param {string} key - Merchant key
 * @returns {string} Generated signature
 */
function generatePayTMSignature(data, key) {
  const allKeys = Object.keys(data).sort();
  let signString = '';
  
  allKeys.forEach((key) => {
    if (data[key] !== '') {
      signString += data[key] + '|';
    }
  });
  
  signString += key;
  
  const signature = crypto
    .createHash('sha256')
    .update(signString)
    .digest('hex');
  
  return signature;
}

/**
 * Verify PayTM signature from callback
 * @param {Object} data - Received data
 * @param {string} signature - Received signature
 * @returns {boolean} Signature valid or not
 */
function verifyPayTMSignature(data, signature) {
  const allKeys = Object.keys(data).sort();
  let signString = '';
  
  allKeys.forEach((key) => {
    if (key !== 'CHECKSUMHASH' && data[key] !== '') {
      signString += data[key] + '|';
    }
  });
  
  signString += PAYTM_CONFIG.merchantKey;
  
  const generatedSignature = crypto
    .createHash('sha256')
    .update(signString)
    .digest('hex');
  
  return generatedSignature === signature;
}

export const PayTMController = {
  /**
   * Initiate Payment - Step 1
   * POST /api/paytm/initiate-payment
   */
  async initiatePayment(req, res) {
    try {
      const { studentId, planType = 'monthly', paymentMethod = 'upi' } = req.body;

      // Validate inputs
      if (!studentId || !planType) {
        return res.status(400).json({
          error: 'Missing required fields: studentId, planType'
        });
      }

      // Get plan from database
      let plan = await SubscriptionPlanModel.getByType(planType);
      
      // Fallback to hardcoded plans if not in database
      if (!plan) {
        plan = SUBSCRIPTION_PLANS[planType];
        if (!plan) {
          return res.status(400).json({
            error: `Invalid plan type. Available plans: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`
          });
        }
        // Convert to expected format
        plan = {
          planType,
          displayName: plan.name,
          description: plan.description,
          priceInPaise: plan.price,
          durationDays: plan.duration,
          paymentMethods: ['paytm', 'upi', 'card', 'net_banking']
        };
      }

      // Get student details
      const student = await StudentModel.getById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Generate unique transaction ID
      const transactionId = `TXN${Date.now()}${studentId.slice(0, 8)}`;

      // Create payment record
      const paymentRecord = await PaymentModel.create({
        studentId,
        gatewayOrderId: transactionId,
        amount: plan.priceInPaise,
        planName: plan.displayName,
        billingCycle: planType,
        currency: 'INR',
        paymentMethod: paymentMethod || 'upi',
        status: 'pending',
        contactEmail: student.email,
        contactPhone: student.phone,
        metadata: {
          planDuration: plan.durationDays,
          planDescription: plan.description,
          gateway: 'paytm',
          paymentMethod: paymentMethod || 'upi'
        }
      });

      // Prepare PayTM request
      const paytmParams = {
        'MID': PAYTM_CONFIG.merchantId,
        'WEBSITE': PAYTM_CONFIG.website,
        'CHANNEL_ID': PAYTM_CONFIG.channelId,
        'INDUSTRY_TYPE': PAYTM_CONFIG.industryType,
        'ORDER_ID': transactionId,
        'CUST_ID': studentId,
        'TXN_AMOUNT': (plan.priceInPaise / 100).toString(), // Amount in Rupees
        'EMAIL': student.email,
        'MOBILE_NO': student.phone || '9999999999',
        'CALLBACK_URL': PAYTM_CONFIG.callbackUrl,
        'PAYMENT_TYPE_ID': paymentMethod === 'upi' ? 'UPI' : 'CC' // Support UPI
      };

      // Generate checksum
      const checksum = generatePayTMSignature(paytmParams, PAYTM_CONFIG.merchantKey);
      paytmParams['CHECKSUMHASH'] = checksum;

      return res.status(200).json({
        success: true,
        transactionId,
        paymentId: paymentRecord.id,
        paytmParams,
        paytmGatewayUrl: `${PAYTM_CONFIG.paymentGateway}/order/initiate`,
        amount: plan.priceInPaise,
        currency: 'INR',
        studentName: student.name,
        studentEmail: student.email,
        planName: plan.displayName,
        planType,
        paymentMethod: paymentMethod || 'upi',
        notes: {
          studentId,
          studentEmail: student.email,
          studentName: student.name,
          planType,
          paymentMethod: paymentMethod || 'upi'
        }
      });

    } catch (error) {
      console.error('Error initiating payment:', error);
      return res.status(500).json({
        error: 'Failed to initiate payment',
        details: error.message
      });
    }
  },

  /**
   * Payment Callback Handler - Receives response from PayTM
   * POST /api/paytm/callback
   */
  async handleCallback(req, res) {
    try {
      const paytmResponse = req.body;

      console.log('[PayTM] Callback received:', {
        orderId: paytmResponse.ORDERID,
        status: paytmResponse.STATUS
      });

      // Verify signature
      if (!verifyPayTMSignature(paytmResponse, paytmResponse.CHECKSUMHASH)) {
        console.warn('[PayTM] Signature verification failed');
        
        // Log failed webhook
        await supabase.from('payment_webhook_logs').insert([{
          eventId: paytmResponse.ORDERID,
          eventType: 'paytm.callback',
          paymentId: paytmResponse.TXNID || null,
          orderId: paytmResponse.ORDERID,
          status: 'failed_verification',
          payload: req.body,
          isProcessed: false,
          errorMessage: 'Signature verification failed'
        }]);

        return res.status(403).json({
          error: 'Signature verification failed'
        });
      }

      // Get payment record
      let paymentRecord = await PaymentModel.getByOrderId(paytmResponse.ORDERID);
      if (!paymentRecord) {
        return res.status(404).json({
          error: 'Payment record not found'
        });
      }

      // Log webhook
      const webhookLog = {
        eventId: paytmResponse.ORDERID,
        eventType: 'paytm.callback',
        paymentId: paytmResponse.TXNID || null,
        orderId: paytmResponse.ORDERID,
        status: paytmResponse.STATUS,
        payload: req.body,
        isProcessed: false
      };

      const { data: logData, error: logError } = await supabase
        .from('payment_webhook_logs')
        .insert([webhookLog])
        .select()
        .single();

      if (logError) {
        console.error('Error logging webhook:', logError);
      }

      // Handle payment status. Idempotency: Paytm retries callbacks, so skip
      // if we've already settled this payment (otherwise we'd extend the
      // subscription twice).
      const alreadyCaptured = paymentRecord.status === 'captured';
      const alreadyFailed   = paymentRecord.status === 'failed';
      if (paytmResponse.STATUS === 'TXN_SUCCESS' && !alreadyCaptured) {
        await PayTMController.handlePaymentSuccess(paytmResponse, paymentRecord);
      } else if (paytmResponse.STATUS === 'TXN_FAILURE' && !alreadyFailed) {
        await PayTMController.handlePaymentFailure(paytmResponse, paymentRecord);
      }

      // Mark webhook as processed
      if (logData) {
        await supabase
          .from('payment_webhook_logs')
          .update({
            isProcessed: true,
            processedAt: new Date().toISOString()
          })
          .eq('id', logData.id);
      }

      // Redirect to success/failure page
      const redirectUrl = paytmResponse.STATUS === 'TXN_SUCCESS'
        ? `${process.env.FRONTEND_URL}/subscription?status=success&orderId=${paytmResponse.ORDERID}`
        : `${process.env.FRONTEND_URL}/subscription?status=failed&orderId=${paytmResponse.ORDERID}`;

      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('Error handling callback:', error);
      return res.status(500).json({
        error: 'Failed to process callback',
        details: error.message
      });
    }
  },

  /**
   * Verify Payment Status
   * POST /api/paytm/verify-payment
   */
  async verifyPayment(req, res) {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({
          error: 'orderId is required'
        });
      }

      // Get payment record
      const paymentRecord = await PaymentModel.getByOrderId(orderId);
      if (!paymentRecord) {
        return res.status(404).json({
          error: 'Payment record not found'
        });
      }

      // Create verification payload
      const verifyPayload = {
        'MID': PAYTM_CONFIG.merchantId,
        'ORDERID': orderId
      };

      const checksum = generatePayTMSignature(verifyPayload, PAYTM_CONFIG.merchantKey);
      verifyPayload['CHECKSUMHASH'] = checksum;

      // Query PayTM server
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify(verifyPayload);

        const options = {
          hostname: PAYTM_CONFIG.paymentGateway.replace('https://', ''),
          port: 443,
          path: '/order/status',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };

        const request = https.request(options, async (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', async () => {
            try {
              const paytmResponse = JSON.parse(data);

              if (paytmResponse.STATUS === 'TXN_SUCCESS') {
                // Update payment record
                await PaymentModel.update(paymentRecord.id, {
                  gatewayPaymentId: paytmResponse.TXNID,
                  status: 'captured',
                  paidAt: new Date().toISOString()
                });

                // Activate subscription
                const subscription = await PayTMController.activateSubscription(paymentRecord);

                resolve(res.status(200).json({
                  success: true,
                  message: 'Payment verified and subscription activated',
                  subscriptionId: subscription.id,
                  subscriptionStatus: 'active',
                  subscriptionEndDate: subscription.endDate
                }));
              } else {
                resolve(res.status(400).json({
                  success: false,
                  message: 'Payment verification failed',
                  status: paytmResponse.STATUS
                }));
              }
            } catch (err) {
              console.error('Error parsing PayTM response:', err);
              reject(err);
            }
          });
        });

        request.on('error', (error) => {
          console.error('Error verifying payment:', error);
          reject(error);
        });

        request.write(postData);
        request.end();
      });

    } catch (error) {
      console.error('Error in verify payment:', error);
      return res.status(500).json({
        error: 'Failed to verify payment',
        details: error.message
      });
    }
  },

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(paytmResponse, paymentRecord) {
    try {
      // Update payment status
      await PaymentModel.update(paymentRecord.id, {
        gatewayPaymentId: paytmResponse.TXNID,
        status: 'captured',
        paidAt: new Date().toISOString()
      });

      // Activate subscription
      await PayTMController.activateSubscription(paymentRecord);

      console.log(`[PayTM] Payment successful: ${paytmResponse.ORDERID}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  },

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(paytmResponse, paymentRecord) {
    try {
      // Update payment status
      await PaymentModel.update(paymentRecord.id, {
        status: 'failed',
        errorMessage: paytmResponse.RESPMSG || 'Payment failed',
        failedAt: new Date().toISOString(),
        attemptCount: (paymentRecord.attemptCount || 0) + 1
      });

      console.log(`[PayTM] Payment failed: ${paytmResponse.ORDERID}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  },

  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(paymentRecord) {
    try {
      const billingCycleDays = PayTMController.getBillingCycleDays(paymentRecord.billingCycle);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + billingCycleDays);

      // Check if student has active subscription
      let subscription = await SubscriptionModel.getActiveByStudentId(paymentRecord.studentId);

      if (subscription) {
        // Extend existing subscription
        const newEndDate = new Date(subscription.endDate);
        newEndDate.setDate(newEndDate.getDate() + billingCycleDays);
        subscription = await SubscriptionModel.update(subscription.id, {
          endDate: newEndDate.toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new subscription
        subscription = await SubscriptionModel.create({
          studentId: paymentRecord.studentId,
          planName: paymentRecord.planName,
          planPrice: paymentRecord.amount,
          billingCycle: paymentRecord.billingCycle,
          status: 'active',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          autoRenew: true
        });
      }

      // Update payment with subscription ID
      await PaymentModel.update(paymentRecord.id, {
        subscriptionId: subscription.id
      });

      console.log(`[PayTM] Subscription activated: ${subscription.id}`);
      return subscription;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  },

  /**
   * Get billing cycle duration
   */
  getBillingCycleDays(billingCycle) {
    const cycles = {
      monthly: 30,
      quarterly: 90,
      annual: 365
    };
    return cycles[billingCycle] || 30;
  },

  /**
   * Get available plans
   * GET /api/paytm/plans
   */
  async getPlans(req, res) {
    try {
      // Try to get plans from database
      const dbPlans = await SubscriptionPlanModel.getAll();
      
      if (dbPlans && dbPlans.length > 0) {
        return res.status(200).json({
          success: true,
          plans: dbPlans.map(plan => ({
            id: plan.id,
            planType: plan.planType,
            name: plan.displayName,
            description: plan.description,
            price: plan.priceInPaise,
            priceInRupees: plan.priceInPaise / 100,
            duration: plan.durationDays,
            features: plan.features || [],
            paymentMethods: plan.paymentMethods || ['paytm', 'upi', 'card'],
            currencyCode: plan.currencyCode || 'INR'
          })),
          gateway: 'paytm',
          source: 'database'
        });
      }

      // Fallback to hardcoded plans if database is empty
      const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => ({
        planType: key,
        ...value,
        priceInRupees: value.price / 100
      }));

      return res.status(200).json({
        success: true,
        plans,
        gateway: 'paytm',
        source: 'fallback'
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({
        error: 'Failed to fetch plans',
        details: error.message
      });
    }
  },

  /**
   * Get subscription status
   * GET /api/paytm/subscription/:studentId
   */
  async getSubscriptionStatus(req, res) {
    try {
      const { studentId } = req.params;

      const subscription = await SubscriptionModel.getActiveByStudentId(studentId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      const isExpired = new Date(subscription.endDate) < new Date();

      return res.status(200).json({
        success: true,
        subscription: {
          ...subscription,
          isExpired,
          daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({
        error: 'Failed to fetch subscription',
        details: error.message
      });
    }
  },

  /**
   * Get payment history
   * GET /api/paytm/history/:studentId
   */
  async getPaymentHistory(req, res) {
    try {
      const { studentId } = req.params;

      const payments = await PaymentModel.getByStudentId(studentId);
      const stats = await PaymentModel.getStats(studentId);

      return res.status(200).json({
        success: true,
        payments,
        statistics: stats
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return res.status(500).json({
        error: 'Failed to fetch payment history',
        details: error.message
      });
    }
  }
};
