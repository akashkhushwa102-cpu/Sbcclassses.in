import { useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB } from "../../../config/database.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input } from "../../Shared/SharedComponents.jsx";


export const FeaturesManager = () => {
  const [features, setFeatures] = useState(() => DB.get("landingFeatures") || 
    [
      { id: 1, icon: "📱", title: "Live Classes", desc: "Interactive online classes" },
      { id: 2, icon: "📊", title: "Progress Tracking", desc: "Monitor student performance" },
      { id: 3, icon: "🎯", title: "Personalized Learning", desc: "Custom study paths" }
    ]
  );
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ icon: "⭐", title: "", desc: "" });

  const save = () => {
    if (!form.title || !form.desc) { toast("Title and Description required!", "error"); return; }
    let updated;
    if (editItem) {
      updated = features.map(f => f.id === editItem.id ? { ...f, ...form } : f);
    } else {
      updated = [...features, { ...form, id: Date.now() }];
    }
    setFeatures(updated); DB.set("landingFeatures", updated); resetForm();
  };

  const resetForm = () => {
    setForm({ icon: "⭐", title: "", desc: "" }); setEditItem(null); setShowForm(false);
  };

  const edit = (f) => {
    setEditItem(f); setForm(f); setShowForm(true);
  };

  const del = (id) => {
    const u = features.filter(f => f.id !== id); setFeatures(u); DB.set("landingFeatures", u);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>✨ Landing Page Features</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Customize app features shown on landing</p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ Add Feature</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>{editItem ? "✏️ Edit Feature" : "➕ Add New Feature"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>EMOJI</label>
              <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div>
              <Input label="FEATURE TITLE" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Live Classes" />
            </div>
          </div>
          <Input label="SHORT DESCRIPTION" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="e.g., Interactive online classes" />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update" : "✅ Add Feature"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {features.map(f => (
          <Card key={f.id} style={{ textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ color: C.text, margin: 0, fontSize: 15, fontWeight: 800 }}>{f.title}</h3>
            <p style={{ color: C.textMuted, fontSize: 12, margin: "8px 0 0", lineHeight: 1.4 }}>{f.desc}</p>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <Btn variant="ghost" size="sm" onClick={() => edit(f)}>✏️</Btn>
              <Btn variant="danger" size="sm" onClick={() => del(f.id)}>🗑️</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
