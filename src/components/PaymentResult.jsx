import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../services/apiClient.js';

export default function PaymentResult() {
  const [state, setState] = useState({ loading: true, status: 'pending', message: '' });

  useEffect(() => {
    const url = new URL(window.location.href);
    const orderId = url.searchParams.get('orderId');
    const status = url.searchParams.get('status');
    if (!orderId) {
      setState({ loading: false, status: 'invalid', message: 'No order id provided.' });
      return;
    }
    (async () => {
      try {
        const resp = await paymentAPI.verify(orderId);
        const data = resp?.data || resp;
        setState({ loading: false, status: data.status, message: data.payment?.failureReason || '' });
      } catch (err) {
        setState({ loading: false, status: status || 'unknown', message: err.message });
      }
    })();
  }, []);

  const colour = { success: '#16a34a', failed: '#dc2626', pending: '#f59e0b' }[state.status] || '#64748b';

  return (
    <div style={{ maxWidth: 520, margin: '64px auto', padding: 24, background: 'white',
      borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <h1 style={{ color: colour, marginBottom: 12 }}>
        {state.loading ? 'Verifying payment…' :
          state.status === 'success' ? '✅ Payment Successful'
          : state.status === 'failed' ? '❌ Payment Failed'
          : `Status: ${state.status}`}
      </h1>
      {state.message && <p style={{ color: '#475569' }}>{state.message}</p>}
      <p style={{ color: '#64748b' }}>You may close this tab and return to your dashboard.</p>
      <a href="/" style={{ color: '#2563eb', fontWeight: 600 }}>Go to dashboard</a>
    </div>
  );
}
