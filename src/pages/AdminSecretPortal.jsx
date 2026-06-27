/* ============================================================
   ADMIN SECRET PORTAL  (production)
   ------------------------------------------------------------
   Same 2-step look:
     Step 1 — captcha + email + password (verified against the
              backend at /api/auth/login, must return role=admin)
     Step 2 — secret access key (configurable via VITE_ADMIN_SECRET,
              default "SBC2024" for backwards compat)
   On success the JWT is stored and onAdminLogin(user) is called.
   ============================================================ */

import React, { useEffect, useState } from 'react';
import { Btn } from '../components/Shared/SharedComponents.jsx';
import { C } from '../constants/colors.js';
import { authAPI, auth as authStore } from '../services/apiClient.js';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'SBC2024';
const RATE_KEY = 'sbc_admin_login_attempts';
const MAX_ATTEMPTS = 5;
const BLOCK_MIN = 5;

const checkRate = () => {
  const list = JSON.parse(localStorage.getItem(RATE_KEY) || '[]');
  const now = Date.now();
  const recent = list.filter((t) => now - t < BLOCK_MIN * 60_000);
  if (recent.length >= MAX_ATTEMPTS) {
    const oldest = Math.min(...recent);
    const wait = Math.ceil((BLOCK_MIN * 60_000 - (now - oldest)) / 60_000);
    return { allowed: false, wait };
  }
  return { allowed: true };
};
const recordAttempt = () => {
  const list = JSON.parse(localStorage.getItem(RATE_KEY) || '[]');
  list.push(Date.now());
  localStorage.setItem(RATE_KEY, JSON.stringify(list.slice(-MAX_ATTEMPTS * 2)));
};
const clearAttempts = () => localStorage.removeItem(RATE_KEY);

