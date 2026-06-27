import { useState } from "react";
import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { toast } from "../../hooks/useToast.jsx";
import { Card, Btn, Input, Badge } from "../Shared/SharedComponents.jsx";


export const AdminContentHub = () => {
  const [tab, setTab] = useState("recordings");
  const recordings = DB.get("classRecordings") || [];
  const appCourses = DB.get("appCourses") || [];
  const ytPlaylists = DB.get("youtubePlaylists") || [];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📱 Content Hub</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Recordings · App Courses · YouTube Playlists — sab ek jagah</p>
        </div>
      </div>

      {/* 3 Tab Switcher */}
      <div style={{ display:"flex", gap:0, background:C.bgCard2, borderRadius:14, padding:4, marginBottom:20, border:`1px solid ${C.border}` }}>
        {[
          { key:"recordings", icon:"📹", label:"Recordings",    count:recordings.length,   color:"#FF0000" },
          { key:"courses",    icon:"📱", label:"App Courses",   count:appCourses.length,   color:C.primary },
          { key:"youtube",    icon:"▶️", label:"YouTube",       count:ytPlaylists.length,  color:"#FF0000" },
        ].map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ flex:1, padding:"12px 8px", border:"none", borderRadius:11, cursor:"pointer",
              background: tab===t.key ? `linear-gradient(135deg,${t.color},${t.color}99)` : "transparent",
              color: tab===t.key ? "#fff" : C.textMuted, transition:"all 0.2s" }}>
            <div style={{ fontSize:22 }}>{t.icon}</div>
            <div style={{ fontSize:13, fontWeight:800, marginTop:2 }}>{t.label}</div>
            <div style={{ fontSize:11, opacity:tab===t.key?1:0.6 }}>{t.count} items</div>
          </button>
        ))}
      </div>

      {tab === "recordings" && (
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📹 Class Recordings</h3>
          {recordings.length === 0
            ? <p style={{ color:C.textMuted, fontSize:13 }}>No recordings yet. Class recordings will appear here.</p>
            : recordings.map((r, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:40, height:40, borderRadius:8, background:`#FF000022`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📹</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{r.title || "Recording"}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{r.date || "—"} · {r.batch || "All batches"}</div>
                </div>
              </div>
            ))
          }
        </Card>
      )}

      {tab === "courses" && (
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📱 App Courses</h3>
          {appCourses.length === 0
            ? <p style={{ color:C.textMuted, fontSize:13 }}>No courses yet. Create courses to add them here.</p>
            : appCourses.map((c, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:40, height:40, borderRadius:8, background:`${C.primary}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📱</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{c.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{c.instructor || "—"} · ⭐ {c.rating}</div>
                </div>
                <Badge style={{ background:`${C.primary}22`, color:C.primary }}>{c.status}</Badge>
              </div>
            ))
          }
        </Card>
      )}

      {tab === "youtube" && (
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>▶️ YouTube Playlists</h3>
          {ytPlaylists.length === 0
            ? <p style={{ color:C.textMuted, fontSize:13 }}>No playlists linked yet. Add YouTube playlists for students.</p>
            : ytPlaylists.map((p, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:40, height:40, borderRadius:8, background:`#FF000022`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎬</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{p.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{p.subject || "—"} · 🎥 {p.videosCount}</div>
                </div>
              </div>
            ))
          }
        </Card>
      )}
    </div>
  );
};
