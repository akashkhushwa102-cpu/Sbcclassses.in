import React, { useEffect, useState } from 'react';
import { DB } from '../config/database.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const SubscriptionComponent = ({ userId, currentUser, C, RES, Btn, Card, Badge, PBar, Modal, useScreenSize, t }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { width, isMobile } = useScreenSize();

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard' },
    { id: 'net_banking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
    { id: 'paytm', name: 'Paytm Wallet', icon: '📦', description: 'Paytm balance' }
  ];

  // Load subscription data 
  useEffect(() => {
    loadSubscriptionData();
    loadPaymentPlans();
    loadPaymentHistory();
    checkPaymentStatus();
  }, [userId]);

  const checkPaymentStatus = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      setSuccess('✅ Payment successful! Subscription activated.');
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setSuccess(null);
        loadSubscriptionData();
      }, 3000);
    } else if (params.get('status') === 'failed') {
      setError('❌ Payment failed. Please try again.');
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setError(null);
      }, 5000);
    }
  };

  const loadPaymentPlans = async () => {
    // Prefer backend-synced subscription plans (these are requested with onboarding filters)
    try {
      const cached = DB.get('subscriptionPlans');
      if (Array.isArray(cached) && cached.length > 0) {
        setPlans(cached);
        return;
      }
    } catch (_) { /* ignore */ }

    // Fallback to PayTM plans endpoint
    try {
      const response = await fetch(`${API_BASE}/paytm/plans`);
      const data = await response.json();
      if (data.success && data.plans) {
        setPlans(data.plans);
        return;
      }
    } catch (err) {
      console.error('Error loading paytm plans:', err);
    }

    // Final fallback to local defaults
    const defaultPlans = [
      { planType: 'monthly', display_name: '1 Month', priceInRupees: 999, duration: 30, name: 'monthly' },
      { planType: 'quarterly', display_name: '3 Months', priceInRupees: 2499, duration: 90, name: 'quarterly' },
      { planType: 'annual', display_name: '1 Year', priceInRupees: 8499, duration: 365, name: 'annual' },
    ];
    setPlans(defaultPlans);
  };

  const loadSubscriptionData = async () => {
    try {
      const studentId = userId || currentUser?.id;
      if (!studentId) return;

      const response = await fetch(`${API_BASE}/paytm/subscription/${studentId}`);
      const data = await response.json();
      
      if (data.success && data.subscription) {
        setSubscription({
          status: "active",
          plan_name: data.subscription.planName || "premium",
          start_date: data.subscription.startDate,
          end_date: data.subscription.endDate,
          progress: Math.max(0, Math.min(100, data.subscription.progress || 50))
        });
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      // Fallback to localStorage
      const students = JSON.parse(localStorage.getItem("sbc_students")) || [];
      const student = students.find(s => s.id === userId || s.rollNo === userId) || currentUser;
      
      if (student?.subscription?.active) {
        setSubscription({
          status: "active",
          plan_name: student.subscription.planName || "premium",
          start_date: student.subscription.startDate || new Date().toISOString(),
          end_date: student.subscription.expiresOn || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          progress: 45
        });
      }
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const studentId = userId || currentUser?.id;
      if (!studentId) return;

      const response = await fetch(`${API_BASE}/paytm/history/${studentId}`);
      const data = await response.json();
      
      if (data.success && data.payments) {
        setPaymentHistory(data.payments);
      }
    } catch (err) {
      console.error('Error loading payment history:', err);
      const txnHistory = JSON.parse(localStorage.getItem("sbc_txnHistory")) || [];
      setPaymentHistory(txnHistory.filter(t => t.studentId === userId));
    }
  };

  const handleBuyPlan = (plan) => {
    setSelectedPlan(plan);
    setSelectedPaymentMethod('upi');
    setShowPlanModal(false);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    try {
      setPaymentLoading(true);
      const studentId = userId || currentUser?.id;
      
      if (!studentId) {
        setError('Student ID not found. Please refresh and try again.');
        return;
      }

      if (!selectedPlan) {
        setError('No plan selected');
        return;
      }

      // Call initiate payment endpoint with payment method
      const response = await fetch(`${API_BASE}/paytm/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          studentId,
          planType: selectedPlan.planType || selectedPlan.name || 'monthly',
          paymentMethod: selectedPaymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Redirect to PayTM gateway or show payment form
      if (data.paytmParams && data.paytmGatewayUrl) {
        // Create hidden form and submit to PayTM
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${data.paytmGatewayUrl}`;
        form.target = '_self';

        Object.keys(data.paytmParams).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.paytmParams[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        setError('Payment gateway configuration error');
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getDaysUntilExpiry = () => {
    if (!subscription) return null;
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const days = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const showExpiryWarning = () => {
    const days = getDaysUntilExpiry();
    if (!days) return false;
    return days <= 5 && days > 0;
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingXl }}>
        <Card style={{ background: '#EF444422', border: `1px solid #EF4444` }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ color: '#EF4444', fontWeight: 900 }}>Error</h3>
            <p style={{ color: C.textMuted }}>{error}</p>
            <Btn onClick={() => setError(null)} variant="primary" size="sm" style={{ marginTop: 16 }}>
              Dismiss
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingXl }}>
      {/* ── SUCCESS ALERT ── */}
      {success && (
        <Card style={{ background: '#10B98122', border: `1px solid #10B981` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: RES.spacingMd }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <p style={{ color: '#10B981', fontWeight: 700, margin: 0 }}>{success}</p>
          </div>
        </Card>
      )}

      {/* ── ERROR ALERT ── */}
      {error && (
        <Card style={{ background: '#EF444422', border: `1px solid #EF4444` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: RES.spacingMd }}>
            <span style={{ fontSize: 24 }}>❌</span>
            <p style={{ color: '#EF4444', fontWeight: 700, margin: 0 }}>{error}</p>
          </div>
        </Card>
      )}
      {/* ── ACTIVE SUBSCRIPTION CARD ── */}
      {subscription && subscription.status === 'active' ? (
        <Card glow={subscription.status === 'active'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: RES.spacingLg, flexWrap: 'wrap', gap: RES.spacingMd }}>
            <div>
              <h3 style={{ color: C.text, margin: '0 0 4px', fontSize: RES.fontLg }}>
                ✓ Active Subscription
              </h3>
              <p style={{ color: C.textMuted, margin: 0, fontSize: 12 }}>
                {subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1)} Plan
              </p>
            </div>
            <Badge text="ACTIVE" type="success" />
          </div>

          {/* Warning Alert (if expiring soon) */}
          {showExpiryWarning() && (
            <div style={{
              background: '#F59E0B22',
              border: `1px solid #F59E0B44`,
              borderRadius: 10,
              padding: RES.spacingMd,
              marginBottom: RES.spacingLg,
              display: 'flex',
              gap: RES.spacingMd,
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#F59E0B', fontWeight: 700, margin: 0, fontSize: 13 }}>
                  Expiring Soon!
                </p>
                <p style={{ color: '#F59E0B99', margin: '2px 0 0', fontSize: 12 }}>
                  Your subscription expires in {getDaysUntilExpiry()} days. Renew now!
                </p>
              </div>
            </div>
          )}

          {/* Subscription Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: RES.spacingMd,
            marginBottom: RES.spacingLg
          }}>
            {[
              { label: 'Start Date', value: new Date(subscription.start_date).toLocaleDateString() },
              { label: 'Expiry Date', value: new Date(subscription.end_date).toLocaleDateString() },
              { label: 'Days Left', value: getDaysUntilExpiry(), color: C.primary },
              { label: 'Status', value: 'Active', color: C.success }
            ].map((item, i) => (
              <div key={i} style={{ padding: RES.spacingMd, background: C.bgCard2, borderRadius: 10 }}>
                <p style={{ color: C.textMuted, margin: '0 0 6px', fontSize: 11, fontWeight: 600 }}>
                  {item.label}
                </p>
                <p style={{
                  color: item.color || C.text,
                  margin: 0,
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 700
                }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: RES.spacingLg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>Plan Usage</span>
              <span style={{ color: C.primary, fontSize: 12, fontWeight: 700 }}>
                {Math.round(subscription.progress || 0)}%
              </span>
            </div>
            <PBar value={subscription.progress || 0} color={C.primary} height={8} />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: RES.spacingMd, flexWrap: 'wrap' }}>
            <Btn
              onClick={() => setShowPlanModal(true)}
              variant="primary"
              size={isMobile ? 'sm' : 'md'}
            >
              🔄 Extend Subscription
            </Btn>
            <Btn
              onClick={() => setShowPlanModal(true)}
              variant="ghost"
              size={isMobile ? 'sm' : 'md'}
            >
              View Plans
            </Btn>
          </div>
        </Card>
      ) : (
        /* NO SUBSCRIPTION CARD */
        <Card style={{ textAlign: 'center' }}>
          <div style={{ padding: RES.spacingXl, paddingTop: RES.spacing3xl }}>
            <h3 style={{ color: C.text, fontSize: RES.fontXl, margin: '0 0 12px' }}>
              ❌ No Active Subscription
            </h3>
            <p style={{ color: C.textMuted, margin: '0 0 24px', fontSize: 14 }}>
              Subscribe to get access to all classes and exclusive content
            </p>
            <Btn onClick={() => setShowPlanModal(true)} variant="primary" size="lg">
              Subscribe Now
            </Btn>
          </div>
        </Card>
      )}

      {/* ── PLANS SELECTION MODAL ── */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Choose Your Plan">
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: RES.spacingMd,
          marginBottom: RES.spacingXl
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                border: `2px solid ${C.border}`,
                borderRadius: 14,
                padding: RES.spacingLg,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.boxShadow = `0 8px 24px ${C.primary}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h4 style={{ color: C.text, margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
                {plan.display_name || plan.name}
              </h4>
              <div style={{
                fontSize: 28,
                fontWeight: 900,
                color: C.primary,
                margin: '12px 0 8px'
              }}>
                ₹{plan.priceInRupees || plan.amount}
              </div>
              <p style={{ color: C.textMuted, margin: '0 0 16px', fontSize: 12 }}>
                {plan.duration || plan.duration_days} days access
              </p>
              <Btn
                onClick={() => handleBuyPlan(plan)}
                variant="gold"
                size="sm"
                disabled={paymentLoading}
                style={{ width: '100%' }}
              >
                {paymentLoading ? '⏳ Processing...' : '💳 Buy Now'}
              </Btn>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── PAYMENT HISTORY ── */}
      <Card>
        <h3 style={{ color: C.text, fontSize: RES.fontLg, margin: '0 0 16px', fontWeight: 700 }}>
          💳 Payment History
        </h3>

        {paymentHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Plan</th>
                  <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: RES.spacingMd, color: C.textMuted, fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: RES.spacingMd, color: C.text }}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: RES.spacingMd, color: C.primary, fontWeight: 700 }}>
                      ₹{payment.amount}
                    </td>
                    <td style={{ padding: RES.spacingMd, color: C.text }}>
                      {payment.plan_name.charAt(0).toUpperCase() + payment.plan_name.slice(1)}
                    </td>
                    <td style={{ padding: RES.spacingMd, color: C.textMuted, fontSize: 11, fontFamily: 'monospace' }}>
                      {payment.payment_id.slice(0, 12)}...
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
        ) : (
          <p style={{ color: C.textMuted, textAlign: 'center', padding: RES.spacingXl, margin: 0 }}>
            No payments yet
          </p>
        )}
      </Card>

      {/* ── PAYMENT METHOD SELECTION MODAL ── */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="💳 Select Payment Method">
        <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingMd }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: RES.spacingMd, marginBottom: RES.spacingXl }}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                style={{
                  border: `2px solid ${selectedPaymentMethod === method.id ? C.primary : C.border}`,
                  borderRadius: 12,
                  padding: RES.spacingLg,
                  cursor: 'pointer',
                  background: selectedPaymentMethod === method.id ? `${C.primary}11` : C.bgCard2,
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: RES.spacingMd
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{method.icon}</span>
                  {selectedPaymentMethod === method.id && (
                    <span style={{ fontSize: 20, color: C.primary }}>✓</span>
                  )}
                </div>
                <h4 style={{ color: C.text, margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>
                  {method.name}
                </h4>
                <p style={{ color: C.textMuted, margin: 0, fontSize: 12 }}>
                  {method.description}
                </p>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <Card style={{ background: `${C.primary}11`, border: `1px solid ${C.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: C.textMuted, margin: 0, fontSize: 12 }}>Plan Amount</p>
                  <p style={{ color: C.primary, margin: '4px 0 0', fontSize: 18, fontWeight: 900 }}>
                    ₹{(selectedPlan.priceInRupees || selectedPlan.amount).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p style={{ color: C.textMuted, margin: 0, fontSize: 12 }}>Duration</p>
                  <p style={{ color: C.primary, margin: '4px 0 0', fontSize: 16, fontWeight: 700 }}>
                    {selectedPlan.duration || selectedPlan.duration_days} days
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', gap: RES.spacingMd }}>
            <Btn
              onClick={handleConfirmPayment}
              variant="primary"
              disabled={paymentLoading}
              style={{ flex: 1 }}
            >
              {paymentLoading ? '⏳ Processing...' : '✅ Proceed to Payment'}
            </Btn>
            <Btn 
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPlan(null);
              }}
              variant="ghost"
              style={{ flex: 1 }}
            >
              ❌ Cancel
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ── TIPS ── */}
      <Card style={{ background: `${C.info}11` }}>
        <div style={{ display: 'flex', gap: RES.spacingMd }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: C.text, margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>
              Pro Tip: Subscribe for a year to get the best value!
            </p>
            <p style={{ color: C.textMuted, margin: 0, fontSize: 12 }}>
              Annual plans offer 34% savings compared to monthly payments.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
