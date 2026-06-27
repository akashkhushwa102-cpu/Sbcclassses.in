// ============================================================
// TEACHER BATCH VIEW — Shows all batches and students
// ============================================================
export const TeacherBatchView = ({ currentUser, C, DB, Card }) => {
  const allBatches = DB.get("batches") || [];
  const myBatches = allBatches.filter(b => b.teacher === currentUser?.name);
  const allStudents = DB.get("students") || [];

  if (myBatches.length === 0) return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 20px", fontSize:22, fontWeight:900 }}>📚 My Batches</h2>
      <Card style={{ textAlign:"center", padding:"48px 20px" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
        <div style={{ fontWeight:700, color:C.text, marginBottom:6 }}>No batches assigned yet</div>
        <p style={{ color:C.textMuted, fontSize:13 }}>Admin will assign you to a batch. Contact admin if needed.</p>
      </Card>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📚 My Batches</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>{myBatches.length} batch{myBatches.length!==1?"es":""} assigned to you</p>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {myBatches.map(b => {
          const batchStudents = allStudents.filter(s => String(s.batchId) === String(b.id));
          const avgAtt = batchStudents.length > 0
            ? Math.round(batchStudents.reduce((sum,s)=>sum+(s.attendance||0),0)/batchStudents.length)
            : 0;
          return (
            <Card key={b.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:17, color:C.text }}>{b.name}</div>
                  <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                    <span style={{ padding:"3px 10px", borderRadius:99, background:`${C.primary}18`, color:C.primary, fontSize:11, fontWeight:700 }}>{b.board}</span>
                    <span style={{ padding:"3px 10px", borderRadius:99, background:`${C.info}18`, color:C.info, fontSize:11, fontWeight:700 }}>{b.class}</span>
                    {b.active===false && <span style={{ padding:"3px 10px", borderRadius:99, background:`${C.danger}18`, color:C.danger, fontSize:11, fontWeight:700 }}>Paused</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:C.success }}>{batchStudents.length}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Students</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                {[
                  ["⏰", "Time", b.time||"—"],
                  ["📅", "Days", b.days||"—"],
                  ["💰", "Fees", b.fees?`₹${b.fees}/month`:"—"],
                  ["✅", "Avg Attend.", avgAtt+"%"],
                ].map(([icon,label,val])=>(
                  <div key={label} style={{ background:C.bgCard2, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, color:C.textMuted }}>{icon} {label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text, marginTop:3 }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* Students list */}
              {batchStudents.length > 0 && (
                <div>
                  <div style={{ fontSize:12, color:C.textMuted, fontWeight:700, marginBottom:8 }}>STUDENTS IN THIS BATCH</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {batchStudents.slice(0,8).map(s=>(
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px", background:C.bgCard2, borderRadius:10 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primary}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:11 }}>
                          {s.name?.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{s.name?.split(" ")[0]}</div>
                          <div style={{ fontSize:10, color:s.attendance>=75?C.success:C.warning }}>{s.attendance||0}%</div>
                        </div>
                      </div>
                    ))}
                    {batchStudents.length > 8 && (
                      <div style={{ padding:"6px 12px", background:C.bgCard2, borderRadius:10, fontSize:12, color:C.textMuted, display:"flex", alignItems:"center" }}>
                        +{batchStudents.length-8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
