// ============================================================
// TEACHER DASHBOARD
// ============================================================
export const TeacherDashboard = ({ currentUser, onNavigate, C, DB, Card, Btn }) => {
  const allBatches = DB.get("batches") || [];
  const displayBatches = currentUser?.name ? allBatches.filter(b => b.teacher === currentUser.name) : allBatches;
  const allStudents = DB.get("students") || [];
  const myStudentCount = allStudents.filter(s => displayBatches.some(b => String(b.id) === String(s.batchId))).length;
  const allClasses = DB.get("liveClasses") || [];
  const myClasses = allClasses.filter(c => c.teacher === currentUser?.name);
  const liveNow = myClasses.filter(c => c.status === "live");
  const upcoming = myClasses.filter(c => c.status === "upcoming").slice(0,3);
  const notices = (DB.get("notices") || []).slice(0,3);
  const initials = currentUser?.name ? currentUser.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "T";

  // Avg attendance across my classes
  const completedMyClasses = myClasses.filter(c => c.status === "completed");
  let avgAtt = 0;
  if (completedMyClasses.length > 0) {
    const tots = completedMyClasses.map(c => {
      const att = DB.get("attendance_"+c.id) || {};
      const present = Object.values(att).filter(a=>a.present).length;
      const total = Object.keys(att).length || 1;
      return present/total*100;
    });
    avgAtt = Math.round(tots.reduce((a,b)=>a+b,0)/tots.length);
  }

  return (
    <div>
      {/* Live class alert */}
      {liveNow.length > 0 && (
        <div style={{ background:`${C.danger}18`, border:`2px solid ${C.danger}55`, borderRadius:16, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:C.danger }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:C.danger, fontSize:14 }}>🔴 Your class is LIVE now!</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{liveNow[0].title}</div>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div style={{ background:`linear-gradient(135deg, ${C.info}18, ${C.bgCard})`, border:`1px solid ${C.info}33`, borderRadius:20, padding:"20px 22px", marginBottom:18, display:"flex", gap:16, alignItems:"center" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg, ${C.info}, ${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"#fff", flexShrink:0 }}>{initials}</div>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:C.text }}>Welcome, {currentUser?.name || "Teacher"}! 👋</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
            {currentUser?.teacherId && <span style={{marginRight:10}}>🎫 {currentUser.teacherId}</span>}
            {currentUser?.subject && <span>📖 {currentUser.subject}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { icon:"👥", label:"My Students",   value: myStudentCount||allStudents.length, color:C.success, go:"students" },
          { icon:"📚", label:"My Batches",    value: displayBatches.length||allBatches.length, color:C.info, go:"myBatches" },
          { icon:"📡", label:"Classes Taken", value: completedMyClasses.length, color:C.primary, go:"liveClass" },
          { icon:"✅", label:"Avg Attendance",value: avgAtt?avgAtt+"%":"—", color:C.gold, go:"attendance" },
        ].map((s,i) => (
          <div key={i} onClick={()=>onNavigate(s.go)} style={{ background:C.bgCard, border:`1px solid ${s.color}33`, borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, marginTop:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {/* My Batches */}
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📚 My Batches</h3>
          {(displayBatches.length ? displayBatches : allBatches).slice(0,3).map(b => (
            <div key={b.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:11, marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{b.name}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>⏰ {b.time} · 👥 {b.students||0} students</div>
            </div>
          ))}
          {!allBatches.length && <p style={{ color:C.textMuted, fontSize:12 }}>No batches assigned yet</p>}
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📅 Upcoming Classes</h3>
          {upcoming.length ? upcoming.map(c => (
            <div key={c.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:11, marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{c.title}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>📅 {c.date} · ⏰ {c.time}</div>
            </div>
          )) : <p style={{ color:C.textMuted, fontSize:12 }}>No upcoming classes</p>}
        </Card>

        {/* Notices */}
        <Card style={{ gridColumn:"1/-1" }}>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📢 Latest Notices</h3>
          {notices.length ? notices.map(n => (
            <div key={n.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:10, marginBottom:8, borderLeft:`3px solid ${n.important?C.danger:C.primary}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{n.title}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{n.date}</div>
            </div>
          )) : <p style={{ color:C.textMuted, fontSize:12 }}>No notices posted</p>}
        </Card>
      </div>

      {/* Quick Actions */}
      {onNavigate && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, color:C.textMuted, fontWeight:700, marginBottom:10, letterSpacing:1 }}>⚡ QUICK ACTIONS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"📡", label:"Start Live Class",  section:"liveClass",  color:C.danger,   desc:"Schedule or go live" },
              { icon:"📚", label:"Add to Courses",      section:"recordings", color:C.primary,  desc:"Recording, Course, YouTube" },
              { icon:"✅", label:"Mark Attendance",    section:"attendance", color:C.success,  desc:"Today's attendance" },
              { icon:"📢", label:"Post Notice",        section:"notices",    color:C.warning,  desc:"Announce to students" },
              { icon:"🎓", label:"View Students",      section:"students",   color:C.info,     desc:"My batch students" },
              { icon:"📅", label:"View Schedule",      section:"schedule",   color:C.gold,     desc:"Class timetable" },
            ].map(a => (
              <button key={a.section} onClick={()=>onNavigate(a.section)}
                style={{ padding:"12px 14px", borderRadius:14, border:`1px solid ${a.color}33`, background:`${a.color}10`, cursor:"pointer", textAlign:"left", display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:a.color }}>{a.label}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
