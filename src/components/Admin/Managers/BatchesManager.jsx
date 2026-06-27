/* ============================================================
   ADMIN — BATCHES MANAGER
   ------------------------------------------------------------
   Same UI as the demo, plus the production fields the student
   subscription page needs:  price, duration, description and
   isPublished.  Saves go through the DB shim, which mirrors
   creates/updates to the MongoDB backend in real time.
   ============================================================ */
import { useEffect, useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB, sync } from "../../../config/database.js";
import { apiCall } from "../../../services/apiClient.js";
import { SUBJECTS } from "../../../constants/subjects.js";
import { batchAPI } from "../../../services/apiClient.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input, Badge } from "../../Shared/SharedComponents.jsx";

const BLANK = {
  name: "",
  class: "",
  stream: "",
  schedule: "",
  teacher: "",
  strength: 0,
  boardType: "CBSE",
  state: "All States",
  board: "CBSE",
  fees: 0,
  status: "active",
  // production-grade fields
  description: "",
  price: 0,        // INR — what students pay
  duration: 30,    // days
  isPublished: false,
  features: [],
    // optional live class info attached to this batch
    livePlatform: "zoom",
    liveLink: "",
    liveMeetingId: "",
    livePassword: "",
    liveDate: "",
    liveTime: "",
    liveDuration: 60,
    liveClassId: "",
};

