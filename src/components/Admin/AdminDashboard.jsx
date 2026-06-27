import { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { toast } from "../../hooks/useToast.jsx";
import { Card, Btn, Input, Stat, Badge, Avatar, PBar } from "../Shared/SharedComponents.jsx";


export const AdminDashboard = ({ onNavigate }) => {
  const students     = DB.get("students")    || [];
  const teachers     = DB.get("teachers")    || [];
  const batches      = DB.get("batches")     || [];
  const txns         = DB.get("txnHistory")  || [];
  const classes      = DB.get("liveClasses") || [];
  const recordings   = DB.get("classRecordings") || [];
  const alumni       = DB.get("alumni")      || [];

  const approvedStudents  = students.filter(s => s.status==="approved"||s.status==="Approved");
  const pendingStudents   = students.filter(s => s.status==="Pending Approval");
  const approvedTeachers  = teachers.filter(t => t.status==="Approved"||t.status==="approved");
  const pendingTeachers   = teachers.filter(t => t.status==="Pending Approval");
  const activeBatches     = batches.filter(b => b.active!==false);
  const liveNow           = classes.filter(c => c.status==="live");
  const pendingSubs       = students.filter(s => s.subscription?.pending && !s.subscription?.active);

  const paidTxns   = txns.filter(t => t.type==="fees"||t.type==="cash"||t.type==="upi"||t.amount);
  const totalRev   = paidTxns.reduce((s,t) => s+(parseInt(t.amount)||0), 0);
  const thisMonth  = new Date().getMonth();
  const monthRev   = paidTxns.filter(t => { try { return new Date(t.date).getMonth()===thisMonth; } catch(e){ return false; }}).reduce((s,t) => s+(parseInt(t.amount)||0), 0);

  const withAtt    = approvedStudents.filter(s => s.attendance > 0);
  const avgAtt     = withAtt.length ? Math.round(withAtt.reduce((s,x)=>s+x.attendance,0)/withAtt.length) : 0;

  const statRows = [
    { icon:"🎓", label:"Total Students",   value: students.length,            sub: `${approvedStudents.length} active · ${pendingStudents.length} pending`, color:C.success,  section:"students" },
    { icon:"👨‍🏫", label:"Teachers",         value: approvedTeachers.length,    sub: pendingTeachers.length>0?`⚠️ ${pendingTeachers.length} pending`:"All approved", color:C.info, section:"teachers" },
    { icon:"📚", label:"Active Batches",   value: activeBatches.length,       sub: `${batches.length} total`, color:C.primary, section:"batches" },
    { icon:"💰", label:"This Month Rev",   value: monthRev?"₹"+monthRev.toLocaleString("en-IN"):"₹0", sub: totalRev?"Total: ₹"+totalRev.toLocaleString("en-IN"):"No transactions yet", color:C.gold, section:"fees" },
    { icon:"✅", label:"Avg Attendance",   value: avgAtt?avgAtt+"%":"—",      sub: withAtt.length+" students tracked", color:C.success, section:"students" },
    { icon:"📡", label:"Live Classes",     value: liveNow.length,             sub: `${classes.filter(c=>c.status==="upcoming").length} upcoming`, color:liveNow.length>0?C.danger:C.textMuted, section:"liveClass" },
    { icon:"🎬", label:"Recordings",       value: recordings.length,          sub: "in library", color:"#FF0000", section:"content" },
    { icon:"💎", label:"Sub. Requests",    value: pendingSubs.length,         sub: pendingSubs.length>0?"Verify now":"All clear", color:pendingSubs.length>0?C.primary:C.textMuted, section:"subscription" },
    { icon:"🔔", label:"Pending Approvals",value: pendingStudents.length+pendingTeachers.length, sub: `${pendingStudents.length} students · ${pendingTeachers.length} teachers`, color:(pendingStudents.length+pendingTeachers.length)>0?C.warning:C.textMuted, section:"students" },
    { icon:"🏆", label:"Alumni",           value: alumni.length,              sub: "On landing page", color:C.warning, section:"alumni" },
  ];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>🛡️ Admin Dashboard</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Samagra Bharat Coaching Classes · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"2-digit",month:"short"})}</p>
        </div>
        {liveNow.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:`${C.danger}18`, border:`1px solid ${C.danger}44`, borderRadius:99, padding:"8px 16px", cursor:"pointer" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.danger }} />
            <span style={{ color:C.danger, fontWeight:800, fontSize:13 }}>🔴 {liveNow.length} Class LIVE now</span>
          </div>
        )}
      </div>

      {(pendingStudents.length > 0 || pendingTeachers.length > 0 || pendingSubs.length > 0) && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {pendingStudents.length > 0 && (
            <button style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:12, border:`1px solid ${C.warning}44`, background:`${C.warning}12`, cursor:"pointer", color:C.warning, fontWeight:700, fontSize:13 }}>
              🔔 {pendingStudents.length} student{pendingStudents.length>1?"s":""} pending approval
            </button>
          )}
          {pendingTeachers.length > 0 && (
            <button style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:12, border:`1px solid ${C.info}44`, background:`${C.info}12`, cursor:"pointer", color:C.info, fontWeight:700, fontSize:13 }}>
              👨‍🏫 {pendingTeachers.length} teacher application{pendingTeachers.length>1?"s":""}
            </button>
          )}
          {pendingSubs.length > 0 && (
            <button style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:12, border:`1px solid ${C.primary}44`, background:`${C.primary}12`, cursor:"pointer", color:C.primary, fontWeight:700, fontSize:13 }}>
              💎 {pendingSubs.length} subscription request{pendingSubs.length>1?"s":""}
            </button>
          )}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
        {statRows.map((s,i) => (
          <Stat key={s.section || i} icon={s.icon} label={s.label} value={s.value} sub={s.sub} color={s.color} />
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:20 }}>
        {[
          { icon:"🎓", label:"Manage Students", section:"students",      color:C.success },
          { icon:"📡", label:"Live Classes",    section:"liveClass",     color:C.danger  },
          { icon:"🎬", label:"App Courses",     section:"content",       color:"#FF0000" },
          { icon:"📚", label:"Batches",         section:"batches",       color:C.primary },
          { icon:"💰", label:"Fees",            section:"fees",          color:C.gold    },
          { icon:"⚙️", label:"Settings",        section:"settings",      color:C.textMuted },
        ].map(a => (
          <button key={a.section}
            style={{ padding:"12px 10px", borderRadius:13, border:`1px solid ${a.color}33`, background:`${a.color}10`, cursor:"pointer", textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:5 }}>{a.icon}</div>
            <div style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:15, fontWeight:800 }}>🎓 Recent Students</h3>
          </div>
          {students.length === 0
            ? <p style={{ color:C.textMuted, fontSize:13 }}>No students yet. They will appear after signup.</p>
            : students.slice(-5).reverse().map(s => (
              <div key={s._id || s.id || s.email || s.tempId} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.success},${C.success}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {s.name?.slice(0,2).toUpperCase()||"??"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{s.rollNo||s.tempId||"—"} · {s.batch||"No batch"}</div>
                </div>
                <span style={{ padding:"3px 8px", borderRadius:99, fontSize:10, fontWeight:700, background:s.status==="approved"||s.status==="Approved"?`${C.success}22`:`${C.warning}22`, color:s.status==="approved"||s.status==="Approved"?C.success:C.warning }}>
                  {s.status==="approved"||s.status==="Approved"?"✅ Active":"⏳ Pending"}
                </span>
              </div>
            ))
          }
        </Card>

        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:15, fontWeight:800 }}>📚 Batch Strength</h3>
          </div>
          {batches.length === 0
            ? <p style={{ color:C.textMuted, fontSize:13 }}>No batches yet. Create first batch</p>
            : batches.map(b => {
                const bid = b._id || b.id;
                const batchStudents = approvedStudents.filter(s => String(s.batchId)===String(bid)).length;
                const capacity = b.capacity || 40;
                return (
                  <div key={bid || b.name} style={{ marginBottom:12, cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:C.text, fontSize:12, fontWeight:600 }}>{b.name}</span>
                      <span style={{ color:C.primary, fontSize:12, fontWeight:700 }}>{batchStudents}/{capacity}</span>
                    </div>
                    <PBar value={capacity>0?Math.round(batchStudents/capacity*100):0} color={C.primary} />
                  </div>
                );
              })
          }
        </Card>

        <Card style={{ gridColumn:"1/-1" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:15, fontWeight:800 }}>💰 Recent Transactions</h3>
          </div>
          {txns.length === 0
            ? <p style={{ color:C.textMuted, fontSize:13 }}>No transactions yet. Fees collected will appear here.</p>
            : txns.slice(-5).reverse().map((t,i) => (
              <div key={t._id || t.id || i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${C.gold}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>💰</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{t.studentName||"Student"}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{t.date||"—"} · {t.type||"fees"}</div>
                </div>
                <div style={{ fontWeight:900, color:C.success, fontSize:15 }}>₹{parseInt(t.amount||0).toLocaleString("en-IN")}</div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
};
