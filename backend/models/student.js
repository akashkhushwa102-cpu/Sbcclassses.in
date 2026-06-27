import { supabase, supabaseAdmin } from '../config/supabase.js';

export const StudentModel = {
  // Get all students
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get student by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get student by email
  async getByEmail(email) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create student
  async create(studentData) {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update student
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete student
  async delete(id) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Get students by batch
  async getByBatch(batchId) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('batch_id', batchId);
    
    if (error) throw error;
    return data;
  }
};
