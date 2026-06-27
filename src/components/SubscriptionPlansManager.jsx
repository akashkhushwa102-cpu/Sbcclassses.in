import React, { useEffect, useState } from 'react';
import { planAPI } from '../services/apiClient.js';
import { DB } from '../config/database.js';
import { SUBJECTS } from '../constants/subjects.js';
import '../styles/subscription-plans.css';

export const SubscriptionPlansManager = ({ C, RES, Btn, Card, Badge, Modal, useScreenSize }) => {
  // Lightweight searchable multi-select (copied from Admin manager)
  const SearchableMultiSelect = ({ options = [], value = [], onChange, placeholder = 'Search...', renderLabel }) => {
    const [filter, setFilter] = useState('');
    const filtered = options.filter(o => String(renderLabel ? renderLabel(o) : o).toLowerCase().includes(filter.toLowerCase()));
    const toggle = (v) => {
      const s = new Set(Array.isArray(value) ? value : []);
      if (s.has(v)) s.delete(v); else s.add(v);
      onChange(Array.from(s));
    };
    const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 8 };
    return (
      <div>
        <input style={inputStyle} value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder={placeholder} />
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

  const allBatches = DB.get('batches') || [];
  const classOptions = [6,7,8,9,10,11,12];
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const { isMobile } = useScreenSize();

  const initialForm = {
    planType: '', accessType: '', grantsPremium: 'no', accessLevel: '', displayName: '', description: '', priceInPaise: '', durationDays: '',
    states: [], classes: [], batches: [], billingCycle: 'monthly', offerPercentage: 0,
    displayOrder: 999, features: [], featuresText: '', isActive: true,
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { loadPlans(); }, []);

  const pickArray = (resp) => (Array.isArray(resp) ? resp : Array.isArray(resp?.plans) ? resp.plans : Array.isArray(resp?.data) ? resp.data : []);

  async function loadPlans() {
    try {
      setLoading(true);
      const resp = await planAPI.list({ includeInactive: 1 });
      setPlans(pickArray(resp));
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load subscription plans');
    } finally { setLoading(false); }
  }

  const applyFeaturesText = (text) => (String(text || '').split('\n').map(s => s.trim()).filter(Boolean));

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'featuresText') {
      const arr = applyFeaturesText(value);
      setFormData(prev => ({ ...prev, features: arr, featuresText: value }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const createPayloadFromForm = (fd) => ({
    name: fd.displayName,
    type: fd.accessType || fd.planType || 'all_access',
    description: fd.description || '',
    price: Number(fd.priceInPaise || 0) / 100,
    duration: parseInt(fd.durationDays || 0, 10),
    features: fd.features || applyFeaturesText(fd.featuresText),
    billingCycle: fd.billingCycle || 'monthly',
    offerPercentage: Number(fd.offerPercentage) || 0,
    isActive: !!fd.isActive,
    accessSelectors: {
      states: Array.isArray(fd.states) ? fd.states : (fd.states ? [fd.states] : []),
      classes: Array.isArray(fd.classes) ? fd.classes : (String(fd.classes || '').split(/[\n,]/).map(s=>s.trim()).filter(Boolean)),
      batches: Array.isArray(fd.batches) ? fd.batches : (String(fd.batches || '').split(/[\n,]/).map(s=>s.trim()).filter(Boolean)),
    },
  });

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      if (!formData.planType || !formData.displayName || !formData.priceInPaise || !formData.durationDays) {
        setError('Please fill all required fields');
        return;
      }
      const payload = createPayloadFromForm(formData);
      await planAPI.create(payload);
      setSuccess('✅ Plan created successfully');
      setShowAddModal(false);
      setFormData(initialForm);
      try { window.dispatchEvent(new CustomEvent('sbc:plans-updated', { detail: { source: 'admin-create' } })); } catch (_) {}
      loadPlans();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      console.error(err);
      setError('Error creating plan: ' + (err.message || ''));
    }
  };

  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planType: plan.type || '', accessType: plan.type || '', grantsPremium: plan.grantsPremiumContent ? 'yes' : 'no', accessLevel: '',
      displayName: plan.name || '', description: plan.description || '',
      priceInPaise: plan.price ? Math.round(Number(plan.price) * 100) : '', durationDays: plan.duration || '',
      billingCycle: plan.billingCycle || 'monthly', offerPercentage: plan.offerPercentage || 0,
      displayOrder: plan.displayOrder || 999, features: plan.features || [], featuresText: (plan.features || []).join('\n'), isActive: !!plan.isActive,
      states: plan.accessSelectors?.states || [], classes: plan.accessSelectors?.classes || [], batches: plan.accessSelectors?.batches || (plan.batchIds || []),
    });
    setShowEditModal(true);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = createPayloadFromForm(formData);
      const id = editingPlan._id || editingPlan.id;
      await planAPI.update(id, payload);
      setSuccess('✅ Plan updated successfully');
      setShowEditModal(false);
      setEditingPlan(null);
      try { window.dispatchEvent(new CustomEvent('sbc:plans-updated', { detail: { source: 'admin-update' } })); } catch (_) {}
      loadPlans();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      console.error(err);
      setError('Error updating plan: ' + (err.message || ''));
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await planAPI.remove(planId);
      setSuccess('✅ Plan deleted successfully');
      try { window.dispatchEvent(new CustomEvent('sbc:plans-updated', { detail: { source: 'admin-delete' } })); } catch (_) {}
      loadPlans();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Error deleting plan: ' + (err.message || ''));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingXl }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: RES.spacingMd }}>
        <h2 style={{ color: C.text, margin: 0, fontSize: RES.fontXl }}>📋 Subscription Plans Management</h2>
        <Btn onClick={() => { setShowAddModal(true); setFormData(initialForm); setEditingPlan(null); }} variant="primary">➕ Add New Plan</Btn>
      </div>

      {error && (
        <Card style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: RES.spacingMd }}>
            <span style={{ fontSize: 20 }}>❌</span>
            <p style={{ color: '#B91C1C', fontWeight: 700, margin: 0 }}>{error}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card style={{ background: '#ECFDF5', border: '1px solid #34D399' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: RES.spacingMd }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <p style={{ color: '#065F46', fontWeight: 700, margin: 0 }}>{success}</p>
          </div>
        </Card>
      )}

      <Card>
        <h3 style={{ color: C.text, fontSize: RES.fontLg, margin: '0 0 16px', fontWeight: 700 }}>Available Plans ({plans.filter(p => p.isActive).length})</h3>

        {loading ? (
          <p style={{ color: C.textMuted, textAlign: 'center' }}>Loading plans...</p>
        ) : plans.length === 0 ? (
          <p style={{ color: C.textMuted, textAlign: 'center', padding: RES.spacingXl }}>No plans created yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: RES.spacingMd }}>
            {plans.map((plan) => (
              <div key={plan._id || plan.id} style={{ border: `2px solid ${plan.isActive ? C.border : '#EF4444'}`, borderRadius: 12, padding: RES.spacingLg, background: plan.isActive ? C.bgCard2 : '#FFFBF0', display: 'flex', flexDirection: 'column', gap: RES.spacingMd }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ color: C.text, margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{plan.name}</h4>
                    <p style={{ color: C.textMuted, margin: 0, fontSize: 12 }}>Type: {plan.type}</p>
                  </div>
                  <Badge text={plan.isActive ? 'ACTIVE' : 'INACTIVE'} type={plan.isActive ? 'success' : 'danger'} />
                </div>

                <div style={{ fontSize: 24, fontWeight: 900, color: C.primary }}>₹{(Number(plan.price) || 0).toLocaleString('en-IN')}</div>

                <div style={{ color: C.textMuted, fontSize: 12 }}>
                  <p style={{ margin: '2px 0' }}>📅 Duration: {plan.duration} days</p>
                  {plan.description && <p style={{ margin: '2px 0' }}>{plan.description}</p>}
                </div>

                <div style={{ display: 'flex', gap: RES.spacingMd }}>
                  <Btn onClick={() => handleEditClick(plan)} variant="ghost" size="sm" style={{ flex: 1 }}>✏️ Edit</Btn>
                  <Btn onClick={() => handleDeletePlan(plan._id || plan.id)} variant="ghost" size="sm" style={{ flex: 1, color: '#EF4444' }}>🗑️ Delete</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Plan Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={"➕ Add New Subscription Plan"}>
        <form className="sbcp-form" onSubmit={handleAddPlan} style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingMd }}>
          <div className="sbcp-section">
            <h3>Basic Information</h3>
            <p className="sub">Create a subscription plan. Students will see applicable plans in real time.</p>
            <div className="sbcp-row">
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Plan Name *</label>
                <input className="sbcp-input" type="text" name="displayName" value={formData.displayName} onChange={handleFormChange} placeholder="e.g. All Access — Monthly" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Access Type *</label>
                <select className="sbcp-select" name="accessType" value={formData.accessType} onChange={handleFormChange}>
                  <option value="all_access">All Access</option>
                  <option value="subject">Subject</option>
                  <option value="batch">Batch</option>
                  <option value="specific_batches">Specific Batches</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Grants Premium Content? *</label>
                <select className="sbcp-select" name="grantsPremium" value={formData.grantsPremium} onChange={handleFormChange}>
                  <option value="no">No</option>
                  <option value="yes">Yes (Unlocks premium content)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Access Level</label>
                <select className="sbcp-select" name="accessLevel" value={formData.accessLevel} onChange={handleFormChange}>
                  <option value="all">All Boards</option>
                  <option value="state">State Board</option>
                  <option value="specific">Specific</option>
                </select>
              </div>
            </div>
          </div>

          <div className="sbcp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: RES.spacingMd }}>
            <div>
              <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Price (₹) *</label>
              <input type="number" name="priceInPaise" value={formData.priceInPaise} onChange={(e) => setFormData(p => ({ ...p, priceInPaise: e.target.value }))} placeholder="0" step="100" style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2 }} />
              <p style={{ fontSize: 12, color: C.textMuted, margin: '4px 0 0' }}>₹{formData.priceInPaise ? (formData.priceInPaise / 100).toLocaleString('en-IN') : '0'}</p>
            </div>

            <div>
              <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Duration (Days) *</label>
              <input type="number" name="durationDays" value={formData.durationDays} onChange={handleFormChange} placeholder="30" min="1" style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2 }} />
            </div>
          </div>

          <div className="sbcp-section" style={{ marginTop: 12 }}>
            <h3>Access & Eligibility</h3>
            <p className="sub">Select states, classes or specific batches that can access this plan.</p>
            <div className="sbcp-row">
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>States</label>
                <select className="sbcp-select" name="states" value={formData.states} onChange={handleFormChange}>
                  <option value="">Select States</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Classes (Select Multiple)</label>
                <SearchableMultiSelect
                  options={classOptions}
                  value={formData.classes}
                  onChange={(v)=>setFormData(p=>({...p, classes: v}))}
                  placeholder="Filter classes..."
                  renderLabel={(c)=>`Class ${c}`}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Specific Batches (Optional)</label>
                <SearchableMultiSelect
                  options={allBatches}
                  value={formData.batches}
                  onChange={(v)=>setFormData(p=>({...p, batches: v}))}
                  placeholder="Filter batches..."
                  renderLabel={(b)=>b?.name || b?.title || String(b)}
                />
              </div>
              <div></div>
            </div>
          </div>
            <div>
              <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Features (one per line)</label>
              <textarea name="featuresText" value={formData.featuresText} onChange={handleFormChange} placeholder="Feature 1\nFeature 2\nFeature 3" rows={5} style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2, fontFamily: 'inherit' }} />
              <div className="sbcp-help" style={{ marginTop: 6 }}>These features appear on the student-facing plan card.</div>
            </div>

            <div className="sbcp-preview">
              <div className="sbcp-modal-title">Preview</div>
              <h4>{formData.displayName || 'Plan name'}</h4>
              <div className="meta">{formData.planType || 'Plan type'} • {formData.durationDays || '0'} days</div>
              <div className="price">₹{formData.priceInPaise ? (Number(formData.priceInPaise) / 100).toLocaleString('en-IN') : '0'}</div>
              {(formData.classes && formData.classes.length > 0) && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>Classes: {String((formData.classes || []).join(', '))}</div>}
              {(formData.batches && formData.batches.length > 0) && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>Batches: {formData.batches.map(b=> b?.name || b).join(', ')}</div>}
              {formData.features && formData.features.length > 0 ? (
                <ul>{formData.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
              ) : (
                <div className="sbcp-help">No features added yet.</div>
              )}
            </div>
          </div>

          <div className="sbcp-section" style={{ marginTop: 12 }}>
            <h3>Plan Details</h3>
            <div className="sbcp-row">
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Duration (Days) *</label>
                <input className="sbcp-input" type="number" name="durationDays" value={formData.durationDays} onChange={handleFormChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Billing Cycle *</label>
                <select className="sbcp-select" name="billingCycle" value={formData.billingCycle} onChange={handleFormChange}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Price (₹) *</label>
                <input className="sbcp-input" type="number" name="priceInPaise" value={formData.priceInPaise} onChange={(e) => setFormData(p => ({ ...p, priceInPaise: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Offer Discount (%)</label>
                <input className="sbcp-input" type="number" name="offerPercentage" value={formData.offerPercentage} onChange={handleFormChange} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div className="sbcp-toggle">
                <label style={{ fontWeight: 700 }}>Active</label>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleFormChange} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Btn type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Btn>
                <Btn type="submit" variant="primary">Create Plan</Btn>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title={"✏️ Edit Subscription Plan"}>
        <form className="sbcp-form" onSubmit={handleUpdatePlan} style={{ display: 'flex', flexDirection: 'column', gap: RES.spacingMd }}>
          <div>
            <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Display Name</label>
            <input type="text" name="displayName" value={formData.displayName} onChange={handleFormChange} style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2 }} />
          </div>

          <div>
            <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleFormChange} rows={2} style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2, fontFamily: 'inherit' }} />
          </div>

          <div className="sbcp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: RES.spacingMd }}>
            <div>
              <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Price (₹)</label>
              <input type="number" name="priceInPaise" value={formData.priceInPaise} onChange={(e) => setFormData(p => ({ ...p, priceInPaise: e.target.value }))} step="100" style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2 }} />
            </div>
            <div>
              <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Duration (Days)</label>
              <input type="number" name="durationDays" value={formData.durationDays} onChange={handleFormChange} min="1" style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2 }} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', color: C.text, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Features (one per line)</label>
            <textarea name="featuresText" value={formData.featuresText} onChange={handleFormChange} rows={4} style={{ width: '100%', padding: RES.spacingMd, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bgCard2, fontFamily: 'inherit' }} />
          </div>

          <div className="sbcp-section" style={{ marginTop: 12 }}>
            <h4 style={{ margin: '0 0 8px' }}>Access & Eligibility</h4>
            <div className="sbcp-row">
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Classes</label>
                <SearchableMultiSelect options={classOptions} value={formData.classes} onChange={(v)=>setFormData(p=>({...p, classes: v}))} renderLabel={(c)=>`Class ${c}`} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Batches</label>
                <SearchableMultiSelect options={allBatches} value={formData.batches} onChange={(v)=>setFormData(p=>({...p, batches: v}))} renderLabel={(b)=>b?.name || b?.title || String(b)} />
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: RES.spacingMd, cursor: 'pointer', marginTop: RES.spacingMd }}>
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleFormChange} style={{ cursor: 'pointer' }} />
            <span style={{ color: C.text, fontWeight: 600 }}>Active</span>
          </label>

          <div className="sbcp-actions" style={{ display: 'flex', gap: RES.spacingMd, marginTop: RES.spacingMd }}>
            <Btn type="submit" variant="primary" style={{ flex: 1 }}>💾 Update Plan</Btn>
            <Btn type="button" variant="ghost" onClick={() => setShowEditModal(false)} style={{ flex: 1 }}>❌ Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
};
