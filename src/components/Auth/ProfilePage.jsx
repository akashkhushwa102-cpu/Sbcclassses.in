// Profile Page Component
import React, { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { SEC } from "../../config/auth.js";

export const ProfilePage = ({ role, user, onLogout, onNavigate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
  });

  const handleSave = () => {
    const key = role === "teacher" ? "teachers" : "students";
    const list = DB.get(key) || [];
    const updated = list.map((u) =>
      u.id === user.id ? { ...u, ...form } : u
    );
    DB.set(key, updated);
    setEditing(false);
    alert("Profile updated!");
  };

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Profile Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.primary}, ${C.info})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 900,
            fontSize: 28,
            margin: "0 auto 12px",
          }}
        >
          {user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"}
        </div>
        <h2 style={{ color: C.text, margin: "0 0 4px", fontWeight: 900 }}>{user?.name || "User"}</h2>
        <p style={{ color: C.textMuted, margin: 0, fontSize: 13 }}>
          {role === "teacher" ? user?.teacherId || "Teacher" : user?.rollNo || "Student"}
        </p>
        {/* Show student's onboarding/class info if available */}
        {role === 'student' && (
          <p style={{ color: C.textMuted, margin: '6px 0 0', fontSize: 13 }}>
            {user?.onboarding?.board ? `${user.onboarding.board} · ` : ''}{user?.onboarding?.state ? `${user.onboarding.state} · ` : ''}{user?.onboarding?.class ? `Class ${user.onboarding.class}` : ''}
          </p>
        )}
      </div>

      {/* Profile Form */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <h3 style={{ color: C.text, margin: "0 0 16px", fontWeight: 800 }}>👤 Profile Details</h3>
        
        {["name", "phone", "email", "address"].map((field) => (
          <div key={field} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: C.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "capitalize" }}>
              {field}
            </label>
            {editing ? (
              <input
                type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: C.bg,
                  color: C.text,
                }}
              />
            ) : (
              <p style={{ color: C.text, margin: 0, fontSize: 14 }}>{user?.[field] || "—"}</p>
            )}
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: C.success, color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                💾 Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.text, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${C.primary}`, background: "none", color: C.primary, fontWeight: 700, cursor: "pointer" }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: C.danger,
          color: "#fff",
          fontWeight: 800,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default ProfilePage;