import { useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB } from "../../../config/database.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input, Badge } from "../../Shared/SharedComponents.jsx";


export const AppCoursesManager = () => {
  const [courses, setCourses] = useState(() => DB.get("appCourses") || []);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", instructor: "", students: 0, rating: 0, image: "", status: "active", boardType: 'CBSE', state: 'All States', class: 'All Classes' });

  const save = () => {
    if (!form.title) { toast("Course title required!", "error"); return; }
    const updated = editItem
      ? courses.map(c => c.id === editItem.id ? { ...c, ...form } : c)
      : [...courses, { ...form, id: Date.now() }];
    setCourses(updated); DB.set("appCourses", updated); resetForm();
  };

  const resetForm = () => {
    setForm({ title: "", description: "", instructor: "", students: 0, rating: 0, image: "", status: "active", boardType: 'CBSE', state: 'All States', class: 'All Classes' });
    setEditItem(null); setShowForm(false);
  };

  const edit = (c) => {
    setEditItem(c); setForm(c); setShowForm(true);
  };

  const del = (id) => {
    const u = courses.filter(c => c.id !== id); setCourses(u); DB.set("appCourses", u);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>🎓 App Courses</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Manage available courses in the app</p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ Add Course</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>{editItem ? "✏️ Edit Course" : "➕ New Course"}</h3>
          
          <div style={{ marginBottom: 14 }}>
            <Input label="COURSE TITLE *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Advanced Physics" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>BOARD TYPE</label>
              <select value={form.boardType} onChange={e => setForm({ ...form, boardType: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bgCard2, color: C.text }}>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>STATE / REGION</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bgCard2, color: C.text }}>
                <option>All States</option>
                {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Jammu & Kashmir','Puducherry','Delhi','Other'].map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>


          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="INSTRUCTOR" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="Instructor name" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>CLASS / LEVEL</label>
              <select value={form.class || 'All Classes'} onChange={e => setForm({ ...form, class: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bgCard2, color: C.text }}>
                <option value="All Classes">All Classes</option>
                {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>{c}th</option>)}
              </select>
            </div>
            <Input label="STUDENTS ENROLLED" value={form.students} onChange={e => setForm({ ...form, students: parseInt(e.target.value) })} type="number" />
            <Input label="RATING (0-5)" value={form.rating} onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })} type="number" step="0.1" min="0" max="5" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>STATUS</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bgCard2, color: C.text }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Course description..."
              style={{ width: "100%", padding: 10, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontFamily: "inherit", minHeight: 60 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update" : "✅ Add Course"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {courses.map(c => (
          <Card key={c.id} style={{ cursor: "pointer" }}>
            {c.image && <img src={c.image} alt={c.title} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
            <h3 style={{ color: C.text, margin: 0, fontSize: 14, fontWeight: 800 }}>{c.title}</h3>
            <p style={{ color: C.textMuted, fontSize: 12, margin: "4px 0" }}>{c.instructor}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <div style={{ fontSize: 12, color: C.textMuted }}>👥 {c.students} | ⭐ {c.rating}</div>
              <Badge style={{ background: c.status === "active" ? C.success + "22" : C.danger + "22", color: c.status === "active" ? C.success : C.danger }}>
                {c.status}
              </Badge>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <Btn variant="ghost" size="sm" onClick={() => edit(c)}>✏️</Btn>
              <Btn variant="danger" size="sm" onClick={() => del(c.id)}>🗑️</Btn>
            </div>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <p style={{ color: C.textMuted }}>No courses yet. Add your first course!</p>
        </Card>
      )}
    </div>
  );
};
