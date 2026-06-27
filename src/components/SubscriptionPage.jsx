/* ============================================================
   STUDENT SUBSCRIPTION PAGE  (v4.2 - PhonePe + Paytm + Direct UPI)
   ------------------------------------------------------------
   Three payment paths per plan/batch:
     1. PhonePe   - automated gateway via /api/phonepe/initiate
     2. Paytm     - automated gateway via /api/payments/initiate
     3. Direct UPI - student pays admin's UPI ID, admin approves manually
   ============================================================ */
import React, { useEffect, useState, useCallback } from 'react';
import {
  batchAPI, planAPI, paymentAPI, subscriptionAPI, auth as authStore,
} from '../services/apiClient.js';
import { toast } from '../hooks/useToast.jsx';

const card = {
  background: 'white', borderRadius: 14, padding: 20,
  boxShadow: '0 6px 24px rgba(0,0,0,0.08)', marginBottom: 16,
};
const button = {
  background: '#2563eb', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: 10, fontWeight: 600,
  cursor: 'pointer', fontSize: 15,
};
const buttonOutline = {
  background: 'transparent', color: '#16a34a', border: '1px solid #16a34a',
  padding: '10px 18px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 15,
};
const badge = (bg) => ({
  background: bg, color: 'white', padding: '4px 10px',
  borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block',
});

const fmtPrice = (n) => `Rs.${Number(n).toLocaleString('en-IN')}`;
const dur = (d) => (d >= 365 ? `${Math.round(d / 30)} months` : `${d} days`);

// Discounted price (rounded). Returns same as input if no offer.
const discountedPrice = (p) => {
  const off = Number(p.offerPercentage || 0);
  if (off <= 0) return Number(p.price) || 0;
  return Math.round((Number(p.price) || 0) * (100 - off) / 100);
};

// Pricing block component — shows original strikethrough + discounted big.
function PriceBlock({ plan, big = false }) {
  const off = Number(plan.offerPercentage || 0);
  const price = Number(plan.price) || 0;
  const final = discountedPrice(plan);
  if (off <= 0) {
    return <div style={{ fontSize: big ? 28 : 22, fontWeight: 800, color: '#1e3a8a' }}>{fmtPrice(price)}</div>;
  }
  return (
    <div>
      <div style={{ fontSize: big ? 14 : 13, color: '#94a3b8', textDecoration: 'line-through' }}>{fmtPrice(price)}</div>
      <div style={{ fontSize: big ? 28 : 22, fontWeight: 800, color: '#16a34a' }}>{fmtPrice(final)}</div>
      <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>{off}% OFF</div>
    </div>
  );
}

const pickArray = (resp) => (Array.isArray(resp?.data) ? resp.data
  : Array.isArray(resp?.data?.items) ? resp.data.items
  : Array.isArray(resp) ? resp : []);

