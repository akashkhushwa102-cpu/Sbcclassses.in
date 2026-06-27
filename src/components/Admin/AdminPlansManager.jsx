/* ============================================================
   ADMIN PLANS MANAGER  (v1.0)
   ------------------------------------------------------------
   Proper CRUD UI for subscription plans, talking to the
   real Mongoose-backed /api/plans endpoints via planAPI.

   Replaces the old localStorage-based single-plan SubscriptionManager.
   ============================================================ */
import React, { useEffect, useState, useCallback } from 'react';
import { planAPI } from '../../services/apiClient.js';
import { DB } from '../../config/database.js';
import { SUBJECTS } from '../../constants/subjects.js';
import '../../styles/admin-plans.css';

const card = {
  background: 'white', borderRadius: 14, padding: 20,
  boxShadow: '0 6px 24px rgba(0,0,0,0.08)', marginBottom: 16,
};
const button = {
  background: '#2563eb', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: 10, fontWeight: 600,
  cursor: 'pointer', fontSize: 14,
};
const buttonOutline = {
  background: 'transparent', color: '#2563eb',
  border: '1px solid #2563eb', padding: '8px 14px',
  borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const buttonDanger = {
  background: 'transparent', color: '#dc2626',
  border: '1px solid #dc2626', padding: '8px 14px',
  borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13,
};
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: 14, marginTop: 4,
};
const labelStyle = {
  display: 'block', fontSize: 12,borderBottom: '1px solid #14181c', fontWeight: 600,
  color: '#146ae2', marginBottom: 2,
};
const badge = (bg) => ({
  background: bg, color: 'white', padding: '3px 10px',
  borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block',
});

const emptyForm = {
  name: '',
  // Access types:
  //   all_access | batch | subject | specific_batches | multi_subject | premium_only
  type: 'all_access',
  batchId: '',                   // for type='batch' (single)
  subject: '',                  // for type='subject' (single)
  batchIds: '',                 // for type='specific_batches' (comma-separated IDs)
  subjects: [],                 // for type='multi_subject' (array of names)
  grantsPremiumContent: false,  // unlocks premium-flagged content even outside batch/subject
  description: '',
  price: '',
  duration: 30,                  // days
  billingCycle: 'monthly',
  features: '',
  offerPercentage: 0,
  isActive: true,
  // Access selectors (UI: comma/newline separated)
  accessBoards: [],
  accessStates: [],
  accessClasses: [],
  accessBatchIds: [],
};

