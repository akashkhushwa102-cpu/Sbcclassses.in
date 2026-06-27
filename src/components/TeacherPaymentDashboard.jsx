import React, { useEffect, useState } from 'react';

export const TeacherPaymentDashboard = ({ C, RES, Btn, Card, Badge, useScreenSize, Modal }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    narrative: '',
    paymentFor: 'salary' // salary, bonus, incentive
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const { width, isMobile } = useScreenSize();

  useEffect(() => {
    fetchTeachers();
    fetchStats();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teachers');
      const data = await res.json();
      setTeachers(data.data || data.teachers || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/teacher-payments/stats');
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTeacherPaymentHistory = async (teacherId) => {
    try {
      const res = await fetch(`/api/teacher-payments/teacher/${teacherId}`);
      const data = await res.json();
      setPaymentHistory(data.payments || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    }
  };

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    fetchTeacherPaymentHistory(teacher.id);
    setPaymentForm({ amount: '', narrative: '', paymentFor: 'salary' });
  };

  const handlePayTeacher = async () => {
    if (!selectedTeacher || !paymentForm.amount) {
      alert('❌ Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/teacher-payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          amount: Number(paymentForm.amount),
          narrative: paymentForm.narrative,
          paymentFor: paymentForm.paymentFor
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Payment processed successfully');
        setShowPaymentModal(false);
        setPaymentForm({ amount: '', narrative: '', paymentFor: 'salary' });
        fetchTeachers();
        fetchStats();
        if (selectedTeacher) {
          fetchTeacherPaymentHistory(selectedTeacher.id);
        }
      } else {
        alert('❌ Failed to process payment');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error processing payment');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: RES.spacingXl, textAlign: 'center' }}>
        <p style={{ color: C.textMuted }}>Loading teachers...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingXl }}>
      <h2 style={{ color: C.text, margin: 0, fontSize: RES.font3xl, fontWeight: 900 }}>
        👨‍🏫 Teacher Payment Management
      </h2>

      {/* ── STATISTICS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
        gap: RES.spacingMd
      }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Total Teachers
            </p>
            <p style={{ color: C.primary, margin: 0, fontSize: 28, fontWeight: 900 }}>
              {teachers.length}
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Total Paid This Month
            </p>
            <p style={{ color: C.success, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.monthlyTotal || 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              {stats?.monthlyPayments || 0} payments
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Total Paid (All Time)
            </p>
            <p style={{ color: C.gold, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.totalPaid || 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              {stats?.totalPayments || 0} payments
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Avg Payment
            </p>
            <p style={{ color: C.info, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.totalPayments > 0 ? Math.round(stats.totalPaid / stats.totalPayments) : 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              per transaction
            </p>
          </div>
        </Card>
      </div>

      {/* ── SEARCH ── */}
      <Card>
        <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
          🔍 Search Teacher
        </label>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.bgCard2,
            color: C.text,
            fontSize: 13
          }}
        />
      </Card>

      {/* ── TEACHERS LIST ── */}
      <Card>
        <h3 style={{ color: C.text, margin: '0 0 16px', fontSize: RES.fontLg, fontWeight: 700 }}>
          Teachers ({filteredTeachers.length})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? 11 : 13
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Name
                </th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Subject/Department
                </th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: RES.spacingMd, color: C.text, fontWeight: 600 }}>
                    {teacher.name}
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.textMuted, fontSize: 12 }}>
                    {teacher.subject || teacher.department || 'N/A'}
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.textMuted, fontSize: 12 }}>
                    {teacher.email}
                  </td>
                  <td style={{ padding: RES.spacingMd }}>
                    <Btn
                      onClick={() => {
                        handleSelectTeacher(teacher);
                        setShowPaymentModal(true);
                      }}
                      variant="primary"
                      size="xs"
                    >
                      💰 Pay
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTeachers.length === 0 && (
          <div style={{ textAlign: 'center', padding: RES.spacingXl }}>
            <p style={{ color: C.textMuted }}>No teachers found</p>
          </div>
        )}
      </Card>

      {/* ── PAYMENT MODAL ── */}
      <Modal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedTeacher(null);
        }}
        title={selectedTeacher ? `Pay ${selectedTeacher.name}` : 'Teacher Payment'}
      >
        {selectedTeacher && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingMd }}>
            {/* Teacher Info */}
            <Card style={{ background: C.bgCard2 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: RES.spacingMd
              }}>
                <div>
                  <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Teacher</p>
                  <p style={{ color: C.text, fontWeight: 700, margin: '4px 0 0' }}>
                    {selectedTeacher.name}
                  </p>
                </div>
                <div>
                  <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Subject</p>
                  <p style={{ color: C.text, fontWeight: 700, margin: '4px 0 0' }}>
                    {selectedTeacher.subject || selectedTeacher.department || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment History */}
            {paymentHistory.length > 0 && (
              <Card>
                <p style={{ color: C.textMuted, margin: '0 0 12px', fontSize: 12, fontWeight: 700 }}>
                  Recent Payments
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 150,
                  overflowY: 'auto'
                }}>
                  {paymentHistory.slice(0, 5).map((payment, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px',
                        background: C.bgCard2,
                        borderRadius: 6,
                        fontSize: 12
                      }}
                    >
                      <div>
                        <p style={{ color: C.textMuted, margin: 0, fontSize: 10 }}>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        <p style={{ color: C.text, margin: '2px 0 0', fontWeight: 600 }}>
                          {payment.narrative || payment.payment_for}
                        </p>
                      </div>
                      <p style={{ color: C.success, fontWeight: 700, margin: 0 }}>
                        ₹{payment.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Payment Form */}
            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Payment Type
              </label>
              <select
                value={paymentForm.paymentFor}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentFor: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bgCard2,
                  color: C.text,
                  fontSize: 13
                }}
              >
                <option value="salary">Salary</option>
                <option value="bonus">Bonus</option>
                <option value="incentive">Incentive</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="Enter amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bgCard2,
                  color: C.text,
                  fontSize: 13
                }}
              />
            </div>

            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Description/Note
              </label>
              <textarea
                placeholder="Optional: Add notes about this payment"
                value={paymentForm.narrative}
                onChange={(e) => setPaymentForm({ ...paymentForm, narrative: e.target.value })}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bgCard2,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: RES.spacingMd, marginTop: RES.spacingMd }}>
              <Btn
                onClick={handlePayTeacher}
                variant="primary"
              >
                ✅ Process Payment ₹{paymentForm.amount || '0'}
              </Btn>
              <Btn
                onClick={() => setShowPaymentModal(false)}
                variant="ghost"
              >
                Cancel
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
