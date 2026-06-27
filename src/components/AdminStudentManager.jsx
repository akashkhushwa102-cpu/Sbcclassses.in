import React, { useEffect, useState } from 'react';

export const AdminStudentManager = ({ C, RES, Btn, Card, Badge, useScreenSize, Modal }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    planName: 'monthly',
    days: 30
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subscriptionStatus: ''
  });
  const { width, isMobile } = useScreenSize();

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subscriptionStatus) {
        params.append('subscriptionStatus', filters.subscriptionStatus);
      }

      const res = await fetch(`/api/subscriptions/admin/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    if (!selectedStudent) return;
    
    try {
      const res = await fetch(`/api/subscriptions/admin/${selectedStudent.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: subscriptionForm.planName,
          days: Number(subscriptionForm.days)
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('✅ Subscription activated successfully');
        setShowPaymentModal(false);
        setSelectedStudent(null);
        fetchStudents();
      } else {
        alert('❌ Failed to activate subscription');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error activating subscription');
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedStudent) return;
    
    try {
      const res = await fetch(`/api/subscriptions/admin/${selectedStudent.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: Number(subscriptionForm.days)
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('✅ Subscription extended successfully');
        setShowPaymentModal(false);
        setSelectedStudent(null);
        fetchStudents();
      } else {
        alert('❌ Failed to extend subscription');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error extending subscription');
    }
  };

  const handleToggleService = async (studentId, currentStatus) => {
    try {
      const res = await fetch(`/api/subscriptions/admin/${studentId}/toggle-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !currentStatus
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`✅ Service ${!currentStatus ? 'enabled' : 'disabled'}`);
        fetchStudents();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error toggling service');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubscriptionStatus = (student) => {
    if (!student.subscription) return 'No Subscription';
    const endDate = new Date(student.subscription.end_date);
    const now = new Date();
    if (endDate < now) return 'Expired';
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 5) return `Expiring (${daysLeft}d)`;
    return 'Active';
  };

  const getStatusColor = (status) => {
    if (status.includes('Active')) return C.success;
    if (status.includes('Expiring')) return C.gold;
    if (status.includes('Expired')) return C.danger;
    return C.textMuted;
  };

  if (loading) {
    return (
      <div style={{ padding: RES.spacingXl, textAlign: 'center' }}>
        <p style={{ color: C.textMuted }}>Loading students...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingXl }}>
      <h2 style={{ color: C.text, margin: 0, fontSize: RES.font3xl, fontWeight: 900 }}>
        👥 Manage Student Subscriptions
      </h2>

      {/* ── SEARCH & FILTERS ── */}
      <Card>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: RES.spacingMd
        }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              🔍 Search Student
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
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Subscription Status
            </label>
            <select
              value={filters.subscriptionStatus}
              onChange={(e) => setFilters({ ...filters, subscriptionStatus: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bgCard2,
                color: C.text,
                fontSize: 13
              }}
            >
              <option value="">All Students</option>
              <option value="active">Active Subscription</option>
              <option value="expired">Expired</option>
              <option value="none">No Subscription</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── STUDENTS LIST ── */}
      <Card>
        <h3 style={{ color: C.text, margin: '0 0 16px', fontSize: RES.fontLg, fontWeight: 700 }}>
          Students ({filteredStudents.length})
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
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Subscription
                </th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Service
                </th>
                <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const status = getSubscriptionStatus(student);
                const isServiceEnabled = student.admin_control?.service_enabled !== false;
                
                return (
                  <tr key={student.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: RES.spacingMd, color: C.text, fontWeight: 600 }}>
                      {student.name}
                    </td>
                    <td style={{ padding: RES.spacingMd, color: C.textMuted, fontSize: 12 }}>
                      {student.email}
                    </td>
                    <td style={{ padding: RES.spacingMd }}>
                      <Badge
                        text={status}
                        type={getStatusColor(status) === C.success ? 'success' :
                          getStatusColor(status) === C.gold ? 'warning' :
                          getStatusColor(status) === C.danger ? 'danger' : 'default'}
                      />
                    </td>
                    <td style={{ padding: RES.spacingMd }}>
                      <Badge
                        text={isServiceEnabled ? '✓ Enabled' : '✗ Disabled'}
                        type={isServiceEnabled ? 'success' : 'danger'}
                      />
                    </td>
                    <td style={{ padding: RES.spacingMd }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Btn
                          onClick={() => {
                            setSelectedStudent(student);
                            setSubscriptionForm({
                              planName: student.subscription?.plan_name || 'monthly',
                              days: 30
                            });
                            setShowPaymentModal(true);
                          }}
                          variant="primary"
                          size="xs"
                        >
                          {student.subscription ? '🔄 Extend' : '➕ Activate'}
                        </Btn>
                        <Btn
                          onClick={() => handleToggleService(student.id, isServiceEnabled)}
                          variant={isServiceEnabled ? 'danger' : 'success'}
                          size="xs"
                        >
                          {isServiceEnabled ? '🔒 Block' : '🔓 Unblock'}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', padding: RES.spacingXl }}>
            <p style={{ color: C.textMuted }}>No students found</p>
          </div>
        )}
      </Card>

      {/* ── SUBSCRIPTION ACTION MODAL ── */}
      <Modal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedStudent(null);
        }}
        title={selectedStudent ? `${selectedStudent.subscription ? 'Extend' : 'Activate'} Subscription - ${selectedStudent.name}` : 'Subscription'}
      >
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingMd }}>
            {/* Current Status */}
            {selectedStudent.subscription && (
              <Card style={{ background: C.bgCard2 }}>
                <p style={{ color: C.textMuted, margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>
                  Current Subscription
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: RES.spacingMd
                }}>
                  <div>
                    <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Expires</p>
                    <p style={{ color: C.text, fontWeight: 700, margin: '4px 0 0' }}>
                      {new Date(selectedStudent.subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>Plan</p>
                    <p style={{ color: C.primary, fontWeight: 700, margin: '4px 0 0' }}>
                      {selectedStudent.subscription.plan_name.toUpperCase()}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Form */}
            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Plan Type
              </label>
              <select
                value={subscriptionForm.planName}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planName: e.target.value })}
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
                <option value="monthly">Monthly (30 days)</option>
                <option value="quarterly">Quarterly (90 days)</option>
                <option value="annual">Annual (365 days)</option>
              </select>
            </div>

            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                value={subscriptionForm.days}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, days: e.target.value })}
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: RES.spacingMd }}>
              <Btn
                onClick={selectedStudent.subscription ? handleExtendSubscription : handleActivateSubscription}
                variant="primary"
              >
                {selectedStudent.subscription ? '✅ Extend Subscription' : '✅ Activate Subscription'}
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