export const BatchesManager = () => {
  const [batches, setBatches] = useState(() => DB.get("batches") || []);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [featuresInput, setFeaturesInput] = useState("");
  const [localSubjects, setLocalSubjects] = useState(() => DB.get('subjects') || SUBJECTS);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");

  const streams = ["Science", "Commerce", "Arts", "General", "Medical", "Non-Medical"];
  const BOARD_TYPES = ["CBSE", "ICSE", "State Board"];
  const STATES = [
    'All States','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Jammu & Kashmir','Puducherry','Delhi','Other'
  ];
  const statuses = ["active", "inactive", "completed"];

  // Pull the live list from the backend on mount.
  useEffect(() => {
    (async () => {
      const list = await sync.batches();
      if (Array.isArray(list)) setBatches(list);
    })();
  }, []);

  const save = async () => {
    if (!form.name.trim()) { toast("Batch name is required!", "error"); return; }
    if (!form.price || form.price <= 0) { toast("Set a price (₹) so students can subscribe.", "error"); return; }
    if (!form.duration || form.duration < 1) { toast("Duration must be at least 1 day.", "error"); return; }

    const features = featuresInput
      ? featuresInput.split(",").map((s) => s.trim()).filter(Boolean)
      : (form.features || []);

    const payload = {
      ...form,
      features,
      // Map the legacy "fees" UI field to the backend "price" field if user
      // only edited fees:
      price: Number(form.price) || Number(form.fees) || 0,
      duration: Number(form.duration) || 30,
      isPublished: !!form.isPublished,
      // Map UI `class` to backend `classLevel` (numeric) and ensure board/state keys
      classLevel: form.class && form.class !== 'All Classes' ? Number(form.class) : null,
      board: form.board || form.boardType || null,
      state: form.state || null,
      // include live class info if admin filled it
      livePlatform: form.livePlatform || undefined,
      liveLink: form.liveLink || undefined,
      liveMeetingId: form.liveMeetingId || undefined,
      livePassword: form.livePassword || undefined,
      liveDate: form.liveDate || undefined,
      liveTime: form.liveTime || undefined,
      liveDuration: form.liveDuration || undefined,
    };

    try {
      if (editItem && editItem._id) {
        const resp = await batchAPI.update(editItem._id, payload);
        const saved = resp?.data || resp;
        const updated = batches.map((b) => (b._id === editItem._id ? saved : b));
        setBatches(updated);
        DB.set("batches", updated);
        toast("Batch updated", "success");
        // If admin provided liveLink, sync/create live-class record so students can join
        try {
          if (form.liveLink) {
            const lcPayload = {
              topic: form.title || saved.name,
              description: form.description || saved.description,
              batchId: saved._id,
              teacherId: saved.teacherId || undefined,
              startAt: form.liveDate && form.liveTime ? new Date(form.liveDate + 'T' + form.liveTime) : undefined,
              durationMinutes: Number(form.liveDuration) || 60,
              joinUrl: form.liveLink,
              meetingId: form.liveMeetingId || undefined,
              password: form.livePassword || undefined,
            };
            if (form.liveClassId) {
              await apiCall(`/live-classes/${form.liveClassId}`, { method: 'PUT', body: lcPayload });
            } else {
              const respLc = await apiCall('/live-classes', { method: 'POST', body: lcPayload });
              const created = respLc?.data || respLc;
              // persist locally
              const existing = DB.get('liveClasses') || [];
              DB.set('liveClasses', [...existing, created]);
              try { window.dispatchEvent(new CustomEvent('sbc:live-classes-updated', { detail: { source: 'admin-batch' } })); } catch (_) {}
            }
          }
        } catch (err) {
          // non-blocking — just notify admin
          console.warn('Failed to create/update live-class from batch', err);
        }
      } else {
        const resp = await batchAPI.create(payload);
        const saved = resp?.data || resp;
        const updated = [...batches, saved];
        setBatches(updated);
        DB.set("batches", updated);
        toast("Batch created", "success");
        try {
          if (form.liveLink) {
            const lcPayload = {
              topic: form.title || saved.name,
              description: form.description || saved.description,
              batchId: saved._id,
              teacherId: saved.teacherId || undefined,
              startAt: form.liveDate && form.liveTime ? new Date(form.liveDate + 'T' + form.liveTime) : undefined,
              durationMinutes: Number(form.liveDuration) || 60,
              joinUrl: form.liveLink,
              meetingId: form.liveMeetingId || undefined,
              password: form.livePassword || undefined,
            };
            // ensure startAt is serialized as ISO string
            if (lcPayload.startAt && lcPayload.startAt instanceof Date) lcPayload.startAt = lcPayload.startAt.toISOString();
            const respLc = await apiCall('/live-classes', { method: 'POST', body: lcPayload });
            const created = respLc?.data || respLc;
            const existing = DB.get('liveClasses') || [];
            DB.set('liveClasses', [...existing, created]);
            try { window.dispatchEvent(new CustomEvent('sbc:live-classes-updated', { detail: { source: 'admin-batch' } })); } catch (_) {}
          }
        } catch (err) {
          console.warn('Failed to create live-class from batch', err);
        }
      }
      resetForm();
    } catch (err) {
      toast(`Save failed: ${err.message}`, "error");
    }
  };

  const resetForm = () => {
    setForm(BLANK);
    setFeaturesInput("");
    setEditItem(null);
    setShowForm(false);
  };

  const edit = (b) => {
    setEditItem(b);
    setForm({ ...BLANK, ...b });
    setFeaturesInput((b.features || []).join(", "));
    setShowForm(true);
  };

  const del = async (b) => {
    if (!window.confirm(`Delete batch "${b.name}"?`)) return;
    try {
      if (b._id) await batchAPI.remove(b._id);
      const u = batches.filter((x) => (x._id || x.id) !== (b._id || b.id));
      setBatches(u);
      DB.set("batches", u);
      toast("Batch deleted", "success");
    } catch (err) {
      toast(`Delete failed: ${err.message}`, "error");
    }
  };

  const togglePublish = async (b) => {
    try {
      if (b._id) {
        const resp = await batchAPI.togglePublish(b._id);
        const saved = resp?.data || resp;
        const u = batches.map((x) => (x._id === b._id ? saved : x));
        setBatches(u); DB.set("batches", u);
        toast(saved.isPublished ? "Published" : "Unpublished", "success");
      } else {
        const u = batches.map((x) => (x.id === b.id ? { ...x, isPublished: !x.isPublished } : x));
        setBatches(u); DB.set("batches", u);
      }
    } catch (err) {
      toast(`Toggle failed: ${err.message}`, "error");
    }
  };

  const statusColor = (s) => (s === "active" ? C.success : s === "inactive" ? C.warning : C.textMuted);
  const statusLabel = (s) =>
    ({ active: "🟢 Active", inactive: "🟡 Inactive", completed: "✅ Completed" }[s] || s);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>📚 Batches &amp; Classes</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>
            Create &amp; manage batches. Set <strong>Price</strong> and toggle <strong>Publish</strong> to make them visible to students.
          </p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ New Batch</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>
            {editItem ? "✏️ Edit Batch" : "➕ New Batch"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="BATCH NAME *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Class 12 - Science (A)" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>CLASS / LEVEL</label>
              <select value={form.class || ''} onChange={(e) => setForm({ ...form, class: e.target.value })}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}>
                <option value="">Select Class...</option>
                <option value="All Classes">All Classes</option>
                {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>SUBJECT</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={{ flex: 1, padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}>
                  <option value="">Select Subject</option>
                  <option value="All Subjects">All Subjects</option>
                  {localSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="button" onClick={() => setShowAddSubject(true)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, cursor: 'pointer' }}>
                  + Add
                </button>
              </div>
              {showAddSubject && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <input value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} placeholder="New subject (e.g. Mathematics)"
                    style={{ flex: 1, padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                  <Btn variant="primary" onClick={() => {
                    const v = (subjectInput || '').trim();
                    if (!v) { toast('Enter a subject name', 'error'); return; }
                    if (!localSubjects.includes(v)) {
                      const updated = [...localSubjects, v];
                      setLocalSubjects(updated);
                      try { DB.set('subjects', updated); } catch (_) {}
                    }
                    setForm({ ...form, subject: v });
                    setSubjectInput(''); setShowAddSubject(false);
                  }}>Add</Btn>
                  <Btn variant="ghost" onClick={() => { setShowAddSubject(false); setSubjectInput(''); }}>Cancel</Btn>
                </div>
              )}
            </div>

            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>STREAM</label>
              <select value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}>
                <option value="">Select Stream</option>
                {streams.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>BOARD TYPE</label>
              <select value={form.boardType} onChange={(e) => setForm({ ...form, boardType: e.target.value, board: e.target.value })}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}>
                {BOARD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>STATE / REGION</label>
              <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value, board: form.boardType === 'State Board' ? `State Board - ${e.target.value}` : form.boardType })}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <Input label="TEACHER NAME" value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              placeholder="Teacher name" />
            <Input label="SCHEDULE" value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="Mon-Fri, 4-6 PM" />

            {/* Optional: attach a one-off live class / Zoom meeting to this batch */}
            <div style={{ gridColumn: '1 / -1', marginTop: 6, padding: 10, border: `1px dashed ${C.border}`, borderRadius: 8, background: C.bgCard2 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>🔴 Optional: Live Class (Zoom / Meet / Teams)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Platform</label>
                  <select value={form.livePlatform || 'zoom'} onChange={(e) => setForm({ ...form, livePlatform: e.target.value })}
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}>
                    <option value="zoom">Zoom</option>
                    <option value="googlemeet">Google Meet</option>
                    <option value="teams">MS Teams</option>
                    <option value="youtube">YouTube</option>
                    <option value="custom">Custom Link</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Date</label>
                  <input type="date" value={form.liveDate || ''} onChange={(e) => setForm({ ...form, liveDate: e.target.value })}
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                </div>
                <div>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Time</label>
                  <input type="time" value={form.liveTime || ''} onChange={(e) => setForm({ ...form, liveTime: e.target.value })}
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                </div>
                <div>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
                  <input type="number" value={form.liveDuration || 60} onChange={(e) => setForm({ ...form, liveDuration: Number(e.target.value || 60) })}
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Meeting Link</label>
                  <input value={form.liveLink || ''} onChange={(e) => setForm({ ...form, liveLink: e.target.value })} placeholder="https://zoom.us/j/..."
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                </div>
                <div>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Meeting ID</label>
                  <input value={form.liveMeetingId || ''} onChange={(e) => setForm({ ...form, liveMeetingId: e.target.value })}
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                </div>
                <div>
                  <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Password</label>
                  <input value={form.livePassword || ''} onChange={(e) => setForm({ ...form, livePassword: e.target.value })}
                    style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }} />
                </div>
              </div>
            </div>

            <Input label="MAX STRENGTH" type="number" value={form.strength}
              onChange={(e) => setForm({ ...form, strength: parseInt(e.target.value || "0", 10) })} />

            <Input label="PRICE (₹) *" type="number" value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value || "0", 10) })}
              placeholder="1499" />

            <Input label="DURATION (DAYS) *" type="number" value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value || "0", 10) })}
              placeholder="90" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>
              DESCRIPTION
            </label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What do students get with this batch?"
              style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, background: C.bgCard2, minHeight: 70, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>
              FEATURES (comma-separated)
            </label>
            <input value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="Live classes, Recordings, Doubt sessions"
              style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, background: C.bgCard2 }} />
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              color: C.text, fontSize: 14, fontWeight: 600,
            }}>
              <input type="checkbox" checked={!!form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              Publish (visible to students)
            </label>
          </div>

          <div>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>STATUS</label>
            <div style={{ display: "flex", gap: 10 }}>
              {statuses.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, status: s })}
                  style={{
                    padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: form.status === s ? statusColor(s) + "33" : C.bgCard2,
                    color: form.status === s ? statusColor(s) : C.textMuted,
                    fontWeight: 600, fontSize: 12,
                  }}>
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update Batch" : "✅ Create Batch"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      {batches.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>BATCH</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>TEACHER</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>PRICE</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>DURATION</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>PUBLISHED</th>
                <th style={{ padding: 12, textAlign: "center", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b._id || b.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: 12, color: C.text, fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: 12, color: C.textMuted }}>{b.teacher || (b.teacherId?.name) || "-"}</td>
                  <td style={{ padding: 12, color: C.text, fontWeight: 600 }}>₹{b.price ?? b.fees ?? 0}</td>
                  <td style={{ padding: 12, color: C.textMuted }}>{b.duration || 30} days</td>
                  <td style={{ padding: 12 }}>
                    <Badge style={{
                      background: (b.isPublished ? C.success : C.textMuted) + "22",
                      color: b.isPublished ? C.success : C.textMuted,
                    }}>
                      {b.isPublished ? "🟢 Published" : "⚪ Draft"}
                    </Badge>
                  </td>
                  <td style={{ padding: 12, textAlign: "center", display: "flex", gap: 6, justifyContent: "center" }}>
                    <Btn variant="ghost" size="sm" onClick={() => togglePublish(b)} title={b.isPublished ? "Unpublish" : "Publish"}>
                      {b.isPublished ? "🔒" : "🚀"}
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => edit(b)}>✏️</Btn>
                    <Btn variant="danger" size="sm" onClick={() => del(b)}>🗑️</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <p style={{ color: C.textMuted }}>No batches created yet. Create your first batch!</p>
        </Card>
      )}
    </div>
  );
};
