import { useState, useRef } from "react";
import { C } from "../../../constants/colors.js";
import { DB } from "../../../config/database.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input } from "../../Shared/SharedComponents.jsx";


export const AlumniManager = () => {
  const [alumni, setAlumni] = useState(() => DB.get("alumni") || []);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", batch: "", percentage: "", stream: "", college: "", subject: "", initials: "", color: "#FF6B00", board: "CBSE", year: "", photo: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);
  const colors = ["#FF6B00", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Photo must be under 2MB!", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoPreview(ev.target.result); setForm(f => ({ ...f, photo: ev.target.result })); };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ name: "", batch: "", percentage: "", stream: "", college: "", subject: "", initials: "", color: "#FF6B00", board: "CBSE", year: "", photo: null });
    setPhotoPreview(null); setEditItem(null); setShowForm(false);
  };

  const save = () => {
    if (!form.name || !form.percentage) { toast("Name and Percentage are required!", "error"); return; }
    let updated;
    if (editItem) {
      updated = alumni.map(a => a.id === editItem.id ? { ...a, ...form, percentage: parseFloat(form.percentage) } : a);
    } else {
      updated = [...alumni, { ...form, id: Date.now(), percentage: parseFloat(form.percentage) }];
    }
    setAlumni(updated); DB.set("alumni", updated); resetForm();
  };

  const del = (id) => { const u = alumni.filter(a => a.id !== id); setAlumni(u); DB.set("alumni", u); };

  const edit = (a) => {
    setEditItem(a);
    setForm({ name: a.name, batch: a.batch, percentage: a.percentage, stream: a.stream, college: a.college, subject: a.subject, initials: a.initials, color: a.color, board: a.board || "CBSE", year: a.year || "", photo: a.photo || null });
    setPhotoPreview(a.photo || null);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>🏆 Toppers &amp; Alumni Manager</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>This section shows on Landing Page with photo</p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ Add Alumni</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>{editItem ? "✏️ Edit Alumni" : "➕ Add New Alumni / Topper"}</h3>

          {/* Photo Upload */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 10, letterSpacing: 1 }}>STUDENT PHOTO</label>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
                width: 90, height: 90, borderRadius: 16, overflow: "hidden", flexShrink: 0,
                background: photoPreview ? "none" : C.bgCard2,
                border: `2px dashed ${photoPreview ? C.primary : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
              }} onClick={() => fileRef.current?.click()}>
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ textAlign: "center" }}><div style={{ fontSize: 24 }}>📷</div><div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>Click to upload</div></div>
                }
              </div>
              <div>
                <Btn variant="outline" size="sm" onClick={() => fileRef.current?.click()}>📷 Upload Photo</Btn>
                {photoPreview && <Btn variant="danger" size="sm" onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo: null })); }} style={{ marginLeft: 8 }}>✕ Hatao</Btn>}
                <div style={{ color: C.textMuted, fontSize: 11, marginTop: 8 }}>JPG/PNG · Max 2MB</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="STUDENT NAME *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, initials: e.target.value.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() })} placeholder="Priya Sharma" />
            <Input label="PERCENTAGE / MARKS % *" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} placeholder="97.4" type="number" />
            <Input label="BATCH (Class 12 - 2024)" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="Class 12 - 2024" />
            <Input label="YEAR" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2024" type="number" />
            <Input label="STREAM" value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })} placeholder="Science / Commerce / Arts" />
            <Input label="COLLEGE / ACHIEVEMENT" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} placeholder="IIT Delhi / AIIMS" />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update" : "✅ Add Alumni"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Alumni Grid - sorted by percentage descending */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {alumni.sort((a, b) => b.percentage - a.percentage).map((a, i) => (
          <Card key={a.id} style={{ padding: 0, overflow: "hidden", border: `1px solid ${i < 3 ? C.gold + "44" : C.border}` }}>
            <div style={{ height: 100, background: `linear-gradient(135deg, ${a.color}33, ${a.color}11)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {a.photo ? <img src={a.photo} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg, ${a.color}, ${a.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff" }}>{a.initials}</div>
              )}
              {i < 3 && <div style={{ position: "absolute", top: 8, left: 8, background: `linear-gradient(135deg, ${C.gold}, ${C.gold}BB)`, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#111" }}>#{i+1}</div>}
              <div style={{ position: "absolute", bottom: 8, right: 8, background: `${a.color}EE`, borderRadius: 99, padding: "3px 10px", fontSize: 14, fontWeight: 900, color: "#fff" }}>{a.percentage}%</div>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{a.name}</div>
              <div style={{ fontSize: 11, color: a.color, fontWeight: 600, marginTop: 2 }}>{a.stream} · {a.batch}</div>
              {a.college && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>🎓 {a.college}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <Btn variant="ghost" size="sm" onClick={() => edit(a)}>✏️</Btn>
                <Btn variant="danger" size="sm" onClick={() => del(a.id)}>🗑️</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {alumni.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <p style={{ color: C.textMuted }}>No alumni added yet. Add your first topper!</p>
        </Card>
      )}
    </div>
  );
};
