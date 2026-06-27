// Supabase-style subscription helper used by paytmController.
// Distinct from Mongoose Subscription.js — different storage layer.
//
// Required Supabase table:
//   subscriptions (id, studentId, planName, planPrice, billingCycle, status,
//                  startDate, endDate, autoRenew, createdAt, updatedAt)

import { supabase } from '../config/supabase.js';

const TABLE = 'subscriptions';

export const SubscriptionModel = {
  async create(payload) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ createdAt: now, updatedAt: now, ...payload }])
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

  // Returns the most recent active subscription for a student, or null.
  async getActiveByStudentId(studentId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('studentId', studentId)
      .eq('status', 'active')
      .order('endDate', { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
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

  async listByStudentId(studentId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('studentId', studentId)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
