import { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { SEC } from "../../config/auth.js";
import { t } from "../../utils/translate.js";
import { T } from "../../constants/languages.js";
import { toast } from "../../hooks/useToast.jsx";
import { Card, Stat, Btn, Avatar } from "../Shared/SharedComponents.jsx";


// ============================================================
// TEACHER HOME PAGE — Beautiful landing for teachers
// ============================================================
export const TeacherHomePage = ({ currentUser, onNavigate }) => {
  const teachers  = DB.get("teachers") || [];
  const teacher   = teachers.find(x => x.id===currentUser?.id || x.teacherId===currentUser?.teacherId) || currentUser || {};
  const initials  = teacher.name ? teacher.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "T";
  const allBatches= DB.get("batches") || [];
  const myBatches = allBatches.filter(b => b.teacher===teacher.name);
  const classes   = DB.get("liveClasses") || [];
  const myClasses = classes.filter(c => c.teacher===teacher.name);
  const liveNow   = myClasses.filter(c => c.status==="live");
  const upcoming  = myClasses.filter(c => c.status==="upcoming").slice(0,3);
  const completed = myClasses.filter(c => c.status==="completed");
  const allStudents = DB.get("students") || [];
  const myStudents= allStudents.filter(s => myBatches.some(b => String(b.id)===String(s.batchId)));
  const notices   = (DB.get("notices") || []).slice(0,3);
  const recordings= (DB.get("classRecordings")||[]).filter(r => r.addedBy===teacher.id || r.addedByName===teacher.name).slice(0,3);

  const avgAtt    = completed.length>0 ? (() => {
    const tots = completed.map(c => { const a=DB.get("attendance_"+c.id)||{}; const p=Object.values(a).filter(x=>x.present).length; return Object.keys(a).length>0?p/Object.keys(a).length*100:0; });
    return Math.round(tots.reduce((a,b)=>a+b,0)/tots.length);
  })() : 0;

  const hour      = new Date().getHours();
  const greeting  = hour<12?"Good Morning ☀️":hour<17?"Good Afternoon 🌤️":"Good Evening 🌙";

  return (
    <div style={{ paddingBottom:8 }}>
      {/* ── LIVE ALERT ── */}
      {liveNow.length>0 && (
        <div onClick={()=>onNavigate("liveClass")}
          style={{ background:`linear-gradient(135deg,${C.danger}22,${C.danger}08)`, border:`2px solid ${C.danger}55`, borderRadius:16, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
          <div style={{ width:12, height:12, borderRadius:"50%", background:C.danger, boxShadow:`0 0 10px ${C.danger}`, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:C.danger, fontSize:14 }}>🔴 Your class is LIVE!</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{liveNow[0].title}</div>
          </div>
          <div style={{ background:C.danger, borderRadius:10, padding:"8px 16px", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>Manage →</div>
        </div>
      )}

      {/* ── HERO WELCOME CARD ── */}
      <div style={{ background:`linear-gradient(135deg, ${C.info}22, ${C.bgCard})`, border:`1px solid ${C.info}44`, borderRadius:22, padding:"22px 20px", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, fontSize:100, opacity:0.04 }}>👨‍🏫</div>
        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${C.info},${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:"#fff", flexShrink:0 }}>{initials}</div>
          <div>
            <div style={{ fontSize:12, color:C.info, fontWeight:700, marginBottom:2 }}>{greeting}</div>
            <div style={{ fontSize:20, fontWeight:900, color:C.text }}>{teacher.name || "Teacher"}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2, display:"flex", gap:8, flexWrap:"wrap" }}>
              {teacher.teacherId && <span>🎫 {teacher.teacherId}</span>}
              {teacher.subject && <span>📖 {teacher.subject}</span>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[
            {icon:"🎓", val:myStudents.length, label:"Students",   color:C.success},
            {icon:"📚", val:myBatches.length,  label:t("batches")||"Batches",    color:C.primary},
            {icon:"📡", val:completed.length,  label:"Classes",    color:C.info},
            {icon:"✅", val:avgAtt?avgAtt+"%":"—", label:"Avg Att", color:C.gold},
          ].map((st,i)=>(
            <div key={i} style={{ background:"rgba(0,0,0,0.3)", borderRadius:14, padding:"12px 8px", textAlign:"center" }}>
              <div style={{ fontSize:18 }}>{st.icon}</div>
              <div style={{ fontSize:15, fontWeight:900, color:st.color, marginTop:3 }}>{st.val}</div>
              <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:10 }}>⚡ QUICK ACTIONS</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[
            {icon:"📡", label:"Live Class", go:"liveClass"},
            {icon:"📚", label:"My Courses", go:"recordings"},
            {icon:"✅", label:"Attendance", go:"attendance"},
          ].map(a=>(
            <button key={a.go} onClick={()=>onNavigate(a.go)} style={{ padding:"12px 10px", borderRadius:12, border:`1px solid ${C.primary}33`, background:`${C.primary}10`, cursor:"pointer", fontWeight:700, color:C.primary, fontSize:13 }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{a.icon}</div>{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTIONS ── */}
      <div style={{ display:"grid", gap:16 }}>
        {/* Upcoming Classes */}
        <Card>
          <div style={{ fontSize:13, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:12 }}>📅 UPCOMING CLASSES</div>
          {upcoming.length ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {upcoming.map(c=>(
                <div key={c.id} style={{ padding:"12px", background:C.bgCard2, borderRadius:10, borderLeft:`3px solid ${C.warning}` }}>
                  <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{c.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>📅 {c.date} · ⏰ {c.time}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color:C.textMuted, fontSize:12, margin:0 }}>No upcoming classes</p>}
        </Card>

        {/* Recent Notices */}
        <Card>
          <div style={{ fontSize:13, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:12 }}>📢 RECENT NOTICES</div>
          {notices.length ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {notices.map(n=>(
                <div key={n.id} style={{ padding:"12px", background:C.bgCard2, borderRadius:10, borderLeft:`3px solid ${n.important?C.danger:C.primary}` }}>
                  <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>📅 {n.date}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color:C.textMuted, fontSize:12, margin:0 }}>No notices yet</p>}
        </Card>

        {/* My Batches */}
        {myBatches.length > 0 && (
          <Card>
            <div style={{ fontSize:13, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:12 }}>📚 MY BATCHES</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {myBatches.slice(0,3).map(b=>(
                <div key={b.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:10 }}>
                  <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{b.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>⏰ {b.time} · 👥 {b.students||0} students</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
