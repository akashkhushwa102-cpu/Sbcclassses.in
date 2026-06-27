import React, { useState, useMemo } from 'react';
import { Modal, Btn, Input, Card } from '../Shared/SharedComponents.jsx';
import { C } from '../../constants/colors.js';
import { authAPI, auth as authStore } from '../../services/apiClient.js';

const BOARDS = [ { id: 'cbse', label: 'CBSE' }, { id: 'icse', label: 'ICSE' }, { id: 'state', label: 'State Board' } ];
const CLASSES = ['6','7','8','9','10','11','12'];
const STATES = [ 'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Jammu & Kashmir','Puducherry','Delhi','Other' ];

const StepIndicator = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
    <div style={{ fontSize: 13, color: C.textMuted }}>Step</div>
    <div style={{ fontWeight: 800, color: C.text }}>{step} of 4</div>
    <div style={{ flex: 1, height: 8, background: C.bgCard3, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${(step/4)*100}%`, height: '100%', background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, transition: 'width 300ms' }} />
    </div>
  </div>
);

export default function RegistrationWizard({ open, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [board, setBoard] = useState('');
  const [cls, setCls] = useState('');
  const [stateValue, setStateValue] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const canNext = useMemo(() => {
    if (step === 1) return !!board;
    if (step === 2) return !!cls;
    if (step === 3) return !!stateValue;
    if (step === 4) return name.trim() && email.includes('@') && phone.trim().length >= 10 && password.length >= 6 && password === confirm;
    return false;
  }, [step, board, cls, stateValue, name, email, phone, password, confirm]);

  const next = () => { if (canNext) setStep(s => Math.min(4, s+1)); };
  const prev = () => setStep(s => Math.max(1, s-1));

  const handleRegister = async () => {
    if (!canNext) return;
    setErr(''); setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'student',
        profile: { board, class: cls, state: stateValue },
      };
      const resp = await authAPI.register(payload);
      const token = resp?.token || resp?.data?.token;
      const user = resp?.user || resp?.data?.user || resp;
      if (!token || !user) {
        throw new Error(resp?.message || 'Registration failed');
      }
      authStore.setToken(token);
      authStore.setUser(user);
      onComplete?.(user);
      onClose?.();
    } catch (e) {
      setErr(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create your account">
      <div style={{ maxWidth: 640, width: '100%' }}>
        <Card style={{ padding: 18 }}>
          <StepIndicator step={step} />

          <div style={{ minHeight: 220, transition: 'all 240ms ease' }}>
            {step === 1 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>Choose Education Board</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {BOARDS.map(b => (
                    <button key={b.id} onClick={() => setBoard(b.id)} style={{ minWidth: 140, flex: '1 1 140px', padding: '18px 14px', borderRadius: 12, border: `1px solid ${board===b.id?C.primary:'transparent'}`, background: board===b.id?`${C.primary}12`:'transparent', color: board===b.id?C.primary:C.text, fontWeight: 800, cursor: 'pointer' }}>{b.label}</button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>Select Class</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {CLASSES.map(c => (
                    <button key={c} onClick={() => setCls(c)} style={{ minWidth: 92, padding: '12px 10px', borderRadius: 10, border: `1px solid ${cls===c?C.primary:'transparent'}`, background: cls===c?`${C.primary}12`:'transparent', color: cls===c?C.primary:C.text, fontWeight: 800, cursor: 'pointer' }}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>Select State</div>
                <Input label="Search / select state" value={stateValue} onChange={(e)=>setStateValue(e.target.value)} placeholder="Start typing to filter" />
                <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 8 }}>
                  {STATES.filter(s => !stateValue || s.toLowerCase().includes(stateValue.toLowerCase())).map(s => (
                    <button key={s} onClick={() => setStateValue(s)} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${stateValue===s?C.primary:'transparent'}`, background: stateValue===s?`${C.primary}10`:'transparent', color: stateValue===s?C.primary:C.text, fontWeight: 700, cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>Create Account</div>
                <Input label="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
                <Input label="Mobile number" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                <Input label="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" />
                <Input label="Create password" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" />
                <Input label="Confirm password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} type="password" />
              </div>
            )}
          </div>

          {err && <div style={{ color: '#F87171', marginTop: 8 }}>{err}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              <Btn variant="ghost" onClick={() => { if (step===1) onClose?.(); else prev(); }}>Back</Btn>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {step < 4 ? (
                <Btn variant="primary" onClick={next} disabled={!canNext}>Continue</Btn>
              ) : (
                <Btn variant="gold" onClick={handleRegister} disabled={!canNext || loading}>{loading ? 'Creating…' : 'Create Account'}</Btn>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
