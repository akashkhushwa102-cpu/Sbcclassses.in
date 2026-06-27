import { C } from "../../constants/colors.js";
import { DB } from "../../config/database.js";
import { Card, Badge } from "../Shared/SharedComponents.jsx";

export const SecurityLogPage = () => {
  const logs = DB.get("seclog") || [];
  const typeColor = {
    ADMIN_LOGIN_SUCCESS:"success", STUDENT_LOGIN_SUCCESS:"success", TEACHER_LOGIN_SUCCESS:"success",
    ADMIN_FAIL:"danger", LOGIN_FAIL:"danger", BLOCKED:"danger",
    ADMIN_STEP1_OK:"warning", ADMIN_SECRET_FAIL:"danger",
    STUDENT_SIGNUP_COMPLETE:"info", TEACHER_SIGNUP_COMPLETE:"info",
    TEACHER_APPROVED:"success", STUDENT_APPROVED:"success",
    PASSWORD_RESET_SUCCESS:"warning",
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>🔐 Security Log</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>All login attempts and security events are logged here.</p>
        </div>
        <Badge text={logs.length + " events"} type="default" />
      </div>
      <Card style={{ padding:0 }}>
        {logs.length===0
          ? <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>No logs found. Login events will appear here.</div>
          : [...logs].reverse().map((log,i) => (
            <div key={i} style={{ display:"flex", gap:14, padding:"13px 18px", borderBottom:`1px solid ${C.border}`, alignItems:"flex-start" }}>
              <Badge text={log.type?.replace(/_/g," ")||"EVENT"} type={typeColor[log.type]||"default"} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>{log.detail||"—"}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{log.time||"—"}</div>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
};
