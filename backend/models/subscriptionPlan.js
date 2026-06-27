import { supabase } from '../config/supabase.js';

export const SubscriptionPlanModel = {
  // Create subscription plan
  async create(planData) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert([{
        ...planData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all plans
  async getAll() {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('isActive', true)
      .order('displayOrder', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get plan by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Get plan by type (monthly, quarterly, annual)
  async getByType(planType) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('planType', planType)
      .eq('isActive', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Update plan
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete plan (soft delete)
  async delete(id) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Restore deleted plan
  async restore(id) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all plans including inactive
  async getAllWithInactive() {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('displayOrder', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};
