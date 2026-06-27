import React, { useState, useEffect } from 'react';
import { signIn, signUpAndCreateProfile } from '../services/authService';
import { Input, Btn } from './Shared/SharedComponents.jsx';
import { C } from '../constants/colors.js';

const BOARDS = [
  { id: 'cbse', label: 'CBSE' },
  { id: 'icse', label: 'ICSE' },
  { id: 'state', label: 'State Board' },
];

const STATES_BY_BOARD = {
  cbse: ["Karnataka","Maharashtra","Delhi"],
  icse: ["Karnataka","Maharashtra"],
  state: ["Karnataka","Tamil Nadu","Maharashtra"],
};

const CLASSES = ['6', '7', '8', '9', '10', '11', '12'];

export default function AuthForm({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup-specific state
  const [board, setBoard] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [classValue, setClassValue] = useState('');

  // Derived lists
  const statesOptions = board ? STATES_BY_BOARD[board] || [] : [];

  useEffect(() => {
    // Clear onboarding selections when switching to login
    if (mode === 'login') {
      setBoard('');
      setStateValue('');
      setClassValue('');
    }
  }, [mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, session, error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      // Immediately redirect to dashboard / call callback
      onLoginSuccess?.(user, session);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!board || !stateValue || !classValue) {
        throw new Error('Please complete board, state and class selections');
      }
      const profile = { board, state: stateValue, class: classValue };
      const { user, session, error: signupError } = await signUpAndCreateProfile({ email, password, profile });
      if (signupError) throw signupError;
      // On successful signup create+save, redirect to dashboard
      onLoginSuccess?.(user, session);
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const selectBase = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.bgCard2,
    color: C.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <Btn
          variant={mode === 'login' ? 'ghost' : 'outline'}
          size="sm"
          onClick={() => setMode('login')}
          style={{ opacity: mode === 'login' ? 1 : 0.9 }}
        >
          Log In
        </Btn>
        <Btn
          variant={mode === 'signup' ? 'gold' : 'ghost'}
          size="sm"
          onClick={() => setMode('signup')}
        >
          Create Account
        </Btn>
      </div>

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />

        {mode === 'signup' && (
          <div style={{ border: `1px solid ${C.border}`, padding: 12, borderRadius: 8, background: C.bgCard }}>
            <h4 style={{ marginTop: 0, marginBottom: 8, color: C.text }}>Onboarding (required)</h4>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, color: C.textMuted, fontSize: 12 }}>Select Board</label>
              <select style={selectBase} value={board} onChange={(e) => setBoard(e.target.value)} required>
                <option value="">-- Choose Board --</option>
                {BOARDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, color: C.textMuted, fontSize: 12 }}>Select State</label>
              <select style={selectBase} value={stateValue} onChange={(e) => setStateValue(e.target.value)} required disabled={!board}>
                <option value="">-- Choose State --</option>
                {statesOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', marginBottom: 6, color: C.textMuted, fontSize: 12 }}>Select Class</label>
              <select style={selectBase} value={classValue} onChange={(e) => setClassValue(e.target.value)} required disabled={!stateValue}>
                <option value="">-- Choose Class --</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {error && <div style={{ color: '#F87171', marginTop: 8 }}>{error}</div>}

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn type="submit" variant="primary" size="md" style={{ minWidth: 140 }}>
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
