import { supabase } from '../config/supabase.js';

export const TeacherPaymentController = {
  // ====================================
  // CREATE PAYMENT
  // ====================================
  
  async createPayment(req, res) {
    try {
      const { teacherId, amount, narrative, paymentFor } = req.body;

      if (!teacherId || !amount || amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid teacher ID or amount' 
        });
      }

      // Record payment
      const { data: payment, error: paymentError } = await supabase
        .from('teacher_payments')
        .insert([{
          teacher_id: teacherId,
          amount: Number(amount),
          narrative: narrative || null,
          payment_for: paymentFor || 'salary',
          status: 'completed'
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      res.json({
        success: true,
        payment,
        message: 'Payment processed successfully'
      });
    } catch (err) {
      console.error('Error creating payment:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process payment' 
      });
    }
  },

  // ====================================
  // GET PAYMENTS BY TEACHER
  // ====================================

  async getTeacherPayments(req, res) {
    try {
      const { teacherId } = req.params;

      const { data, error } = await supabase
        .from('teacher_payments')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ 
        payments: data,
        count: data.length
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  },

  // ====================================
  // GET ALL TEACHER PAYMENTS (Admin)
  // ====================================

  async getAllPayments(req, res) {
    try {
      const { status, startDate, endDate } = req.query;

      let query = supabase
        .from('teacher_payments')
        .select(`
          *,
          teacher:teacher_id(id, name, email, subject)
        `)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      
      if (startDate && endDate) {
        query = query
          .gte('created_at', new Date(startDate).toISOString())
          .lte('created_at', new Date(endDate).toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({ 
        payments: data,
        count: data.length
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  },

  // ====================================
  // GET STATISTICS
  // ====================================

  async getStats(req, res) {
    try {
      // Total payments all time
      const { data: totalPayments } = await supabase
        .from('teacher_payments')
        .select('amount')
        .eq('status', 'completed');

      // Payments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyPayments } = await supabase
        .from('teacher_payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const stats = {
        totalPaid: totalPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        totalPayments: totalPayments?.length || 0,
        monthlyTotal: monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        monthlyPayments: monthlyPayments?.length || 0
      };

      res.json({ stats });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // ====================================
  // GET PAYMENT BY ID
  // ====================================

  async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;

      const { data, error } = await supabase
        .from('teacher_payments')
        .select(`
          *,
          teacher:teacher_id(*)
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({ payment: data });
    } catch (err) {
      console.error('Error fetching payment:', err);
      res.status(500).json({ error: 'Failed to fetch payment' });
    }
  },

  // ====================================
  // UPDATE PAYMENT
  // ====================================

  async updatePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { status, narrative } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (narrative) updateData.narrative = narrative;

      const { data, error } = await supabase
        .from('teacher_payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        payment: data,
        message: 'Payment updated successfully'
      });
    } catch (err) {
      console.error('Error updating payment:', err);
      res.status(500).json({ error: 'Failed to update payment' });
    }
  },

  // ====================================
  // DELETE PAYMENT (Only if pending/failed)
  // ====================================

  async deletePayment(req, res) {
    try {
      const { paymentId } = req.params;

      // Check payment status first
      const { data: payment, error: fetchError } = await supabase
        .from('teacher_payments')
        .select('status')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      if (payment.status === 'completed') {
        return res.status(400).json({ 
          error: 'Cannot delete completed payments' 
        });
      }

      const { error: deleteError } = await supabase
        .from('teacher_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) throw deleteError;

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting payment:', err);
      res.status(500).json({ error: 'Failed to delete payment' });
    }
  }
};
