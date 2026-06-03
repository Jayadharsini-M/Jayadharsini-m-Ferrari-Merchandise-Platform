import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
 
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user",  password: "user123",  role: "user"  }
];
 
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
 
  const handleLogin = () => {
    setError("");
    if (!username.trim() || !password.trim()) { setError("All fields required"); return; }
    setLoading(true);
    setTimeout(() => {
      const match = users.find(u => u.username === username && u.password === password);
      if (match) {
        onLogin(match.role);
        navigate(match.role === "admin" ? "/admin" : "/");
      } else {
        setError("Invalid credentials");
        setLoading(false);
      }
    }, 600);
  };
 
  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };
 
  return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.bgOverlay} />
      <div style={s.scanlines} />
 
      <div style={{ ...s.corner, top: 0, left: 0, borderTop: "2px solid #cc0000", borderLeft: "2px solid #cc0000" }} />
      <div style={{ ...s.corner, top: 0, right: 0, borderTop: "2px solid #cc0000", borderRight: "2px solid #cc0000" }} />
      <div style={{ ...s.corner, bottom: 0, left: 0, borderBottom: "2px solid #cc0000", borderLeft: "2px solid #cc0000" }} />
      <div style={{ ...s.corner, bottom: 0, right: 0, borderBottom: "2px solid #cc0000", borderRight: "2px solid #cc0000" }} />
 
      <div style={s.telemetryBar}>
        <span style={s.telemetryItem}>SF-26 · INFINITY DRIVE</span>
        <span style={s.telemetryDot} />
        <span style={s.telemetryItem}>SYSTEM STATUS: <span style={s.green}>OPTIMAL</span></span>
        <span style={s.telemetryDot} />
        <span style={s.telemetryItem}>SECURE CHANNEL · AES-256</span>
      </div>
 
      <div style={s.card}>
        <div style={s.cardAccent} />
        <div style={s.logoArea}>
          <div style={s.logoIcon}>🏎️</div>
          <div>
            <div style={s.logoTitle}>FERRARI</div>
            <div style={s.logoSub}>RACING CONTROL CENTER</div>
          </div>
        </div>
        <div style={s.divider} />
        <p style={s.subtitle}>OPERATOR AUTHENTICATION</p>
 
        <div style={s.fieldGroup}>
          <label style={s.label}>USERNAME</label>
          <div style={s.inputWrapper}>
            <span style={s.inputIcon}>◈</span>
            <input style={s.input} type="text" value={username}
              onChange={e => setUsername(e.target.value)} onKeyDown={handleKey} placeholder="Enter username" autoComplete="off" />
          </div>
        </div>
 
        <div style={s.fieldGroup}>
          <label style={s.label}>ACCESS CODE</label>
          <div style={s.inputWrapper}>
            <span style={s.inputIcon}>⬡</span>
            <input style={s.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="Enter password" />
          </div>
        </div>
 
        {error && <div style={s.errorBox}><span style={{ color: "#cc0000", marginRight: "8px" }}>⚠</span>{error}</div>}
 
        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? <span style={s.btnLoading}><span style={s.spinner} />AUTHENTICATING...</span> : "INITIATE ACCESS →"}
        </button>
 
        <div style={s.hint}>
          <span style={s.hintItem}>user / user123</span>
          <span style={s.hintSep}>|</span>
          <span style={s.hintItem}>admin / admin123</span>
        </div>
      </div>
 
      <div style={s.bottomBar}>
        <span style={s.telemetryItem}>G-FORCE · MAX: ∞</span>
        <span style={s.telemetryDot} />
        <span style={s.telemetryItem}>TYRE TEMP · OPTIMAL</span>
        <span style={s.telemetryDot} />
        <span style={s.telemetryItem}>© SCUDERIA FERRARI · {new Date().getFullYear()}</span>
      </div>
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};
 
