import { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { SEC } from "../../config/auth.js";
import { t } from "../../utils/translate.js";
import { T } from "../../constants/languages.js";
import { toast } from "../../hooks/useToast.jsx";
import { Card, Stat, Btn, Avatar, Input, Badge } from "../Shared/SharedComponents.jsx";


// ============================================================
// TEACHERS MANAGER — Full admin control + approval
// ============================================================
export const TeachersManager = () => {
  const [teachers, setTeachers] = useState(() => DB.get("teachers") || []);
  const [tab, setTab] = useState("pending"); // pending | approved | all
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const emptyForm = { name:"", phone:"", email:"", subject:"", qualification:"", experience:"", salary:"", password:"teacher123" };
  const [form, setForm] = useState(emptyForm);

  const save = () => {
    if (!form.name||!form.phone||!form.subject) { toast("Name, Phone and Subject are required!", "error"); return; }
    const teacherId = "TCH"+String(Date.now()).slice(-4);
    const t = { ...form, id:Date.now(), teacherId, avatar:form.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2), joinedOn:new Date().toLocaleDateString(), status:"Approved" };
    const updated = form.id ? teachers.map(x => x.id===form.id?{...x,...form}:x) : [...teachers, t];
    setTeachers(updated); DB.set("teachers", updated);
    setForm(emptyForm); setShowAdd(false);
  };

  const approve = (id) => {
    const updated = teachers.map(t => t.id===id ? {...t, status:"Approved", approvedOn:new Date().toLocaleDateString()} : t);
    setTeachers(updated); DB.set("teachers", updated);
    SEC.logEvent("TEACHER_APPROVED", teachers.find(t=>t.id===id)?.name||id);
  };

  const reject = (id) => {
    const updated = teachers.map(t => t.id===id ? {...t, status:"Rejected"} : t);
    setTeachers(updated); DB.set("teachers", updated);
  };

  const del = (id) => {
    const updated = teachers.filter(t => t.id!==id);
    setTeachers(updated); DB.set("teachers", updated);
  };

  const pending = teachers.filter(t => t.status==="Pending Approval");
  const approved = teachers.filter(t => t.status==="Approved");
  const filtered = (tab==="pending"?pending:tab==="approved"?approved:teachers)
    .filter(t => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.subject?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ color:C.text, margin:0, fontSize:22, fontWeight:900 }}>👨‍🏫 Teachers Management</h2>
          {pending.length>0 && <div style={{ marginTop:6, fontSize:13, color:C.warning, fontWeight:700 }}>🔔 {pending.length} teacher application(s) pending approval!</div>}
        </div>
        <Btn variant="primary" onClick={()=>{setForm(emptyForm);setShowAdd(!showAdd);}}>+ Add Teacher</Btn>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card style={{ marginBottom:20, border:`1px solid ${C.primary}44` }}>
          <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16 }}>👨‍🏫 {form.id?"Edit":"New"} Teacher</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
            <Input label="FULL NAME *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Rajesh Kumar Sharma" />
            <Input label="PHONE *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile" />
            <Input label="EMAIL" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="teacher@sbc.com" />
            <Input label="SUBJECT(S) *" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Maths, Physics" />
            <Input label="QUALIFICATION" value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} placeholder="e.g. M.Sc. Maths, B.Ed." />
            <Input label="EXPERIENCE" value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})} placeholder="5 Years" />
            <Input label="SALARY (₹)" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} placeholder="30000" type="number" />
            <Input label="DEFAULT PASSWORD" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="teacher123" />
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn variant="primary" onClick={save}>✅ Save Teacher</Btn>
            <Btn variant="ghost" onClick={()=>setShowAdd(false)}>{t("cancel")||"Cancel"}</Btn>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 }}>
        <Stat icon="✅" label="Approved" value={approved.length} color={C.success} />
        <Stat icon="⏳" label="Pending" value={pending.length} color={C.warning} />
        <Stat icon="👥" label="Total" value={teachers.length} color={C.info} />
      </div>

      {/* Tabs + Search */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          {[["pending","⏳ Pending ("+pending.length+")"],["approved","✅ Approved"],["all","📋 All"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ padding:"7px 14px", borderRadius:99, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:tab===k?C.primary:C.bgCard2, color:tab===k?"#fff":C.textMuted }}>{l}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none", width:200 }} />
      </div>

      {filtered.length===0
        ? <Card style={{ textAlign:"center", padding:"40px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👨‍🏫</div>
            <div style={{ color:C.textMuted }}>{tab==="pending"?"No pending applications":"No teachers found"}</div>
          </Card>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {filtered.map(t=>(
              <Card key={t.id} style={{ border:`1px solid ${t.status==="Pending Approval"?C.warning+"55":t.status==="Approved"?C.success+"33":C.border}` }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <Avatar initials={t.avatar} size={48} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{t.name}</div>
                    <div style={{ fontSize:12, color:C.primary, fontWeight:700, marginBottom:4 }}>{t.subject}</div>
                    {[["📞",t.phone],["✉️",t.email],["🎓",t.qualification],["⏱️",t.experience],["💰",t.salary?"₹"+t.salary+"/mo":""],["🪪",t.teacherId]].filter(([,v])=>v).map(([icon,val])=>(
                      <div key={val} style={{ fontSize:12, color:C.textMuted, marginBottom:2 }}>{icon} {val}</div>
                    ))}
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                      <Badge text={t.status||"Unknown"} type={t.status==="Approved"?"success":t.status==="Pending Approval"?"warning":"danger"} />
                      {t.joinedOn&&<span style={{ fontSize:11, color:C.textMuted }}>Joined: {t.joinedOn}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
                  {t.status==="Pending Approval" && <>
                    <Btn variant="success" size="sm" onClick={()=>approve(t.id)} style={{ background:`${C.success}22`, color:C.success, border:`1px solid ${C.success}44` }}>✅ Approve</Btn>
                    <Btn variant="ghost" size="sm" onClick={()=>reject(t.id)} style={{ color:C.danger }}>❌ Reject</Btn>
                  </>}
                  {t.status==="Approved" && <Btn variant="ghost" size="sm" onClick={()=>{setForm({...t});setShowAdd(true);}}>✏️ Edit</Btn>}
                  <Btn variant="danger" size="sm" onClick={()=>del(t.id)}>🗑️ Delete</Btn>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
};