const splitList = (s) => String(s || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

const planFromForm = (f) => ({
  name: f.name.trim(),
  type: f.type,
  batchId: f.batchId || null,
  subject: (f.subject || '').trim(),
  batchIds: splitList(f.batchIds),
  subjects: Array.isArray(f.subjects) ? f.subjects : splitList(f.subjects),
  grantsPremiumContent: !!f.grantsPremiumContent,
  description: f.description || '',
  price: Number(f.price) || 0,
  duration: Math.max(1, parseInt(f.duration, 10) || 30),
  billingCycle: f.billingCycle,
  features: f.features.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
  offerPercentage: Math.max(0, Math.min(100, Number(f.offerPercentage) || 0)),
  isActive: !!f.isActive,
  accessSelectors: {
    boards: Array.isArray(f.accessBoards) ? f.accessBoards : splitList(f.accessBoards),
    states: Array.isArray(f.accessStates) ? f.accessStates : splitList(f.accessStates),
    classes: Array.isArray(f.accessClasses)
      ? f.accessClasses.map((c) => (String(c) === 'All Classes' ? 'All Classes' : Number(c))).filter(Boolean)
      : splitList(f.accessClasses).map((c) => Number(c)).filter(Boolean),
    batches: Array.isArray(f.accessBatchIds) ? f.accessBatchIds : splitList(f.accessBatchIds),
  },
});

const formFromPlan = (p) => ({
  name: p.name || '',
  type: p.type || 'all_access',
  batchId: p.batchId || '',
  subject: p.subject || '',
  batchIds: (p.batchIds || []).join(', '),
  subjects: p.subjects || [],
  grantsPremiumContent: !!p.grantsPremiumContent,
  description: p.description || '',
  price: String(p.price ?? ''),
  duration: String(p.duration ?? ''),
  billingCycle: p.billingCycle || 'custom',
  features: (p.features || []).join('\n'),
  offerPercentage: p.offerPercentage || 0,
  isActive: p.isActive !== false,
  accessBoards: p.accessSelectors?.boards || [],
  accessStates: p.accessSelectors?.states || [],
  accessClasses: p.accessSelectors?.classes || [],
  accessBatchIds: (p.accessSelectors?.batches || []).map(String),
});

export default function AdminPlansManager() {
  // Lightweight searchable multi-select used for boards/states/classes/batches
  const SearchableMultiSelect = ({ options = [], value = [], onChange, placeholder = 'Search...' , renderLabel }) => {
    const [filter, setFilter] = useState('');
    const filtered = options.filter(o => String(renderLabel ? renderLabel(o) : o).toLowerCase().includes(filter.toLowerCase()));
    const toggle = (v) => {
      const s = new Set(Array.isArray(value) ? value : []);
      if (s.has(v)) s.delete(v); else s.add(v);
      onChange(Array.from(s));
    };
    return (
      <div>
        <input style={{ ...inputStyle, marginBottom: 8 }} value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder={placeholder} />
        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
          {filtered.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, padding: 6 }}>No matches</div>}
          {filtered.map((opt) => {
            const key = opt && opt._id ? (opt._id || opt.id) : opt;
            const label = renderLabel ? renderLabel(opt) : String(opt);
            const checked = (Array.isArray(value) ? value : []).some(v => String(v) === String(key) || String(v) === String(opt));
            return (
              <label key={key || label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={checked} onChange={() => toggle(key != null ? key : opt)} />
                <span style={{ fontSize: 13 }}>{label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const StyledMultiSelect = ({ options = [], value = [], onChange, multiple = true, height, renderOptionLabel }) => {
    const vals = Array.isArray(value) ? value : [];
    const singleVal = !multiple && value != null ? String(value) : null;
    const findLabel = (v) => {
      // options may be primitives or objects with _id/id
      const found = options.find((opt) => {
        const key = (opt && (opt._id || opt.id)) ? (opt._id || opt.id) : opt;
        return String(key) === String(v);
      });
      if (found) return renderOptionLabel ? renderOptionLabel(found) : String(found);
      return renderOptionLabel ? renderOptionLabel(v) : String(v);
    };
    return (
      <div style={{ border: '1px solid #e6eef8', borderRadius: 8, padding: 8 }}>
        <select multiple={multiple} className="admin-input" style={{ ...inputStyle, border: 'none', boxShadow: 'none', height: height || 'auto' }} value={multiple ? vals : (singleVal || '')} onChange={(e) => {
          if (multiple) {
            const sel = Array.from(e.target.selectedOptions).map(o => o.value);
            onChange(sel);
          } else {
            onChange(e.target.value);
          }
        }}>
          {options.map((opt) => {
            const key = (opt && (opt._id || opt.id)) ? (opt._id || opt.id) : opt;
            return (
              <option key={key} value={key}>{renderOptionLabel ? renderOptionLabel(opt) : String(opt)}</option>
            );
          })}
        </select>
        <div className="chip-row" style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(multiple ? vals : (singleVal ? [singleVal] : [])).map((v) => (
            <span key={v} style={{ background: '#f0fdf4', color: '#065f46', padding: '6px 10px', borderRadius: 16, fontSize: 13, fontWeight: 700 }}>{findLabel(v)}</span>
          ))}
        </div>
      </div>
    );
  };

  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | plan._id
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [savedMsg, setSavedMsg] = useState(''); // success flash
  const allBatches = DB.get('batches') || [];
  const hasAnyBatches = allBatches.length > 0;

  const refresh = useCallback(async () => {
    try {
      setLoading(true); setErr('');
      const resp = await planAPI.list({ includeInactive: 1 });
      const list = resp?.data || resp || [];
      setPlans(Array.isArray(list) ? list : (list.items || []));
    } catch (e) {
      setErr(e.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startNew = () => { setForm(emptyForm); setEditing('new'); };
  const startEdit = (p) => { setForm(formFromPlan(p)); setEditing(p._id); };
  const cancel = () => { setEditing(null); setForm(emptyForm); };

  const save = async () => {
    setErr('');
    if (!form.name.trim()) { setErr('Plan name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { setErr('Price must be > 0'); return; }
    if (!form.duration || Number(form.duration) < 1) { setErr('Duration must be selected'); return; }
    if (form.type === 'batch' && !(form.batchId && String(form.batchId).trim())) { setErr('batchId is required for batch plans'); return; }
    if ((form.type === 'subject' || form.type === 'multi_subject') && (!Array.isArray(form.subjects) || form.subjects.length === 0)) { setErr('At least one subject is required for subject plans'); return; }
    if (form.type === 'specific_batches' && splitList(form.batchIds).length === 0) { setErr('At least one batch ID is required for specific_batches plans'); return; }
    try {
      setSaving(true);
      const payload = planFromForm(form);
      // If admin picked subjects via the multi-select but chose single-subject access,
      // ensure the payload.subject is populated from subjects[0].
      if (form.type === 'subject' && (!payload.subject || payload.subject === '') && Array.isArray(payload.subjects) && payload.subjects.length > 0) {
        payload.subject = payload.subjects[0];
      }
      if (editing === 'new') {
        await planAPI.create(payload);
        setSavedMsg('Plan created. Students will see it within 20 seconds.');
      } else {
        await planAPI.update(editing, payload);
        setSavedMsg('Plan updated. Students will see the change within 20 seconds.');
      }
      await refresh();
      cancel();
      setTimeout(() => setSavedMsg(''), 5000);
    } catch (e) {
      // Surface full backend error including Joi validation details if any.
      const detail = e.details ? ` (${JSON.stringify(e.details)})` : '';
      setErr((e.message || 'Save failed') + detail);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      setSaving(true);
      await planAPI.remove(id);
      setConfirmDel(null);
      await refresh();
    } catch (e) {
      setErr(e.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Subscription Plans</h2>
          <p style={{ color: '#0a66e7', margin: '4px 0 0', fontSize: 13 }}>
            Create / edit / delete plans. Stored in MongoDB. Students see them in real time.
          </p>
        </div>
        {editing === null && (
          <button style={button} onClick={startNew}>+ New Plan</button>
        )}
      </div>

      {err && (
        <div style={{ background: '#564ada', color: '#991b1b', padding: 12, borderRadius: 10, marginBottom: 12 }}>
          {err}
        </div>
      )}
      {savedMsg && (
        <div style={{ background: '#38b865', color: '#15803d', padding: 12, borderRadius: 10, marginBottom: 12, fontWeight: 600 }}>
          ✓ {savedMsg}
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {editing !== null && (
        <div className="admin-plan-card" style={{ ...card, border: '2px solid #2563eb' }}>
          <h3 style={{ margin: '0 0 12px' }}>{editing === 'new' ? 'Create New Plan' : 'Edit Plan'}</h3>
          {editing === 'new' && (
            <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>Create a subscription plan. Students will see applicable plans in real time.</p>
          )}
          <div className="ap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: 6 }}>
              <h4 style={{ margin: '0 0 8px', color: '#0a66e7' }}>Basic Information</h4>
            </div>
            <div>
              <label style={labelStyle}>Plan Name *</label>
              <input className="admin-input" style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Class 6 Premium Plan" />
            </div>
            <div className="box1" style={{ gridColumn: '1 / -1', marginBottom: 6, marginTop: 12 }}>
              <h4 style={{ margin: '0 0 8px', color: '#0a66e7' }}>Access Configuration</h4>
            </div>
            <div>
              <label style={labelStyle}>Access Type *</label>
              <select className="admin-input" style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="all_access">All Access (every subject + every batch + premium)</option>
                <option value="batch">Single Batch</option>
                <option value="specific_batches">Multiple Selected Batches</option>
                <option value="subject">Single Subject</option>
                <option value="multi_subject">Multiple Subjects</option>
                <option value="premium_only">Premium Content Only (no batch/subject)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Select Subjects</label>
              <StyledMultiSelect
                options={SUBJECTS}
                value={form.subjects || []}
                onChange={(vals) => setForm({ ...form, subjects: vals })}
                multiple={true}
              />
            </div>
            {form.type === 'batch' && (
              <div>
                <label style={labelStyle}>Batch ID *</label>
                <input className="admin-input" style={inputStyle} value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} placeholder="MongoDB ObjectId of the batch" />
              </div>
            )}
            {form.type === 'specific_batches' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Batch IDs * (comma-separated)</label>
                <input className="admin-input" style={inputStyle} value={form.batchIds} onChange={(e) => setForm({ ...form, batchIds: e.target.value })} placeholder="batch_id_1, batch_id_2, batch_id_3" />
                <div style={{ marginTop: 8, color: '#94a3b8' }}>Tip: Use the batch IDs from the Batches page. Separate multiple IDs with commas.</div>
              </div>
            )}
            {form.type === 'subject' && (
              <div>
                <label style={labelStyle}>Subject *</label>
                <StyledMultiSelect
                  options={SUBJECTS}
                  value={form.subject || ''}
                  onChange={(val) => setForm({ ...form, subject: val })}
                  multiple={false}
                />
              </div>
            )}
            {form.type === 'multi_subject' && (
                <div>
                <label style={labelStyle}>Subjects *</label>
                <select multiple className="admin-input" style={{ ...inputStyle, height: 120 }} value={form.subjects} onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions).map(o => o.value);
                  setForm({ ...form, subjects: vals });
                }}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>Grants Premium Content?</label>
              <select className="admin-input" style={inputStyle} value={form.grantsPremiumContent ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, grantsPremiumContent: e.target.value === 'yes' })}>
                <option value="no">No</option>
                <option value="yes">Yes (Unlocks premium content)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Access Level</label>
              {(() => {
                const boards = Array.from(new Set((DB.get('batches') || []).map(b => b.board).filter(Boolean))).sort();
                return (
                  <select className="admin-input" style={inputStyle} value={form.accessLevel || 'all'} onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}>
                    <option value="all">All Boards</option>
                    {boards.length > 0 && <option value="specific">Specific Boards</option>}
                  </select>
                );
              })()}
            </div>
            {/* CLASS ACCESS */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '6px 0 8px' }}>Class Access</h4>
              <div>
                <label style={labelStyle}>Select Class</label>
                <StyledMultiSelect
                  options={[6,7,8,9,10,11,12].map(n => String(n))}
                  value={form.accessClasses}
                  onChange={(vals) => setForm({ ...form, accessClasses: vals })}
                  renderOptionLabel={(v) => `Class ${v}`}
                />
              </div>
            </div>

            {/* BATCH ACCESS */}
            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <label style={labelStyle}>Select Batch</label>
              {(() => {
                const allBatches = DB.get('batches') || [];
                const selectedClasses = (form.accessClasses || []).map(String);
                const filtered = allBatches.filter((b) => selectedClasses.length === 0 || selectedClasses.includes(String(b.classLevel || b.class)));
                if (allBatches.length === 0) {
                  return (
                    <div style={{ padding: 12, border: '1px dashed #e2e8f0', borderRadius: 8 }}>
                      <div style={{ color: '#64748b', marginBottom: 8 }}>No batches available.</div>
                      <div style={{ color: '#94a3b8', marginBottom: 10 }}>Please create a batch first.</div>
                      <button style={button} onClick={() => { window.location.href = '/admin/batches'; }}>+ Create Batch</button>
                    </div>
                  );
                }
                return (
                  <div>
                    <StyledMultiSelect
                      options={filtered}
                      value={form.accessBatchIds}
                      onChange={(vals) => setForm({ ...form, accessBatchIds: vals })}
                      renderOptionLabel={(b) => `${b.name || 'Untitled'}${b.classLevel || b.class ? ` — Class ${b.classLevel || b.class}` : ''}`}
                      height={160}
                    />
                    {filtered.length === 0 && (
                      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>No batches match the selected classes.</div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label style={labelStyle}>Price (Rs.) *</label>
              <input className="admin-input" type="number" style={inputStyle} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Enter Price" />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select className="admin-input" style={inputStyle} value={String(form.duration || '')} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}>
                <option value="">Select duration</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="365">365 Days</option>
              </select>
            </div>
            
            <div>
              <label style={labelStyle}>Billing Cycle</label>
              <select className="admin-input" style={inputStyle} value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half-Yearly</option>
                <option value="annual">Yearly</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Offer Discount (%)</label>
              <input className="admin-input" type="number" min="0" max="100" style={inputStyle}
                value={form.offerPercentage}
                onChange={(e) => setForm({ ...form, offerPercentage: e.target.value })}
                placeholder="0 (no offer)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={labelStyle}>Active</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ display: 'none' }} />
                <div role="switch" aria-checked={!!form.isActive} style={{ width: 44, height: 24, background: form.isActive ? '#2563eb' : '#e6eef8', borderRadius: 16, position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: form.isActive ? 22 : 4, transition: 'left 0.15s' }} />
                </div>
                <span style={{ marginLeft: 8, color: '#64748b', fontSize: 13 }}>{form.isActive ? 'Active (Visible to students)' : 'Inactive'}</span>
              </label>
            </div>
          </div>
          {/* Removed Description and Features fields to simplify the New Plan form */}
          {/* Plan Preview */}
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...card, background: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 8px' }}>{form.name || 'Plan Preview'}</h4>
                <div style={{ color: '#3f76c4', marginBottom: 8, fontSize: 13 }}>{(form.accessClasses || []).map(c => `Class ${c}`).join(', ') || 'All Classes'}</div>
                <ul style={{ margin: '6px 0 8px', color: '#110ed7' }}>
                  <li>Access to Selected Batches</li>
                  {form.grantsPremiumContent && <li>Premium Video Content</li>}
                  <li>Practice Tests</li> 
                </ul>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  ₹{Number(form.price || 0).toLocaleString('en-IN')} / {
                    (form.billingCycle === 'monthly' && 'Month') ||
                    (form.billingCycle === 'quarterly' && 'Quarter') ||
                    (form.billingCycle === 'annual' && 'Year') ||
                    (form.billingCycle === 'half_yearly' && '6 Months') || 'Period'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
            <button style={{ ...button, padding: '12px 20px', display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={save} disabled={saving || !hasAnyBatches}>
              {saving ? 'Saving...' : (editing === 'new' ? '➕ Create Plan' : 'Save Changes')}
            </button>
            <button style={buttonOutline} onClick={cancel} disabled={saving}>Cancel</button>
          </div>

          <div style={{ marginTop: 12, padding: 12, background: '#f1f5f9', borderRadius: 8, color: '#475569', fontSize: 13 }}>
            Selected classes and batches define who can access this plan.
          </div>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div style={card}>Loading plans...</div>
      ) : plans.length === 0 ? (
        <div style={{ ...card, color: '#64748b', textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>No plans yet</div>
          <div style={{ fontSize: 14 }}>Click "+ New Plan" above to create your first subscription plan.</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            Tip: run <code>npm run seed</code> in backend to bootstrap 2 example plans.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {plans.map((p) => (
            <div key={p._id} style={{ ...card, border: p.isActive ? '1px solid #16a34a55' : '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{p.name}</h3>
                  <span style={badge(
                    p.type === 'all_access'       ? '#2563eb' :
                    p.type === 'premium_only'     ? '#dc2626' :
                    p.type === 'subject'          ? '#7c3aed' :
                    p.type === 'multi_subject'    ? '#9333ea' :
                    p.type === 'specific_batches' ? '#0891b2' :
                                                    '#0e7490'
                  )}>
                    {p.type === 'all_access'       ? 'ALL ACCESS' :
                     p.type === 'premium_only'    ? 'PREMIUM' :
                     p.type === 'subject'          ? `SUBJECT: ${(p.subject || '').toUpperCase()}` :
                     p.type === 'multi_subject'    ? `SUBJECTS (${(p.subjects || []).length})` :
                     p.type === 'specific_batches' ? `BATCHES (${(p.batchIds || []).length})` :
                                                     'SINGLE BATCH'}
                  </span>
                  {!p.isActive && <span style={{ ...badge('#64748b'), marginLeft: 6 }}>INACTIVE</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.offerPercentage > 0 ? (
                    <>
                      <div style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>Rs.{Number(p.price).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                        Rs.{Number(Math.round(p.price * (100 - p.offerPercentage) / 100)).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>{p.offerPercentage}% OFF</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Rs.{Number(p.price).toLocaleString('en-IN')}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#64748b' }}>{p.duration} days · {p.billingCycle}</div>
                </div>
              </div>
              {p.description && (
                <p style={{ color: '#475569', fontSize: 13, margin: '10px 0 6px' }}>{p.description}</p>
              )}
              {p.features?.length > 0 && (
                <ul style={{ paddingLeft: 18, color: '#334155', fontSize: 13, margin: '6px 0 0' }}>
                  {p.features.slice(0, 5).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={buttonOutline} onClick={() => startEdit(p)}>Edit</button>
                {confirmDel === p._id ? (
                  <>
                    <button style={buttonDanger} onClick={() => remove(p._id)} disabled={saving}>
                      {saving ? '...' : 'Confirm Delete'}
                    </button>
                    <button style={buttonOutline} onClick={() => setConfirmDel(null)}>Cancel</button>
                  </>
                ) : (
                  <button style={buttonDanger} onClick={() => setConfirmDel(p._id)}>Delete</button>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>ID: {p._id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
