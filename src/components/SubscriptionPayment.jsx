import React, { useState, useEffect } from 'react';
import './SubscriptionPayment.css';

/**
 * Subscription Payment Component
 * Handles subscription selection, payment initiation, and status display
 * 
 * Usage:
 * <SubscriptionPayment studentId={currentStudent.id} onPaymentSuccess={handleSuccess} />
 */

const SubscriptionPayment = ({ studentId, onPaymentSuccess }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'subscription', 'history'

  // Fetch available plans on component mount
  useEffect(() => {
    fetchPlans();
    if (studentId) {
      fetchSubscriptionStatus();
      fetchPaymentHistory();
    }
  }, [studentId]);

  // Fetch available subscription plans
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/payments/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
        setSelectedPlan(data.plans[0]?.planType || 'monthly');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans');
    }
  };

  // Fetch current subscription status
  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/payments/subscription/${studentId}`);
      const data = await response.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`/api/payments/history/${studentId}`);
      const data = await response.json();
      if (data.success) {
        setPaymentHistory(data.payments);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    }
  };

  // Initiate payment
  const initiatePayment = async () => {
    if (!studentId) {
      setError('Student ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          planType: selectedPlan
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Step 2: Open Razorpay Checkout
      const RazorpayOptions = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount, // Amount in paise
        currency: 'INR',
        order_id: orderData.orderId,
        name: 'SBC Classes Subscription',
        description: orderData.planName,
        image: 'https://yourdomain.com/logo.png', // Optional: your app logo
        
        handler: async (response) => {
          await handlePaymentSuccess(response, orderData.paymentId);
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log('Payment cancelled by user');
          }
        },

        prefill: {
          email: orderData.studentEmail,
          contact: orderData.contactPhone,
          name: orderData.studentName
        },

        theme: {
          color: '#3399cc'
        },

        notes: orderData.notes
      };

      // Open Razorpay Checkout
      if (window.Razorpay) {
        const razorpay = new window.Razorpay(RazorpayOptions);
        razorpay.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (response, paymentRecordId) => {
    try {
      // Step 3: Verify payment on backend
      const verifyResponse = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        // Payment verified successfully
        setError(null);
        alert('🎉 Subscription activated successfully!');
        
        // Refresh subscription status and payment history
        await fetchSubscriptionStatus();
        await fetchPaymentHistory();

        // Call callback if provided
        if (onPaymentSuccess) {
          onPaymentSuccess(verifyData.subscription);
        }
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

    } catch (err) {
      console.error('Payment verification error:', err);
      setError(`Payment verification failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format price in INR
  const formatPrice = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'danger';
      case 'cancelled': return 'warning';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="subscription-container">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible">
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="nav nav-tabs mb-4">
        <button
          className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          📋 Available Plans
        </button>
        <button
          className={`nav-link ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          🔄 My Subscription
        </button>
        <button
          className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Payment History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="plans-section">
            <h3>Choose Your Subscription Plan</h3>
            <p className="text-muted">Select a plan and complete payment in just 30 seconds using UPI or any payment method</p>

            <div className="plans-grid">
              {plans.map((plan) => (
                <div
                  key={plan.planType}
                  className={`plan-card ${selectedPlan === plan.planType ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.planType)}
                >
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="plan-price">
                    <span className="price">{formatPrice(plan.price)}</span>
                    <span className="duration">for {plan.duration} days</span>
                  </div>

                  <div className="plan-features">
                    <ul>
                      <li>✅ Access to all classes</li>
                      <li>✅ Study materials included</li>
                      <li>✅ 24/7 Support</li>
                      <li>✅ Auto-renewal option</li>
                    </ul>
                  </div>

                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={() => initiatePayment()}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              ))}
            </div>

            {/* Payment Methods Info */}
            <div className="mt-5 payment-info">
              <h5>Accepted Payment Methods</h5>
              <div className="payment-methods">
                <span className="badge badge-info">UPI</span>
                <span className="badge badge-info">Credit Card</span>
                <span className="badge badge-info">Debit Card</span>
                <span className="badge badge-info">Netbanking</span>
                <span className="badge badge-info">Wallets</span>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="subscription-section">
            <h3>My Subscription Status</h3>

            {subscription ? (
              <div className="subscription-card">
                <div className="subscription-header">
                  <h4>{subscription.planName}</h4>
                  <span className={`badge badge-${getStatusColor(subscription.status)}`}>
                    {subscription.status.toUpperCase()}
                  </span>
                </div>

                <div className="subscription-details">
                  <div className="detail-row">
                    <span className="label">Plan Type:</span>
                    <span className="value">{subscription.billingCycle}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Amount Paid:</span>
                    <span className="value">{formatPrice(subscription.planPrice)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Start Date:</span>
                    <span className="value">{formatDate(subscription.startDate)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">End Date:</span>
                    <span className="value">{formatDate(subscription.endDate)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Days Remaining:</span>
                    <span className="value">
                      {subscription.isExpired ? (
                        <span style={{ color: 'red' }}>Expired</span>
                      ) : (
                        `${subscription.daysRemaining} days`
                      )}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Auto-Renew:</span>
                    <span className="value">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                {subscription.isExpired && (
                  <button
                    className="btn btn-primary mt-4"
                    onClick={() => setActiveTab('plans')}
                  >
                    Renew Subscription
                  </button>
                )}
              </div>
            ) : (
              <div className="no-subscription">
                <p>No active subscription found</p>
                <p className="text-muted">Subscribe to access all classes and features</p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setActiveTab('plans')}
                >
                  View Plans
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="history-section">
            <h3>Payment History</h3>

            {paymentHistory.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.createdAt)}</td>
                        <td>{payment.planName}</td>
                        <td>{formatPrice(payment.amount)}</td>
                        <td>
                          <span className="badge badge-secondary">
                            {payment.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          <small>ID: {payment.razorpayPaymentId || 'Pending'}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-history">
                <p>No payment history found</p>
                <p className="text-muted">Your payments will appear here once you make a purchase</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="help-section mt-5">
        <h5>Need Help?</h5>
        <ul>
          <li>✅ Payment is secure and instant</li>
          <li>✅ Subscription activates immediately after successful payment</li>
          <li>✅ Receive confirmation email with subscription details</li>
          <li>✅ Auto-renewal can be disabled anytime from settings</li>
          <li>✅ Money-back guarantee if not satisfied</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
