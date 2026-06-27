import { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { toast } from "../../hooks/useToast.jsx";
import { Card, Btn, Badge, Stat, PBar } from "../Shared/SharedComponents.jsx";


export const ReportsPage = () => {
  const students   = DB.get("students")   || [];
  const teachers   = DB.get("teachers")   || [];
  const batches    = DB.get("batches")    || [];
  const txns       = DB.get("txnHistory") || [];
  const classes    = DB.get("liveClasses")|| [];
  const recordings = DB.get("classRecordings")|| [];

  const approved   = students.filter(s => s.status==="approved"||s.status==="Approved");
  const pending    = students.filter(s => s.status==="Pending Approval");
  const approvedT  = teachers.filter(t => t.status==="Approved"||t.status==="approved");
  const active     = batches.filter(b => b.active!==false);

  const paidTxns   = txns.filter(t => t.amount);
  const totalRev   = paidTxns.reduce((s,t)=>s+(parseInt(t.amount)||0),0);
  const thisMonth  = new Date().getMonth();
  const monthRev   = paidTxns.filter(t=>{ try{return new Date(t.date).getMonth()===thisMonth;}catch(e){return false;} }).reduce((s,t)=>s+(parseInt(t.amount)||0),0);
  const withAtt    = approved.filter(s=>s.attendance>0);
  const avgAtt     = withAtt.length ? Math.round(withAtt.reduce((s,x)=>s+x.attendance,0)/withAtt.length) : 0;

  const cbse  = approved.filter(s=>s.board==="CBSE").length;
  const state = approved.filter(s=>s.board==="State"||s.board==="State Board").length;
  const icse  = approved.filter(s=>s.board==="ICSE").length;
  const total = cbse+state+icse||1;

  return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📊 Reports & Analytics</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:20 }}>Live data · {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          {icon:"🎓",label:"Total Students",     value:students.length,           sub:`${approved.length} active · ${pending.length} pending`, color:C.success},
          {icon:"👨‍🏫",label:"Teachers",            value:teachers.length,           sub:`${approvedT.length} approved`, color:C.info},
          {icon:"📚",label:"Active Batches",     value:active.length,             sub:`${batches.length} total`, color:C.primary},
          {icon:"✅",label:"Avg Attendance",     value:avgAtt?avgAtt+"%":"—",     sub:`${withAtt.length} tracked`, color:C.gold},
          {icon:"📡",label:"Classes Completed",  value:classes.filter(c=>c.status==="completed").length, sub:`${classes.length} total`, color:C.warning},
          {icon:"🎬",label:"Recordings",         value:recordings.length,         sub:"in library", color:"#FF0000"},
          {icon:"💰",label:"This Month",         value:monthRev?"₹"+monthRev.toLocaleString("en-IN"):"₹0", sub:"fees collected", color:C.gold},
          {icon:"🏦",label:"Total Revenue",      value:totalRev?"₹"+totalRev.toLocaleString("en-IN"):"₹0", sub:"all time", color:C.success},
        ].map((s,i)=>(
          <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, marginTop:4 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{s.label}</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>💰 Batch-wise Revenue</h3>
          {active.length===0 && <p style={{ color:C.textMuted, fontSize:13 }}>No batches yet</p>}
          {active.map(b=>{
            const bs = approved.filter(s=>String(s.batchId)===String(b.id)).length;
            const rev = bs*(b.fees||0);
            const maxRev = Math.max(...active.map(x=>approved.filter(s=>String(s.batchId)===String(x.id)).length*(x.fees||0)),1);
            return (
              <div key={b.id} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:C.text, fontSize:12, fontWeight:600 }}>{b.name}</span>
                  <span style={{ color:C.gold, fontSize:12, fontWeight:800 }}>₹{rev.toLocaleString("en-IN")}</span>
                </div>
                <PBar value={Math.round(rev/maxRev*100)} color={C.gold} />
                <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{bs} students · ₹{b.fees||0}/month</div>
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📋 Board Distribution</h3>
          {approved.length===0 && <p style={{ color:C.textMuted, fontSize:13 }}>No students yet</p>}
          {[["CBSE",cbse,C.info],["State Board",state,C.warning],["ICSE",icse,C.success]].filter(([,c])=>c>0).map(([l,c,col])=>(
            <div key={l} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ color:C.text, fontSize:13, fontWeight:700 }}>{l}</span>
                <span style={{ color:col, fontWeight:800 }}>{c} ({Math.round(c/total*100)}%)</span>
              </div>
              <PBar value={Math.round(c/total*100)} color={col} />
            </div>
          ))}
          {approved.length>0 && !cbse && !state && !icse && <p style={{ color:C.textMuted, fontSize:12 }}>Board data not assigned yet</p>}
        </Card>

        <Card style={{ gridColumn:"1/-1" }}>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>⚠️ Low Attendance (&lt;75%)</h3>
          {approved.filter(s=>(s.attendance||0)<75).length===0
            ? <p style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ All students have good attendance (75%+)</p>
            : approved.filter(s=>(s.attendance||0)<75).map(s=>(
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`${C.danger}22`, display:"flex", alignItems:"center", justifyContent:"center", color:C.danger, fontWeight:800, fontSize:13 }}>
                  {s.name?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{s.rollNo} · {s.batch||"—"}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:900, color:C.danger }}>{s.attendance||0}%</div>
                  <PBar value={s.attendance||0} color={C.danger} />
                </div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
};
