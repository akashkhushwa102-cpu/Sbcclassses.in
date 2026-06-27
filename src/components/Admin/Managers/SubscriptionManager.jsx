/* ============================================================
   ADMIN — SUBSCRIPTION PLANS MANAGER
   ------------------------------------------------------------
   Creates Plan documents in the backend (type = 'all_access' or
   'batch'). The student Subscription page reads these from the
   API and shows All-Access plans in the highlighted section.
   ============================================================ */
import { useEffect, useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB, sync } from "../../../config/database.js";
import { planAPI } from "../../../services/apiClient.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input } from "../../Shared/SharedComponents.jsx";

const BLANK = {
  name: "",
  type: "all_access",
  durationMonths: 1,
  durationDays: 30,
  price: 0,
  billingCycle: "monthly",
  features: "",
  color: "#3B82F6",
  isActive: true,
};

const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const billingOptions = [
  { value: "monthly",   label: "Monthly",   days: 30  },
  { value: "quarterly", label: "Quarterly", days: 90  },
  { value: "annual",    label: "Annual",    days: 365 },
  { value: "lifetime",  label: "Lifetime",  days: 36500 },
  { value: "custom",    label: "Custom",    days: 30  },
];

export const SubscriptionManager = () => {
  const [plans, setPlans] = useState(() => DB.get("subscriptionPlans") || []);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    (async () => {
      const list = await sync.plans();
      if (Array.isArray(list)) setPlans(list);
    })();
  }, []);

  const setBilling = (cycle) => {
    const opt = billingOptions.find((o) => o.value === cycle);
    setForm((f) => ({
      ...f,
      billingCycle: cycle,
      durationDays: cycle === "custom" ? f.durationDays : opt?.days || f.durationDays,
    }));
  };

  const save = async () => {
    if (!form.name.trim()) { toast("Plan name required", "error"); return; }
    if (!form.price || form.price <= 0) { toast("Price must be > 0", "error"); return; }
    if (!form.durationDays || form.durationDays < 1) { toast("Duration must be ≥ 1 day", "error"); return; }

    const features = (form.features || "")
      .split(",").map((f) => f.trim()).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      price: Number(form.price),
      duration: Number(form.durationDays),
      billingCycle: form.billingCycle,
      features,
      isActive: form.isActive !== false,
      sortOrder: form.sortOrder || 0,
      metadata: { color: form.color },
    };

    try {
      if (editItem && editItem._id) {
        const resp = await planAPI.update(editItem._id, payload);
        const saved = resp?.data || resp;
        const u = plans.map((p) => (p._id === editItem._id ? saved : p));
        setPlans(u); DB.set("subscriptionPlans", u);
        toast("Plan updated", "success");
      } else {
        const resp = await planAPI.create(payload);
        const saved = resp?.data || resp;
        const u = [...plans, saved];
        setPlans(u); DB.set("subscriptionPlans", u);
        toast("Plan created", "success");
      }
      resetForm();
    } catch (err) {
      toast(`Save failed: ${err.message}`, "error");
    }
  };

  const resetForm = () => { setForm(BLANK); setEditItem(null); setShowForm(false); };

  const edit = (p) => {
    setEditItem(p);
    setForm({
      ...BLANK,
      ...p,
      durationDays: p.duration || 30,
      features: Array.isArray(p.features) ? p.features.join(", ") : (p.features || ""),
      color: p.metadata?.color || "#3B82F6",
    });
    setShowForm(true);
  };

  const del = async (p) => {
    if (!window.confirm(`Delete plan "${p.name}"?`)) return;
    try {
      if (p._id) await planAPI.remove(p._id);
      const u = plans.filter((x) => (x._id || x.id) !== (p._id || p.id));
      setPlans(u); DB.set("subscriptionPlans", u);
      toast("Plan deleted", "success");
    } catch (err) {
      toast(`Delete failed: ${err.message}`, "error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>💳 Subscription Plans</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>
            Manage All-Access &amp; per-batch subscription tiers.
          </p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ New Plan</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>
            {editItem ? "✏️ Edit Plan" : "➕ New Plan"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="PLAN NAME *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., All-Access Monthly" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>
                PLAN TYPE *
              </label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8,
                  background: C.bgCard2, color: C.text }}>
                <option value="all_access">🔥 All Access (every batch)</option>
                <option value="batch">📚 Batch (single batch)</option>
              </select>
            </div>

            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>
                BILLING CYCLE
              </label>
              <select value={form.billingCycle} onChange={(e) => setBilling(e.target.value)}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8,
                  background: C.bgCard2, color: C.text }}>
                {billingOptions.map((o) =>
                  <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Input label="DURATION (DAYS) *" type="number" value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value || "0", 10) })}
              placeholder="30" />

            <Input label="PRICE (₹) *" type="number" value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value || "0", 10) })}
              placeholder="999" />

            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>
                COLOR
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {colors.map((col) => (
                  <button key={col} onClick={() => setForm({ ...form, color: col })}
                    style={{
                      width: 36, height: 36, borderRadius: 6,
                      border: form.color === col ? `3px solid ${C.text}` : `2px solid ${C.border}`,
                      background: col, cursor: "pointer",
                    }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>
              FEATURES (comma-separated)
            </label>
            <textarea value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="Live classes, Recordings, Notes, Doubt sessions"
              style={{
                width: "100%", padding: 10, borderRadius: 6, border: `1px solid ${C.border}`,
                background: C.bgCard2, color: C.text, minHeight: 60, resize: "vertical",
              }} />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: C.text, fontWeight: 600 }}>
            <input type="checkbox" checked={form.isActive !== false}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (visible to students)
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update" : "✅ Create Plan"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {plans.sort((a, b) => (a.price || 0) - (b.price || 0)).map((p) => {
          const color = p.metadata?.color || p.color || "#3B82F6";
          return (
            <Card key={p._id || p.id} style={{ border: `2px solid ${color}33` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: color }} />
                <h3 style={{ color: C.text, margin: 0, fontSize: 17, fontWeight: 900, flex: 1, marginLeft: 10 }}>
                  {p.name}
                </h3>
                <span style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 99,
                  background: p.type === "all_access" ? "#2563eb22" : "#0891b222",
                  color: p.type === "all_access" ? "#2563eb" : "#0891b2",
                  fontWeight: 800,
                }}>{p.type === "all_access" ? "ALL ACCESS" : "BATCH"}</span>
              </div>

              <div style={{ fontSize: 32, fontWeight: 900, color, marginBottom: 6 }}>₹{p.price}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
                {p.duration || 30} days · {p.billingCycle || "custom"}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 16 }}>
                {(p.features || []).map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 13, color: C.text }}>
                    <span style={{ color }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="ghost" size="sm" onClick={() => edit(p)}>✏️</Btn>
                <Btn variant="danger" size="sm" onClick={() => del(p)}>🗑️</Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
