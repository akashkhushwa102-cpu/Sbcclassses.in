import React, { useState } from 'react';
import { Btn, Card } from '../Shared/SharedComponents.jsx';
import { C } from '../../constants/colors.js';

const BOARD_TYPES = ['CBSE', 'ICSE', 'State Board'];
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Jammu & Kashmir','Puducherry','Delhi','Other'
];
const CLASSES = ['6','7','8','9','10','11','12'];

const Onboarding = ({ role = 'student', onFinish, onCancel }) => {
  const [step, setStep] = useState(1);
  const [boardType, setBoardType] = useState('CBSE');
  const [stateSel, setStateSel] = useState(STATES[0]);
  const [cls, setCls] = useState('10');

  const goNext = () => setStep(s => Math.min(3, s + 1));
  const goPrev = () => setStep(s => Math.max(1, s - 1));

  const submit = () => {
    const payload = {
      boardType,
      state: stateSel,
      board: boardType === 'State Board' ? `State Board - ${stateSel}` : boardType,
      class: cls,
    };
    try { localStorage.setItem('sbc_onboarding', JSON.stringify(payload)); } catch (_) {}
    onFinish && onFinish(payload);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: C.bg }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ color: C.text, margin: 0, fontSize: 20, fontWeight: 900 }}>Welcome — tell us about your class</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>Cancel</button>
        </div>

        <Card style={{ padding: 20 }}>
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Choose your board type</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BOARD_TYPES.map(b => (
                  <button key={b} onClick={() => setBoardType(b)} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${b === boardType ? C.primary : 'transparent'}`, background: b === boardType ? `${C.primary}15` : 'transparent', color: b === boardType ? C.primary : C.text, fontWeight: 800, cursor: 'pointer' }}>{b}</button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              {boardType === 'CBSE' || boardType === 'ICSE' ? (
                <>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Select your state (for {boardType})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 8 }}>
                    {STATES.map(s => (
                      <button key={s} onClick={() => setStateSel(s)} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${s === stateSel ? C.primary : 'transparent'}`, background: s === stateSel ? `${C.primary}10` : 'transparent', color: s === stateSel ? C.primary : C.text, fontWeight: 700, cursor: 'pointer' }}>{s}</button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Select your State Board</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 8 }}>
                    {STATES.map(s => (
                      <button key={s} onClick={() => setStateSel(s)} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${s === stateSel ? C.primary : 'transparent'}`, background: s === stateSel ? `${C.primary}10` : 'transparent', color: s === stateSel ? C.primary : C.text, fontWeight: 700, cursor: 'pointer' }}>{s} State Board</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Select your class</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CLASSES.map(c => (
                  <button key={c} onClick={() => setCls(c)} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${c === cls ? C.primary : 'transparent'}`, background: c === cls ? `${C.primary}15` : 'transparent', color: c === cls ? C.primary : C.text, fontWeight: 700, cursor: 'pointer' }}>{c}th</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
            <Btn variant="ghost" onClick={step === 1 ? onCancel : goPrev}>{step === 1 ? 'Back' : 'Back'}</Btn>
            {step < 3 ? (
              <Btn variant="primary" onClick={goNext}>Next →</Btn>
            ) : (
              <Btn variant="primary" onClick={submit}>Proceed to Login / Signup →</Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
