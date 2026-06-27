import React, { useEffect, useState } from 'react';

export const AdminPaymentDashboard = ({ C, RES, Btn, Card, Badge, useScreenSize, Modal }) => {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    startDate: '',
    endDate: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { width, isMobile } = useScreenSize();

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch('/api/subscriptions/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch payments
      const paymentsRes = await fetch(
        `/api/subscriptions/admin/payments?${new URLSearchParams(filters)}`
      );
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData.payments || []);

      // Fetch subscriptions
      const subsRes = await fetch('/api/subscriptions/admin/subscriptions');
      const subsData = await subsRes.json();
      setSubscriptions(subsData.subscriptions || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateStudent = async (userId, planName = 'monthly', days = 30) => {
    try {
      const res = await fetch(`/api/subscriptions/admin/${userId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, days })
      });
      const data = await res.json();
      if (data.success) {
        alert('Subscription activated successfully');
        fetchAllData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleExtendSubscription = async (userId, days = 30) => {
    try {
      const res = await fetch(`/api/subscriptions/admin/${userId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Subscription extended by ${days} days`);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleToggleService = async (userId, enabled) => {
    try {
      const res = await fetch(`/api/subscriptions/admin/${userId}/toggle-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Service ${enabled ? 'enabled' : 'disabled'}`);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: RES.spacingXl, textAlign: 'center' }}>
        <p style={{ color: C.textMuted }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingXl }}>
      <h2 style={{ color: C.text, margin: 0, fontSize: RES.font3xl, fontWeight: 900 }}>
        💳 Payment & Subscription Dashboard
      </h2>

      {/* ── REVENUE STATISTICS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
        gap: RES.spacingMd
      }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Total Revenue
            </p>
            <p style={{ color: C.primary, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.totalRevenue || 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              {stats?.totalTransactions || 0} transactions
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Today Revenue
            </p>
            <p style={{ color: C.success, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.todayRevenue || 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              {stats?.todayTransactions || 0} today
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Month Revenue
            </p>
            <p style={{ color: C.gold, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.monthlyRevenue || 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              {stats?.monthlyTransactions || 0} this month
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>
              Avg Transaction
            </p>
            <p style={{ color: C.info, margin: 0, fontSize: 28, fontWeight: 900 }}>
              ₹{stats?.totalTransactions > 0 ? Math.round(stats.totalRevenue / stats.totalTransactions) : 0}
            </p>
            <p style={{ color: C.textMuted, margin: '8px 0 0', fontSize: 11 }}>
              per payment
            </p>
          </div>
        </Card>
      </div>

      {/* ── FILTERS ── */}
      <Card>
        <h3 style={{ color: C.text, margin: '0 0 16px', fontSize: RES.fontLg, fontWeight: 700 }}>
          🔍 Filters
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr',
          gap: RES.spacingMd
        }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bgCard2,
                color: C.text,
                fontSize: 12
              }}
            >
              <option value="">All Status</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Plan
            </label>
            <select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bgCard2,
                color: C.text,
                fontSize: 12
              }}
            >
              <option value="">All Plans</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bgCard2,
                color: C.text,
                fontSize: 12
              }}
            />
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bgCard2,
                color: C.text,
                fontSize: 12
              }}
            />
          </div>
        </div>
      </Card>

      {/* ── PAYMENTS TABLE ── */}
      <Card>
        <h3 style={{ color: C.text, margin: '0 0 16px', fontSize: RES.fontLg, fontWeight: 700 }}>
          💰 Recent Payments ({payments.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? 11 : 13
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Student</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Plan</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Date</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 10).map((payment) => (
                <tr key={payment.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: RES.spacingMd, color: C.text }}>
                    <div style={{ fontWeight: 600 }}>{payment.user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{payment.user?.email}</div>
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.text }}>
                    {payment.plan_name.charAt(0).toUpperCase() + payment.plan_name.slice(1)}
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.primary, fontWeight: 700 }}>
                    ₹{payment.amount}
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.textMuted, fontSize: 11 }}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: RES.spacingMd }}>
                    <Badge
                      text={payment.status.toUpperCase()}
                      type={payment.status === 'successful' ? 'success' : 'danger'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── SUBSCRIPTIONS TABLE ── */}
      <Card>
        <h3 style={{ color: C.text, margin: '0 0 16px', fontSize: RES.fontLg, fontWeight: 700 }}>
          📊 Student Subscriptions ({subscriptions.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? 11 : 13
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Student</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Plan</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Days Left</th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.slice(0, 15).map((sub) => (
                <tr key={sub.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: RES.spacingMd, color: C.text }}>
                    <div style={{ fontWeight: 600 }}>{sub.user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{sub.user?.email}</div>
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.text }}>
                    {sub.plan_name.charAt(0).toUpperCase() + sub.plan_name.slice(1)}
                  </td>
                  <td style={{ padding: RES.spacingMd }}>
                    <Badge
                      text={sub.status.toUpperCase()}
                      type={sub.status === 'active' ? 'success' : 'danger'}
                    />
                  </td>
                  <td style={{ padding: RES.spacingMd, color: C.primary, fontWeight: 700 }}>
                    {sub.daysRemaining} days
                  </td>
                  <td style={{ padding: RES.spacingMd }}>
                    <button
                      onClick={() => {
                        setSelectedStudent(sub.user);
                        setModalOpen(true);
                      }}
                      style={{
                        background: C.info,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── STUDENT MANAGEMENT MODAL ── */}
      {selectedStudent && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Manage Student: ${selectedStudent.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingLg }}>
            {/* Activate */}
            <div style={{ padding: RES.spacingMd, background: C.bgCard2, borderRadius: 10 }}>
              <h4 style={{ color: C.text, margin: '0 0 12px', fontWeight: 700 }}>
                🔓 Activate Subscription
              </h4>
              <div style={{ display: 'flex', gap: RES.spacingMd, flexWrap: 'wrap' }}>
                {[
                  { label: '30 Days', days: 30 },
                  { label: '90 Days', days: 90 },
                  { label: '365 Days', days: 365 }
                ].map((btn) => (
                  <Btn
                    key={btn.days}
                    onClick={() => handleActivateStudent(selectedStudent.id, 'monthly', btn.days)}
                    variant="success"
                    size="sm"
                  >
                    {btn.label}
                  </Btn>
                ))}
              </div>
            </div>

            {/* Extend */}
            <div style={{ padding: RES.spacingMd, background: C.bgCard2, borderRadius: 10 }}>
              <h4 style={{ color: C.text, margin: '0 0 12px', fontWeight: 700 }}>
                📅 Extend Subscription
              </h4>
              <div style={{ display: 'flex', gap: RES.spacingMd, flexWrap: 'wrap' }}>
                {[
                  { label: '+7 Days', days: 7 },
                  { label: '+30 Days', days: 30 },
                  { label: '+90 Days', days: 90 }
                ].map((btn) => (
                  <Btn
                    key={btn.days}
                    onClick={() => handleExtendSubscription(selectedStudent.id, btn.days)}
                    variant="primary"
                    size="sm"
                  >
                    {btn.label}
                  </Btn>
                ))}
              </div>
            </div>

            {/* Toggle Service */}
            <div style={{ padding: RES.spacingMd, background: C.bgCard2, borderRadius: 10 }}>
              <h4 style={{ color: C.text, margin: '0 0 12px', fontWeight: 700 }}>
                🔐 Service Access
              </h4>
              <div style={{ display: 'flex', gap: RES.spacingMd, flexWrap: 'wrap' }}>
                <Btn
                  onClick={() => handleToggleService(selectedStudent.id, true)}
                  variant="success"
                  size="sm"
                >
                  ✓ Enable
                </Btn>
                <Btn
                  onClick={() => handleToggleService(selectedStudent.id, false)}
                  variant="danger"
                  size="sm"
                >
                  ✕ Disable
                </Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
