// Supabase-style payment helper used by paytmController.
// Kept distinct from Mongoose Payment.js (different storage layer; the
// filesystem is case-insensitive on Windows so we can't reuse "payment.js").
//
// Required Supabase tables:
//   payments               (id, studentId, subscriptionId, gatewayOrderId,
//                           gatewayPaymentId, amount, planName, billingCycle,
//                           currency, paymentMethod, status, contactEmail,
//                           contactPhone, metadata jsonb, paidAt, failedAt,
//                           errorMessage, attemptCount, createdAt, updatedAt)
//   payment_webhook_logs   (created/updated by paytmController on every callback)

import { supabase } from '../config/supabase.js';

const TABLE = 'payments';

export const PaymentModel = {
  async create(payload) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ attemptCount: 0, createdAt: now, updatedAt: now, ...payload }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getByOrderId(orderId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('gatewayOrderId', orderId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...patch, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByStudentId(studentId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('studentId', studentId)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getStats(studentId) {
    const payments = await PaymentModel.getByStudentId(studentId);
    const captured = payments.filter((p) => p.status === 'captured');
    const totalPaisePaid = captured.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      totalPayments: payments.length,
      successfulPayments: captured.length,
      failedPayments: payments.filter((p) => p.status === 'failed').length,
      pendingPayments: payments.filter((p) => p.status === 'pending').length,
      totalAmountPaise: totalPaisePaid,
      totalAmountRupees: totalPaisePaid / 100,
    };
  },
};