export default function AdminSecretPortal({ onAdminLogin, onBack }) {
  const [step, setStep] = useState(1);   // 1=credentials, 2=secret key, 3=blocked
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [tempToken, setTempToken] = useState(null);
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { q: `${a} + ${b} = ?`, ans: String(a + b) };
  });
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    let t;
    if (blockTimer > 0) t = setInterval(() => setBlockTimer((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [blockTimer]);

  const handleStep1 = async () => {
    setErr('');
    if (captchaInput !== captcha.ans) { setErr('❌ Wrong CAPTCHA. Please try again.'); return; }
    const rl = checkRate();
    if (!rl.allowed) {
      setStep(3); setBlockTimer(rl.wait * 60); return;
    }
    if (!email.trim() || !pass) { setErr('Email and password are required.'); return; }
    setLoading(true);
    try {
      const resp = await authAPI.login(email.trim().toLowerCase(), pass);
      const data = resp?.data || resp;
      const { token, user } = data;
      if (!token || !user) throw new Error('Invalid server response');
      if (user.role !== 'admin') {
        recordAttempt();
        throw new Error('This account is not an administrator.');
      }
      // Step 1 OK — keep the token cached for after step 2.
      // Don't persist the token yet — hold it in component state until secret key is verified.
      setTempToken(token);
      setVerifiedUser(user);
      setStep(2);
    } catch (e) {
      recordAttempt();
      setErr(`❌ ${e.message || 'Login failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = () => {
    setErr('');
    if (secretKey !== ADMIN_SECRET) {
      setErr('❌ Wrong Secret Key.'); return;
    }
    clearAttempts();
    // Persist the token and user now that the secret key is verified.
    if (tempToken && verifiedUser) {
      authStore.setToken(tempToken);
      authStore.setUser(verifiedUser);
    }
    onAdminLogin?.(verifiedUser);
  };

  // ---- Blocked screen ----
  if (step === 3) return (
    <div style={{ minHeight: '100vh', background: '#0A0005', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
        <h2 style={{ color: C.danger, fontSize: 24, fontWeight: 900, margin: '0 0 12px' }}>Access Blocked!</h2>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
          Too many failed attempts. This portal is temporarily blocked.
        </p>
        {blockTimer > 0 && (
          <div style={{ background: '#EF444411', border: '1px solid #EF444433',
            borderRadius: 14, padding: '20px', marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.danger }}>
              {Math.floor(blockTimer / 60)}:{String(blockTimer % 60).padStart(2, '0')}
            </div>
            <div style={{ color: C.textMuted, fontSize: 13, marginTop: 6 }}>minutes remaining</div>
          </div>
        )}
        <p style={{ color: C.textMuted, fontSize: 12 }}>This event has been recorded.</p>
        <Btn variant="ghost" onClick={onBack} style={{ marginTop: 20 }}>← Go Back</Btn>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#08060F',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #FF6B0008 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.textDim, cursor: 'pointer',
          fontSize: 13, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back</button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            background: '#EF444411', border: '1px solid #EF444433',
            borderRadius: 99, padding: '8px 18px' }}>
            <span style={{ fontSize: 14 }}>🔐</span>
            <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
              SECURE ADMIN PORTAL
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 70, height: 70, borderRadius: 18, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
            border: '2px solid #EF444444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#EF4444',
            boxShadow: '0 0 40px #EF444422',
          }}>🛡️</div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: '0 0 6px' }}>
            Owner / Admin Login
          </h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
            {step === 1 ? 'Step 1 of 2 — Verify Credentials' : 'Step 2 of 2 — Enter Secret Key'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: step >= s ? C.danger : C.border,
            }} />
          ))}
        </div>

        <div style={{
          background: C.bgCard,
          border: `1px solid ${step === 2 ? '#EF444444' : C.border}`,
          borderRadius: 20, padding: 28,
        }}>
          {step === 1 && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  color: C.textMuted, fontSize: 11, fontWeight: 700,
                  display: 'block', marginBottom: 7, letterSpacing: 1,
                }}>ADMIN EMAIL</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sbcclasses.com"
                  autoComplete="off" spellCheck={false} type="email"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.bgCard2,
                    color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  color: C.textMuted, fontSize: 11, fontWeight: 700,
                  display: 'block', marginBottom: 7, letterSpacing: 1,
                }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input value={pass} onChange={(e) => setPass(e.target.value)}
                    type={showPass ? 'text' : 'password'} placeholder="Strong password"
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                    style={{ width: '100%', padding: '12px 44px 12px 14px',
                      borderRadius: 10, border: `1px solid ${C.border}`,
                      background: C.bgCard2, color: C.text, fontSize: 14,
                      outline: 'none', boxSizing: 'border-box' }} />
                  <button onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 16,
                  }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <div style={{
                background: C.bgCard2, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 18,
              }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>
                  🤖 CAPTCHA VERIFICATION
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    background: C.bgCard3, borderRadius: 8, padding: '8px 16px',
                    fontSize: 18, fontWeight: 900, color: C.gold,
                    letterSpacing: 4, fontFamily: 'monospace',
                  }}>{captcha.q}</div>
                  <input value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Answer"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.bgCard3,
                      color: C.text, fontSize: 16, outline: 'none',
                      textAlign: 'center', fontWeight: 700 }} />
                </div>
              </div>

              {err && (
                <div style={{
                  background: '#EF444411', border: '1px solid #EF444433',
                  borderRadius: 10, padding: '10px 14px', color: C.danger,
                  fontSize: 13, marginBottom: 16, textAlign: 'center',
                }}>{err}</div>
              )}

              <Btn variant="danger" size="lg" onClick={handleStep1}
                disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  opacity: loading ? 0.6 : 1 }}>
                {loading ? '⏳ Verifying...' : '🔐 Verify →'}
              </Btn>
              <div style={{
                marginTop: 16, padding: '10px 14px', borderRadius: 10,
                background: '#FFFFFF08', fontSize: 12, color: C.textDim, textAlign: 'center',
              }}>⚠️ Unauthorized access is logged.</div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{
                textAlign: 'center', marginBottom: 24, padding: '16px',
                background: '#10B98111', border: '1px solid #10B98133', borderRadius: 14,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ color: C.success, fontWeight: 800, fontSize: 15 }}>Credentials Verified!</div>
                <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Step 2: Enter Secret Key</div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  color: C.textMuted, fontSize: 11, fontWeight: 700,
                  display: 'block', marginBottom: 7, letterSpacing: 1,
                }}>SECRET ACCESS KEY</label>
                <input value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                  type="password" placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleStep2()}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 10,
                    border: '1px solid #EF444444', background: C.bgCard2,
                    color: C.text, fontSize: 18, outline: 'none',
                    boxSizing: 'border-box', textAlign: 'center', letterSpacing: 6 }} />
              </div>
              {err && (
                <div style={{
                  background: '#EF444411', border: '1px solid #EF444433',
                  borderRadius: 10, padding: '10px 14px', color: C.danger,
                  fontSize: 13, marginBottom: 16, textAlign: 'center',
                }}>{err}</div>
              )}
              <Btn variant="danger" size="lg" onClick={handleStep2}
                style={{ width: '100%', background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                🔓 Open Admin Panel
              </Btn>
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: C.textDim }}>
                💡 Set <code>VITE_ADMIN_SECRET</code> in <code>.env.local</code> to override the default key.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
