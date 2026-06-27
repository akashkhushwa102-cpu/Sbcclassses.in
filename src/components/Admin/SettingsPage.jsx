import { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { toast } from "../../hooks/useToast.jsx";
import { Card, Btn, Input, Badge } from "../Shared/SharedComponents.jsx";


export const SettingsPage = () => {
  const [contact, setContact] = useState(() => DB.get("contact") || { phone:"", email:"", address:"", whatsapp:"", mapLink:"" });
  const [ticker, setTicker]   = useState(() => DB.get("ticker")  || []);
  const [newTicker, setNewTicker] = useState("");
  const [saved, setSaved]     = useState("");
  const [upi, setUpi]         = useState(() => DB.get("upiSettings") || { upiId:"", name:"SBC Classes", amount:"" });

  const saveSection = (key) => {
    if (key==="contact") { DB.set("contact", contact); setSaved("contact"); setTimeout(()=>setSaved(""), 2000); toast("✅ Contact settings saved!"); }
    if (key==="ticker")  { DB.set("ticker", ticker);   setSaved("ticker");  setTimeout(()=>setSaved(""), 2000); toast("✅ Ticker saved!"); }
    if (key==="upi")     { DB.set("upiSettings", upi); setSaved("upi");     setTimeout(()=>setSaved(""), 2000); toast("✅ UPI settings saved!"); }
  };

  const clearData = (key, label) => {
    DB.set(key, []);
    toast(label + " cleared!");
  };

  return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 20px", fontSize:22, fontWeight:900 }}>⚙️ Settings</h2>

      {/* CONTACT */}
      <Card style={{ marginBottom:18, border:`1px solid ${C.info}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16, fontWeight:800 }}>📞 Contact & Location — Shown on Homepage</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="PHONE NUMBER"      value={contact.phone}    onChange={e=>setContact({...contact,phone:e.target.value})}    placeholder="9876543000" />
          <Input label="WHATSAPP NUMBER"   value={contact.whatsapp} onChange={e=>setContact({...contact,whatsapp:e.target.value})} placeholder="9876543000" />
          <Input label="EMAIL ADDRESS"     value={contact.email}    onChange={e=>setContact({...contact,email:e.target.value})}    placeholder="info@sbcclasses.in" />
          <Input label="FULL ADDRESS"      value={contact.address}  onChange={e=>setContact({...contact,address:e.target.value})}  placeholder="Main Road, City, MP" />
        </div>
        <div style={{ marginTop:12 }}>
          <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7, letterSpacing:1 }}>GOOGLE MAPS EMBED LINK (optional)</label>
          <input value={contact.mapLink} onChange={e=>setContact({...contact,mapLink:e.target.value})} placeholder="https://www.google.com/maps/embed?..."
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} />
          <div style={{ fontSize:11, color:C.textMuted, marginTop:5 }}>💡 Google Maps → Share → Embed map → Copy the src="..." URL</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
          <Btn variant="primary" onClick={()=>saveSection("contact")}>💾 Save Contact</Btn>
          {saved==="contact" && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
        </div>
      </Card>

      {/* UPI SETTINGS */}
      <Card style={{ marginBottom:18, border:`1px solid ${C.success}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16, fontWeight:800 }}>💰 UPI Payment Settings</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="UPI ID *" value={upi.upiId} onChange={e=>setUpi({...upi,upiId:e.target.value})} placeholder="yourname@upi" />
          <Input label="DISPLAY NAME" value={upi.name} onChange={e=>setUpi({...upi,name:e.target.value})} placeholder="SBC Classes" />
          <Input label="DEFAULT AMOUNT (₹)" value={upi.amount} onChange={e=>setUpi({...upi,amount:e.target.value})} placeholder="Leave blank for custom" type="number" />
        </div>
        <div style={{ marginTop:12, padding:"10px 14px", background:`${C.info}10`, borderRadius:10, fontSize:12, color:C.textMuted }}>
          💡 UPI ID set karne ke baad Fees page mein QR code automatically generate hoga
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
          <Btn variant="primary" onClick={()=>saveSection("upi")}>💾 Save UPI</Btn>
          {saved==="upi" && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
        </div>
      </Card>

      {/* TICKER */}
      <Card style={{ marginBottom:18, border:`1px solid ${C.warning}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16, fontWeight:800 }}>📢 Ticker Bar Messages — Homepage scrolling banner</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {ticker.map((t,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C.bgCard2, borderRadius:10 }}>
              <span style={{ flex:1, fontSize:13, color:C.text }}>📢 {t}</span>
              <button onClick={()=>setTicker(ticker.filter((_,j)=>j!==i))}
                style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={newTicker} onChange={e=>setNewTicker(e.target.value)} placeholder="New announcement message..."
            onKeyDown={e=>e.key==="Enter"&&newTicker.trim()&&(setTicker([...ticker,newTicker.trim()]),setNewTicker(""))}
            style={{ flex:1, padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }} />
          <Btn variant="outline" onClick={()=>{ if(newTicker.trim()){ setTicker([...ticker,newTicker.trim()]); setNewTicker(""); }}}>+ Add</Btn>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:12 }}>
          <Btn variant="primary" onClick={()=>saveSection("ticker")}>💾 Save Ticker</Btn>
          {saved==="ticker" && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
        </div>
      </Card>

      {/* DATA MANAGEMENT */}
      <Card style={{ border:`1px solid ${C.danger}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 6px", fontSize:16, fontWeight:800 }}>🗂️ Data Management</h3>
        <p style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}>Manage app stored data. These actions cannot be undone.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {[
            { key:"students",       label:"Clear Students",    icon:"🎓" },
            { key:"teachers",       label:"Clear Teachers",    icon:"👨‍🏫" },
            { key:"batches",        label:"Clear Batches",     icon:"📚" },
            { key:"liveClasses",    label:"Clear Classes",     icon:"📡" },
            { key:"classRecordings",label:"Clear Recordings",  icon:"🎬" },
            { key:"txnHistory",     label:"Clear Transactions", icon:"💰" },
            { key:"notices",        label:"Clear Notices",     icon:"📢" },
            { key:"alumni",         label:"Clear Alumni",      icon:"🏆" },
          ].map(item => (
            <Btn
              key={item.key}
              variant="danger"
              onClick={()=>clearData(item.key, item.label)}
              size="sm"
              style={{ textAlign:"left", display:"flex", gap:8, alignItems:"center" }}>
              <span>{item.icon}</span> {item.label}
            </Btn>
          ))}
        </div>
        <div style={{ marginTop:14, padding:"12px 16px", background:`${C.danger}10`, border:`1px solid ${C.danger}33`, borderRadius:12 }}>
          <div style={{ fontWeight:800, color:C.danger, marginBottom:6 }}>⚠️ Full Reset</div>
          <p style={{ color:C.textMuted, fontSize:12, margin:"0 0 10px" }}>Delete ALL data — students, teachers, batches, classes, fees. This is irreversible!</p>
          <Btn
            variant="danger"
            onClick={()=>{
              ["students","teachers","batches","liveClasses","classRecordings","txnHistory","notices","alumni","offers","seclog","appCourses"].forEach(k=>DB.set(k,[]));
              localStorage.removeItem("sbc_demo_seeded");
              toast("🗑️ Full reset done! Please refresh the page.", "warning");
            }}>
            🗑️ Full Reset
          </Btn>
        </div>
      </Card>
    </div>
  );
};