const s = {
  root: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Rajdhani',sans-serif", position:"relative", overflow:"hidden", backgroundColor:"#050505" },
  bg: { position:"fixed", inset:0, backgroundImage:"url('https://devia4y9vql1s.cloudfront.net/bg.jpg')", backgroundSize:"cover", backgroundPosition:"center 60%", filter:"brightness(0.5) saturate(1.4)", zIndex:0 },
  bgOverlay: { position:"fixed", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.7) 0%,rgba(10,0,0,0.4) 40%,rgba(0,0,0,0.85) 100%)", zIndex:1 },
  scanlines: { position:"fixed", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)", zIndex:2, pointerEvents:"none" },
  corner: { position:"fixed", width:"40px", height:"40px", zIndex:10 },
  telemetryBar: { position:"fixed", top:0, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", padding:"8px 24px", backgroundColor:"rgba(0,0,0,0.7)", borderBottom:"1px solid #1a0000", fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#555", letterSpacing:"2px", zIndex:20 },
  telemetryItem: { color:"#555" },
  telemetryDot: { width:"4px", height:"4px", borderRadius:"50%", backgroundColor:"#cc0000", display:"inline-block", animation:"pulse 2s infinite" },
  green: { color:"#00cc66" },
  card: { position:"relative", zIndex:30, backgroundColor:"rgba(8,8,8,0.92)", border:"1px solid #2a0000", borderRadius:"4px", padding:"40px 44px", width:"100%", maxWidth:"420px", backdropFilter:"blur(20px)", boxShadow:"0 0 60px rgba(204,0,0,0.15),0 24px 48px rgba(0,0,0,0.8)", animation:"fadeIn 0.5s ease both" },
  cardAccent: { position:"absolute", top:0, left:0, right:0, height:"3px", borderRadius:"4px 4px 0 0", background:"linear-gradient(90deg,#cc0000,#ff3333,#cc0000)" },
  logoArea: { display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px" },
  logoIcon: { fontSize:"36px", lineHeight:1 },
  logoTitle: { fontFamily:"'Rajdhani',sans-serif", fontSize:"26px", fontWeight:"700", color:"#fff", letterSpacing:"6px", lineHeight:1 },
  logoSub: { fontSize:"9px", color:"#cc0000", letterSpacing:"3px", fontFamily:"'Share Tech Mono',monospace", marginTop:"4px" },
  divider: { height:"1px", background:"linear-gradient(90deg,transparent,#2a0000,transparent)", marginBottom:"20px" },
  subtitle: { fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", letterSpacing:"3px", color:"#444", marginBottom:"28px", textAlign:"center" },
  fieldGroup: { marginBottom:"18px" },
  label: { display:"block", fontFamily:"'Share Tech Mono',monospace", fontSize:"9px", color:"#555", letterSpacing:"2px", marginBottom:"8px" },
  inputWrapper: { display:"flex", alignItems:"center", backgroundColor:"#0d0d0d", border:"1px solid #2a2a2a", borderRadius:"3px" },
  inputIcon: { padding:"0 12px", color:"#cc0000", fontSize:"14px", userSelect:"none" },
  input: { flex:1, backgroundColor:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'Share Tech Mono',monospace", fontSize:"13px", padding:"12px 12px 12px 0", letterSpacing:"1px" },
  errorBox: { backgroundColor:"#1a0000", border:"1px solid #3a0000", borderRadius:"3px", padding:"10px 14px", fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:"#ff4444", marginBottom:"16px" },
  btn: { width:"100%", padding:"14px", background:"linear-gradient(135deg,#cc0000,#990000)", color:"#fff", border:"none", borderRadius:"3px", fontFamily:"'Rajdhani',sans-serif", fontSize:"15px", fontWeight:"700", letterSpacing:"3px", cursor:"pointer", marginTop:"8px", boxShadow:"0 4px 20px rgba(204,0,0,0.3)" },
  btnLoading: { display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" },
  spinner: { width:"14px", height:"14px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", display:"inline-block", animation:"spin 0.7s linear infinite" },
  hint: { display:"flex", justifyContent:"center", alignItems:"center", gap:"8px", marginTop:"20px" },
  hintItem: { fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#333", letterSpacing:"1px" },
  hintSep: { color:"#1a1a1a" },
  bottomBar: { position:"fixed", bottom:0, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", padding:"8px 24px", backgroundColor:"rgba(0,0,0,0.7)", borderTop:"1px solid #1a0000", fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#333", letterSpacing:"2px", zIndex:20 }
};
 
export default LoginPage;
 