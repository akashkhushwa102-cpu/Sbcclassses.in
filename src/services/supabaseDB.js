/* ============================================================
   SUPABASE DATABASE SERVICE
   Complete backend for SBC App
   ============================================================ */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// DATABASE ABSTRACTION LAYER
// Drop-in replacement for localStorage DB
// ============================================================

export const SupabaseDB = {
  // Students Table
  students: {
    async getAll() {
      const { data, error } = await supabase.from('students').select('*');
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      return data || [];
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error('Error fetching student:', error);
      return data || null;
    },

    async getByRollNo(rollNo) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('rollNo', rollNo)
        .single();
      if (error) console.error('Error fetching by roll no:', error);
      return data || null;
    },

    async create(student) {
      const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single();
      if (error) console.error('Error creating student:', error);
      return data || null;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) console.error('Error updating student:', error);
      return data || null;
    },

    async delete(id) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) console.error('Error deleting student:', error);
      return !error;
    },

    // Subscribe to real-time changes
    subscribe(callback) {
      const subscription = supabase
        .from('students')
        .on('*', (payload) => {
          callback(payload);
        })
        .subscribe();
      return subscription;
    },
  },

  // Teachers Table
  teachers: {
    async getAll() {
      const { data, error } = await supabase.from('teachers').select('*');
      if (error) console.error('Error fetching teachers:', error);
      return data || [];
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error('Error fetching teacher:', error);
      return data || null;
    },

    async create(teacher) {
      const { data, error } = await supabase
        .from('teachers')
        .insert([teacher])
        .select()
        .single();
      if (error) console.error('Error creating teacher:', error);
      return data || null;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) console.error('Error updating teacher:', error);
      return data || null;
    },

    async delete(id) {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) console.error('Error deleting teacher:', error);
      return !error;
    },
  },

  // Batches Table
  batches: {
    async getAll() {
      const { data, error } = await supabase.from('batches').select('*');
      if (error) console.error('Error fetching batches:', error);
      return data || [];
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error('Error fetching batch:', error);
      return data || null;
    },

    async create(batch) {
      const { data, error } = await supabase
        .from('batches')
        .insert([batch])
        .select()
        .single();
      if (error) console.error('Error creating batch:', error);
      return data || null;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) console.error('Error updating batch:', error);
      return data || null;
    },

    async delete(id) {
      const { error } = await supabase.from('batches').delete().eq('id', id);
      if (error) console.error('Error deleting batch:', error);
      return !error;
    },
  },

  // Attendance Table
  attendance: {
    async getByClass(classId) {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('classId', classId);
      if (error) console.error('Error fetching attendance:', error);
      return data || [];
    },

    async mark(studentId, classId, status) {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{ studentId, classId, status, markedAt: new Date() }])
        .select()
        .single();
      if (error) console.error('Error marking attendance:', error);
      return data || null;
    },

    async getStudentAttendance(studentId) {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('studentId', studentId);
      if (error) console.error('Error fetching student attendance:', error);
      return data || [];
    },
  },

  // Fees/Transactions Table
  fees: {
    async getByStudent(studentId) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('studentId', studentId);
      if (error) console.error('Error fetching fees:', error);
      return data || [];
    },

    async recordPayment(studentId, amount, month) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            studentId,
            amount,
            month,
            status: 'completed',
            paidAt: new Date(),
          },
        ])
        .select()
        .single();
      if (error) console.error('Error recording payment:', error);
      return data || null;
    },

    async getAll() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('paidAt', { ascending: false });
      if (error) console.error('Error fetching all fees:', error);
      return data || [];
    },
  },

  // Live Classes Table
  liveClasses: {
    async getAll() {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .order('scheduledAt', { ascending: false });
      if (error) console.error('Error fetching live classes:', error);
      return data || [];
    },

    async getActive() {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .eq('status', 'live');
      if (error) console.error('Error fetching active classes:', error);
      return data || [];
    },

    async create(classData) {
      const { data, error } = await supabase
        .from('live_classes')
        .insert([classData])
        .select()
        .single();
      if (error) console.error('Error creating live class:', error);
      return data || null;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('live_classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) console.error('Error updating live class:', error);
      return data || null;
    },

    async subscribe(callback) {
      return supabase
        .from('live_classes')
        .on('*', (payload) => {
          callback(payload);
        })
        .subscribe();
    },
  },

  // Notices Table
  notices: {
    async getAll() {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) console.error('Error fetching notices:', error);
      return data || [];
    },

    async create(notice) {
      const { data, error } = await supabase
        .from('notices')
        .insert([{ ...notice, createdAt: new Date() }])
        .select()
        .single();
      if (error) console.error('Error creating notice:', error);
      return data || null;
    },

    async delete(id) {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) console.error('Error deleting notice:', error);
      return !error;
    },
  },

  // Subscriptions Table
  subscriptions: {
    async getByStudent(studentId) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('studentId', studentId)
        .single();
      if (error) console.error('Error fetching subscription:', error);
      return data || null;
    },

    async create(studentId, planId, expiryDate) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([
          {
            studentId,
            planId,
            status: 'active',
            expiryDate,
            startedAt: new Date(),
          },
        ])
        .select()
        .single();
      if (error) console.error('Error creating subscription:', error);
      return data || null;
    },

    async update(studentId, updates) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('studentId', studentId)
        .select()
        .single();
      if (error) console.error('Error updating subscription:', error);
      return data || null;
    },
  },

  // Recordings Table
  recordings: {
    async getAll() {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('uploadedAt', { ascending: false });
      if (error) console.error('Error fetching recordings:', error);
      return data || [];
    },

    async getByBatch(batchId) {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('batchId', batchId);
      if (error) console.error('Error fetching batch recordings:', error);
      return data || [];
    },

    async create(recording) {
      const { data, error } = await supabase
        .from('recordings')
        .insert([{ ...recording, uploadedAt: new Date() }])
        .select()
        .single();
      if (error) console.error('Error creating recording:', error);
      return data || null;
    },
  },

  // User Authentication
  auth: {
    async signUp(email, password, userData) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      if (error) console.error('Error signing up:', error);
      return { data, error };
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) console.error('Error signing in:', error);
      return { data, error };
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
      return !error;
    },

    async getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user || null;
    },

    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) console.error('Error resetting password:', error);
      return !error;
    },

    async onAuthStateChange(callback) {
      return supabase.auth.onAuthStateChange(callback);
    },
  },
};

export default SupabaseDB;
