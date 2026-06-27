import { useState } from "react";
import { C } from "../../../constants/colors.js";
import { DB } from "../../../config/database.js";
import { toast } from "../../../hooks/useToast.jsx";
import { Card, Btn, Input, Badge, Avatar, Modal } from "../../Shared/SharedComponents.jsx";


export const StudentsManager = () => {
  const [students, setStudents] = useState(() => DB.get("students") || []);
  const [batches] = useState(() => DB.get("batches") || []);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", batch: "", parentName: "", parentPhone: "", address: "",
    status: "inactive", joinDate: "", fees: 0, paidAmount: 0, notes: ""
  });

  const save = () => {
    if (!form.name || !form.email || !form.batch) { toast("Name, Email, and Batch required!", "error"); return; }
    let updated;
    if (editItem) {
      updated = students.map(s => s.id === editItem.id ? { ...s, ...form } : s);
    } else {
      updated = [...students, { ...form, id: Date.now(), createdAt: new Date().toLocaleDateString() }];
    }
    setStudents(updated); DB.set("students", updated); resetForm(); toast(editItem ? "✅ Student updated" : "✅ Student added");
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", batch: "", parentName: "", parentPhone: "", address: "", status: "inactive", joinDate: "", fees: 0, paidAmount: 0, notes: "" });
    setEditItem(null); setShowForm(false);
  };

  const edit = (s) => {
    setEditItem(s); setForm(s); setShowForm(true);
  };

  const del = (id) => {
    const u = students.filter(s => s.id !== id); setStudents(u); DB.set("students", u); toast("Student deleted");
  };

  const approve = (id) => {
    const updated = students.map(s => s.id === id ? { ...s, status: "active" } : s);
    setStudents(updated); DB.set("students", updated); toast("✅ Student approved"); setShowApprovalModal(false);
  };

  const getBatchName = (bid) => batches.find(b => b.id === bid)?.name || bid;
  const statusColor = (s) => s === "active" ? C.success : s === "inactive" ? C.warning : C.danger;
  const statusIcon = (s) => ({ active: "✅", inactive: "⏳", rejected: "❌" }[s] || s);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingApprovals = students.filter(s => s.status === "inactive").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>👥 Students Manager</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Total: {students.length} | Pending: {pendingApprovals}</p>
        </div>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>+ Add Student</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: 10, borderRadius: 6, border: `1px solid ${C.border}`, color: C.text,
            background: C.bgCard2, cursor: "pointer", fontWeight: 600
          }}
        >
          <option value="all">All Status</option>
          <option value="active">✅ Active</option>
          <option value="inactive">⏳ Pending Approval</option>
          <option value="rejected">❌ Rejected</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}06` }}>
          <h3 style={{ color: C.text, margin: "0 0 22px", fontSize: 17 }}>{editItem ? "✏️ Edit Student" : "➕ Add Student"}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="STUDENT NAME *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            <Input label="EMAIL *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" type="email" />
            <Input label="PHONE" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>BATCH *</label>
              <select
                value={form.batch}
                onChange={e => setForm({ ...form, batch: e.target.value })}
                style={{ width: "100%", padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bgCard2 }}
              >
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <Input label="PARENT NAME" value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} placeholder="Parent/Guardian name" />
            <Input label="PARENT PHONE" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} placeholder="Parent contact" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="FEES (₹)" value={form.fees} onChange={e => setForm({ ...form, fees: parseInt(e.target.value) })} type="number" />
            <Input label="PAID AMOUNT (₹)" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: parseInt(e.target.value) })} type="number" />
          </div>

          <Input label="ADDRESS" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          <Input label="NOTES" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." style={{ marginTop: 14 }} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={save}>{editItem ? "✅ Update Student" : "✅ Add Student"}</Btn>
            <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Students Table */}
      {filteredStudents.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>NAME</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>EMAIL</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>BATCH</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>STATUS</th>
                <th style={{ padding: 12, textAlign: "left", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>FEES / PAID</th>
                <th style={{ padding: 12, textAlign: "center", color: C.textMuted, fontWeight: 700, fontSize: 11 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => {
                const due = (s.fees || 0) - (s.paidAmount || 0);
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: 12, color: C.text, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: 12, color: C.textMuted, fontSize: 12 }}>{s.email}</td>
                    <td style={{ padding: 12, color: C.textMuted, fontSize: 12 }}>{getBatchName(s.batch)}</td>
                    <td style={{ padding: 12 }}>
                      <Badge style={{ background: statusColor(s.status) + "22", color: statusColor(s.status) }}>
                        {statusIcon(s.status)} {s.status}
                      </Badge>
                    </td>
                    <td style={{ padding: 12, color: C.text, fontWeight: 600, fontSize: 12 }}>
                      ₹{s.fees} / ₹{s.paidAmount} {due > 0 && <span style={{ color: C.danger }}>(-₹{due})</span>}
                    </td>
                    <td style={{ padding: 12, textAlign: "center", display: "flex", gap: 6, justifyContent: "center" }}>
                      {s.status === "inactive" && <Btn variant="success" size="sm" onClick={() => approve(s.id)}>✅</Btn>}
                      <Btn variant="ghost" size="sm" onClick={() => edit(s)}>✏️</Btn>
                      <Btn variant="danger" size="sm" onClick={() => del(s.id)}>🗑️</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ color: C.textMuted }}>{searchTerm ? "No students found" : "No students yet. Add your first student!"}</p>
        </Card>
      )}
    </div>
  );
};
