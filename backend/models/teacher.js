import { supabase } from '../config/supabase.js';

export const TeacherModel = {
  // Get all teachers
  async getAll() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get teacher by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get teacher by email
  async getByEmail(email) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create teacher
  async create(teacherData) {
    const { data, error } = await supabase
      .from('teachers')
      .insert([teacherData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update teacher
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('teachers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete teacher
  async delete(id) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
