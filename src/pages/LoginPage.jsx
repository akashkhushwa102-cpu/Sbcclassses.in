/* ============================================================
   PRODUCTION LOGIN PAGE
   ------------------------------------------------------------
   Same look-and-feel as the original demo screen, but the
   submit button now goes to the real Node/MongoDB backend
   via /api/auth/login or /api/auth/register.

   On success it:
     1. Stores the JWT (auth.setToken) so every later API call
        is authenticated.
     2. Calls `onLogin(role, user)` so App.jsx routes to the
        correct dashboard exactly like before.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { authAPI, auth as authStore } from '../services/apiClient.js';
import RegistrationWizard from '../components/Onboarding/RegistrationWizard.jsx';
import { C } from '../constants/colors.js';
import { LangSwitcher } from '../components/Shared/index.jsx';
import { Btn, Input, Card } from '../components/Shared/SharedComponents.jsx';

const LoginPage = ({
  defaultRole = 'student',
  onLogin,
  onBack,
  onAdminPortal,
  addNotification,
  allowTeacher = true,
}) => {
  const [mode, setMode] = useState('login');           // login | signup
  const [role, setRole] = useState(defaultRole === 'admin' ? 'student' : defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // Optional silent re-login if a JWT is already in localStorage
  useEffect(() => {
    if (!authStore.getToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await authAPI.me();
        const u = resp?.data || resp?.user;
        if (!u || cancelled) return;
        onLogin?.(u.role || role, u);
      } catch (_) {
        authStore.clear();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setEmail(''); setPassword(''); setName(''); setPhone('');
    setConfirm(''); setErr(''); setLoading(false);
    setInviteCode('');
  };

  // ---- Login ----
  const submitLogin = async (e) => {
    e?.preventDefault?.();
    setErr('');
    if (!email.trim() || !password) {
      setErr('Email and password are required'); return;
    }
    setLoading(true);
    try {
      const resp = await authAPI.login(email.trim().toLowerCase(), password);
      const data = resp?.data || resp;
      const { token, user } = data;
      if (!token || !user) throw new Error('Invalid response from server');
      authStore.setToken(token);
      authStore.setUser(user);
      onLogin?.(user.role || role, user);
    } catch (e2) {
      setErr(e2.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ---- Signup ----
  const submitSignup = async (e) => {
    e?.preventDefault?.();
    setErr('');
    if (!name.trim()) { setErr('Full name is required'); return; }
    if (!email.includes('@')) { setErr('Enter a valid email'); return; }
    if (phone && !/^\d{10,15}$/.test(phone)) { setErr('Phone must be 10–15 digits'); return; }
    if (!password || password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setErr('Passwords do not match'); return; }
    if (role === 'teacher' && !inviteCode.trim()) { setErr('Invite code required for teacher signup'); return; }
    setLoading(true);
    try {
      const resp = await authAPI.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || undefined,
        password,
        role,
        inviteCode: inviteCode.trim() || undefined,
      });
      const data = resp?.data || resp;
      const { token, user } = data;
      if (!token || !user) throw new Error('Invalid response from server');
      authStore.setToken(token);
      authStore.setUser(user);
      addNotification?.('signup', '🎓 New Signup',
        `${user.name} signed up as ${user.role}`,
        { name: user.name, email: user.email });
      onLogin?.(user.role || role, user);
    } catch (e2) {
      setErr(e2.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ---- UI ----
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, background: C.bg,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 24 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: C.textMuted,
            cursor: 'pointer', fontSize: 13, display: 'flex',
            alignItems: 'center', gap: 6,
          }}>← Back to Home</button>
          <LangSwitcher />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18, margin: '0 auto 14px',
            background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#111',
            boxShadow: `0 8px 32px ${C.primary}55`,
          }}>SBC</div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
            Samagra Bharat Coaching
          </h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
            {mode === 'login' ? 'Login to your panel' : 'Create your account'}
          </p>
        </div>

        <Card style={{ padding: 26 }}>
          <form onSubmit={submitLogin}>
            <Input label="Email or phone" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            {err && <div style={{ color: '#F87171', marginBottom: 8 }}>{err}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => {/* TODO: forgot password */}} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer' }}>Forgot password?</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => setShowRegister(true)}>Create Account</Btn>
                <Btn type="submit" variant="primary">Log In</Btn>
              </div>
            </div>
          </form>
        </Card>

        <RegistrationWizard open={showRegister} onClose={() => setShowRegister(false)} onComplete={(user) => { onLogin?.('student', user); }} />

          {/* Admin Portal entry intentionally hidden from the visible UI.
              Admin can still reach the portal via:
                - keyboard sequence "SBCADMIN" (handled in App.jsx)
                - URL hash  #sbc-admin
              The `onAdminPortal` prop is still wired so those entry-points
              continue to work; we just don't render a button for it. */}
      </div>
    </div>
  );
};

export default LoginPage;