// =========================================================
// UPI Pay Modal - inline (small enough to stay in this file)
// =========================================================
function UpiPayModal({ open, onClose, item, onSubmitted }) {
  const [cfg, setCfg] = useState(null);
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [step, setStep] = useState(1);
  const [txnId, setTxnId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerVpa, setPayerVpa] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(1); setTxnId(''); setPayerName(''); setPayerVpa(''); setErr('');
    setLoadingCfg(true);
    paymentAPI.upiConfig()
      .then((resp) => setCfg(resp?.data || resp))
      .catch((e) => setErr(e.message || 'Failed to load UPI details'))
      .finally(() => setLoadingCfg(false));
  }, [open]);

  if (!open) return null;

  const upiId = cfg?.upiId || '';
  const upiName = cfg?.name || 'SBC Classes';
  const amount = item?.amount || 0;
  const note = `${item?.label || 'SBC Subscription'}`;
  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}` +
    `&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const submitClaim = async () => {
    setErr('');
    if (!txnId || txnId.trim().length < 6) {
      setErr('Enter the 12-digit UPI transaction reference (UTR / RRN).');
      return;
    }
    try {
      setSubmitting(true);
      await paymentAPI.upiClaim({
        planId: item.planId || null,
        batchId: item.batchId || null,
        type: item.type,
        upiTxnId: txnId.trim(),
        payerName: payerName.trim() || undefined,
        payerVpa: payerVpa.trim() || undefined,
        amount,
      });
      setStep(3);
      onSubmitted && onSubmitted();
    } catch (e) {
      setErr(e.message || 'Could not submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Pay via UPI</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>x</button>
        </div>
        <p style={{ color: '#475569', marginTop: 6 }}>
          {item?.label} - <strong>{fmtPrice(amount)}</strong>
        </p>
        {loadingCfg && <div>Loading UPI details...</div>}
        {!loadingCfg && cfg && !cfg.available && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: 12, borderRadius: 10 }}>
            UPI receiver not configured. Please contact admin or use PhonePe.
          </div>
        )}
        {!loadingCfg && cfg && cfg.available && step === 1 && (
          <>
            <div style={{ background: '#f0fdf4', border: '1px solid #16a34a33', borderRadius: 12, padding: 14, margin: '12px 0' }}>
              <div style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>SEND TO UPI ID</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4, wordBreak: 'break-all' }}>{upiId}</div>
              <div style={{ color: '#475569', fontSize: 13 }}>{upiName}</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>Note: <strong>{note}</strong></div>
            </div>
            <ol style={{ paddingLeft: 20, color: '#334155', fontSize: 14 }}>
              <li>Open GPay / PhonePe / Paytm / BHIM.</li>
              <li>Pay <strong>{fmtPrice(amount)}</strong> to <strong>{upiId}</strong>.</li>
              <li>Copy the UPI transaction reference (UTR / RRN - 12 digits).</li>
              <li>Click "I have paid" below and submit the reference.</li>
            </ol>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <a href={upiUrl} style={{ ...button, textDecoration: 'none', textAlign: 'center', flex: 1, minWidth: 140 }}>Open UPI App</a>
              <button style={{ ...buttonOutline, flex: 1, minWidth: 140 }} onClick={() => setStep(2)}>I have paid</button>
            </div>
          </>
        )}
        {!loadingCfg && step === 2 && (
          <>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#475569', fontWeight: 600 }}>UPI Transaction Reference (UTR / RRN) *</label>
              <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 412345678901" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4, fontSize: 15 }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#475569', fontWeight: 600 }}>Your Name (optional)</label>
              <input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="As shown in UPI app" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4, fontSize: 15 }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#475569', fontWeight: 600 }}>Your UPI ID (optional)</label>
              <input value={payerVpa} onChange={(e) => setPayerVpa(e.target.value)} placeholder="yourname@upi" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 4, fontSize: 15 }} />
            </div>
            {err && (<div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>{err}</div>)}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button style={{ ...buttonOutline, flex: 1 }} onClick={() => setStep(1)} disabled={submitting}>Back</button>
              <button style={{ ...button, flex: 1 }} onClick={submitClaim} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <div style={{ background: '#dcfce7', border: '1px solid #16a34a', padding: 16, borderRadius: 12, marginTop: 12 }}>
            <div style={{ fontWeight: 800, color: '#15803d', fontSize: 16 }}>Claim submitted</div>
            <div style={{ color: '#334155', marginTop: 6, fontSize: 14 }}>
              Admin will verify the transaction and activate your subscription shortly.
            </div>
            <button style={{ ...button, marginTop: 12 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================
// Main Subscription Page
// =========================================================
export default function SubscriptionPage() {
  const [batches, setBatches] = useState([]);
  const [plans, setPlans]     = useState([]);
  const [mySubs, setMySubs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(null);
  const [error, setError]     = useState(null);
  const [upiItem, setUpiItem] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [bResp, pResp, sResp] = await Promise.allSettled([
        batchAPI.list({ limit: 200 }),
        planAPI.list(),
        authStore.getToken() ? subscriptionAPI.mine() : Promise.resolve({ data: [] }),
      ]);
      setBatches(pickArray(bResp.status === 'fulfilled' ? bResp.value : null));
      setPlans(pickArray(pResp.status === 'fulfilled' ? pResp.value : null));
      setMySubs(pickArray(sResp.status === 'fulfilled' ? sResp.value : null));
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Live updates: poll the plan list every 20s so admin changes (price,
  // offerPercentage, isActive, new plans) reflect on the student page
  // without a manual reload. Cheap and battery-friendly; can be upgraded
  // to socket.io later if real-time-on-keystroke is needed.
  useEffect(() => {
    const id = setInterval(() => {
      // Only refresh when tab is visible — saves bandwidth.
      if (document.visibilityState === 'visible') refresh();
    }, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  // Listen for plan updates triggered by other tabs (admin changes)
  useEffect(() => {
    const onUpdated = (e) => {
      toast('Content updated', 'info', 3000);
      // fetch fresh data in background
      refresh();
    };
    window.addEventListener('sbc:plans-updated', onUpdated);
    return () => window.removeEventListener('sbc:plans-updated', onUpdated);
  }, [refresh]);

  // After Paytm or PhonePe redirects back ?orderId=... we re-verify.
  useEffect(() => {
    const url = new URL(window.location.href);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) return;
    const isPhonePe = orderId.startsWith('SBCPP');
    const verify = isPhonePe ? paymentAPI.phonepeVerify(orderId) : paymentAPI.verify(orderId);
    verify.catch(() => {}).finally(() => {
      url.searchParams.delete('orderId');
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.toString());
      refresh();
    });
  }, [refresh]);

  const requireLogin = () => {
    if (!authStore.getToken()) { alert('Please login first'); return false; }
    return true;
  };

  const handleBuyPhonePe = async ({ planId, batchId, type, label }) => {
    if (!requireLogin()) return;
    try {
      setPaying(label);
      const resp = await paymentAPI.phonepeInitiate({ planId, batchId, type });
      const data = resp?.data || resp;
      if (!data?.redirectUrl) throw new Error('No redirect URL returned by PhonePe');
      window.location.href = data.redirectUrl;
    } catch (err) {
      alert(`PhonePe payment could not start: ${err.message}`);
      setPaying(null);
    }
  };

  const handleBuyPaytm = async ({ planId, batchId, type, label }) => {
    if (!requireLogin()) return;
    try {
      setPaying(label);
      const resp = await paymentAPI.initiate({ planId, batchId, type, paymentMethod: 'upi' });
      const data = resp?.data || resp;
      const container = document.createElement('div');
      container.innerHTML = data.autoPostForm;
      document.body.appendChild(container);
      const form = container.querySelector('form');
      if (form) form.submit();
    } catch (err) {
      alert(`Payment could not start: ${err.message}`);
      setPaying(null);
    }
  };

  const openUpi = ({ planId, batchId, type, amount, label }) => {
    if (!requireLogin()) return;
    setUpiItem({ planId, batchId, type, amount, label });
  };

  const hasAllAccess = mySubs.some(
    (s) => s.type === 'all_access' && s.status === 'active' && new Date(s.expiryDate) > new Date()
  );
  const subscribedBatchIds = new Set(
    mySubs
      .filter((s) => s.status === 'active' && new Date(s.expiryDate) > new Date())
      .map((s) => s.batchId?._id || s.batchId)
      .filter(Boolean)
  );

  if (loading) return <div style={{ padding: 32 }}>Loading subscription options...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: '0 0 8px' }}>Subscription Plans</h1>
        <button onClick={refresh}
          title="Re-fetch plans from server"
          style={{ background: 'transparent', color: '#2563eb', border: '1px solid #2563eb', padding: '6px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          🔄 Refresh
        </button>
      </div>
      <p style={{ color: '#475569', marginTop: 0 }}>
        Choose a plan that suits you. Pay via UPI (GPay / PhonePe / Paytm / BHIM).
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>(auto-refreshes every 20s)</span>
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <section>
        <h2>All-Access Plans</h2>
        {plans.filter((p) => p.type === 'all_access').length === 0 ? (
          <div style={{ ...card, color: '#64748b' }}>No all-access plans configured yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {plans.filter((p) => p.type === 'all_access').map((p) => (
              <div key={p._id} style={{ ...card, border: '2px solid #2563eb', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                <span style={badge('#2563eb')}>ALL ACCESS</span>
                <h3 style={{ margin: '12px 0 4px' }}>{p.name}</h3>
                <PriceBlock plan={p} big />
                <div style={{ color: '#475569', marginBottom: 12 }}>{dur(p.duration)}</div>
                {p.features?.length ? (
                  <ul style={{ paddingLeft: 18, color: '#334155', marginBottom: 16 }}>
                    {p.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                ) : null}
                {hasAllAccess
                  ? <span style={badge('#16a34a')}>Active</span>
                  : (
                    <button style={{ ...button, width: '100%' }}
                      onClick={() => openUpi({ planId: p._id, type: 'all_access', amount: discountedPrice(p), label: p.name })}>
                      Subscribe via UPI
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Subject-wise plans (e.g. Maths only, Physics only) ===== */}
      <section style={{ marginTop: 32 }}>
        <h2>Subject Plans</h2>
        {plans.filter((p) => p.type === 'subject').length === 0 ? (
          <div style={{ ...card, color: '#64748b' }}>No subject-wise plans yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {plans.filter((p) => p.type === 'subject').map((p) => (
              <div key={p._id} style={{ ...card, border: '2px solid #7c3aed', background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' }}>
                <span style={badge('#7c3aed')}>{p.subject ? p.subject.toUpperCase() : 'SUBJECT'}</span>
                <h3 style={{ margin: '12px 0 4px' }}>{p.name}</h3>
                <PriceBlock plan={p} big />
                <div style={{ color: '#475569', marginBottom: 12 }}>{dur(p.duration)}</div>
                {p.features?.length ? (
                  <ul style={{ paddingLeft: 18, color: '#334155', marginBottom: 16 }}>
                    {p.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                ) : null}
                {hasAllAccess
                  ? <span style={badge('#16a34a')}>Active (via All Access)</span>
                  : (
                    <button style={{ ...button, width: '100%' }}
                      onClick={() => openUpi({ planId: p._id, type: 'subject', amount: discountedPrice(p), label: `${p.name} (${p.subject || ''})` })}>
                      Subscribe via UPI
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Batches</h2>
        {batches.length === 0 ? (
          <div style={{ ...card, color: '#64748b' }}>No batches published yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {batches.map((b) => {
              const subscribed = subscribedBatchIds.has(b._id) || hasAllAccess;
              return (
                <div key={b._id} style={card}>
                  {b.subject ? <span style={badge('#0891b2')}>{b.subject}</span> : null}
                  {b.level ? <span style={{ ...badge('#7c3aed'), marginLeft: 6 }}>{b.level}</span> : null}
                  <h3 style={{ margin: '12px 0 4px' }}>{b.name}</h3>
                  <p style={{ color: '#475569', minHeight: 40, marginTop: 0 }}>
                    {b.description || 'No description available.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{fmtPrice(b.price)}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{dur(b.duration)}</div>
                    </div>
                    {subscribed && <span style={badge('#16a34a')}>Active</span>}
                  </div>
                  {!subscribed && (
                    <button style={{ ...button, width: '100%', marginTop: 12 }}
                      onClick={() => openUpi({ batchId: b._id, type: 'batch', amount: b.price, label: b.name })}>
                      Subscribe via UPI
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {mySubs.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>My Active Subscriptions</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {mySubs.map((s) => (
              <div key={s._id} style={{ ...card, padding: 14, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{s.planName || s.type}</strong>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    Expires: {new Date(s.expiryDate).toLocaleDateString()}
                  </div>
                </div>
                <span style={badge(s.status === 'active' ? '#16a34a' : '#64748b')}>{s.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <UpiPayModal
        open={!!upiItem}
        item={upiItem}
        onClose={() => setUpiItem(null)}
        onSubmitted={() => { refresh(); }}
      />
    </div>
  );
}
