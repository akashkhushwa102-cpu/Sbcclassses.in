import { useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB } from "../../../config/database.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input } from "../../Shared/SharedComponents.jsx";


export const OffersManager = () => {
  const [offers, setOffers] = useState(() => DB.get("offers") || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", badge: "", color: "#FF6B00", validTill: "", active: true, showPopup: false, type: "discount" });

  const colors = ["#FF6B00", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

  const save = () => {
    if (!form.title) { toast("Title is required!", "error"); return; }
    const updated = form.id
      ? offers.map(o => o.id === form.id ? { ...form } : o)
      : [...offers, { ...form, id: Date.now() }];
    setOffers(updated);
    DB.set("offers", updated);
    setShowForm(false);
    setForm({ title: "", desc: "", badge: "", color: "#FF6B00", validTill: "", active: true, showPopup: false, type: "discount" });
  };

  const del = (id) => {
    const u = offers.filter(o => o.id !== id);
    setOffers(u);
    DB.set("offers", u);
  };

  const toggle = (id, field) => {
    const u = offers.map(o => o.id === id ? { ...o, [field]: !o[field] } : o);
    setOffers(u);
    DB.set("offers", u);
  };

  const edit = (offer) => { setForm({ ...offer }); setShowForm(true); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>🎁 Offers &amp; Announcements Manager</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Homepage par Banner aur Popup dono mein dikhega</p>
        </div>
        <Btn variant="primary" onClick={() => { setForm({ title: "", desc: "", badge: "", color: "#FF6B00", validTill: "", active: true, showPopup: false, type: "discount" }); setShowForm(!showForm); }}>+ New Offer</Btn>
      </div>

      {showForm && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.primary}44`, borderRadius: 18, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: C.text, margin: "0 0 20px", fontSize: 16 }}>{form.id ? "Edit Offer" : "New Offer / Announcement Create Karen"}</h3>

          {/* Live Preview */}
          <div style={{ marginBottom: 20, padding: 16, background: C.bgCard2, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>LIVE PREVIEW — Homepage par aisa dikhega:</div>
            <div style={{ borderRadius: 16, overflow: "hidden", maxWidth: 320, border: `1px solid ${form.color}44` }}>
              <div style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}BB)`, padding: "16px 20px" }}>
                {form.badge && <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, padding: "2px 12px", display: "inline-block", fontSize: 12, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{form.badge}</div>}
                <div style={{ fontWeight: 900, fontSize: 15, color: "#fff" }}>{form.title || "Offer Title"}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{form.desc || "Offer description..."}</div>
              </div>
              <div style={{ background: C.bgCard, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{form.validTill ? `Valid till: ${form.validTill}` : "No expiry"}</span>
                <span style={{ padding: "6px 14px", borderRadius: 8, background: form.color, color: "#fff", fontSize: 12, fontWeight: 700 }}>Call Now</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="OFFER TITLE *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summer Discount 20% OFF" />
            <Input label="BADGE TEXT" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="20% OFF / FREE / NEW" />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>DESCRIPTION</label>
              <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Offer ki puri jankari yahan likhein..." rows={3}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>OFFER TYPE</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none" }}>
                <option value="discount">Discount</option>
                <option value="free">Free Offer</option>
                <option value="announcement">Announcement</option>
                <option value="newbatch">New Batch</option>
                <option value="result">Result / Achievement</option>
              </select>
            </div>
            <Input label="VALID TILL (date)" value={form.validTill} onChange={e => setForm({ ...form, validTill: e.target.value })} type="date" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 10, letterSpacing: 1 }}>CARD COLOR</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {colors.map(col => (
                  <button key={col} onClick={() => setForm({ ...form, color: col })} style={{ width: 28, height: 28, borderRadius: "50%", background: col, border: form.color === col ? "3px solid white" : "2px solid transparent", cursor: "pointer", outline: form.color === col ? `2px solid ${col}` : "none" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.primary }} />
                <span style={{ color: C.text, fontSize: 14 }}>Homepage par show karen (Active)</span>
              </label>
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={form.showPopup} onChange={e => setForm({ ...form, showPopup: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.primary }} />
                <span style={{ color: C.text, fontSize: 14 }}>Popup banner dikhao</span>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{form.id ? "✅ Update" : "✅ Create Offer"}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Offers Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {offers.map(o => (
          <Card key={o.id} style={{ border:`1px solid ${o.color}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{o.title}</div>
                {o.badge && <div style={{ fontSize: 11, color: o.color, fontWeight: 700, marginTop: 3 }}>🏷️ {o.badge}</div>}
              </div>
              <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: o.active ? `${C.success}22` : `${C.danger}22`, color: o.active ? C.success : C.danger }}>
                {o.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "8px 0" }}>{o.desc || "—"}</p>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>
              {o.validTill ? `Valid till: ${o.validTill}` : "No expiry"}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" size="sm" onClick={() => edit(o)}>✏️ Edit</Btn>
              <Btn variant="danger" size="sm" onClick={() => del(o.id)}>🗑️ Delete</Btn>
            </div>
          </Card>
        ))}
      </div>

      {offers.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <p style={{ color: C.textMuted }}>No offers created yet. Start by adding your first offer!</p>
        </Card>
      )}
    </div>
  );
};
