import React, { useEffect, useState } from "react";

const CountdownTimer = ({ endTime }) => {
  const calc = () => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return null;
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000)
    };
  };

  const [time, setTime] = useState(calc());

  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (!time) return <span style={s.expired}>DROP ENDED</span>;
  const pad = n => String(n).padStart(2, "0");

  return (
    <div style={s.wrap}>
      <span style={s.label}>ENDS IN</span>
      <div style={s.timer}>
        <Block v={pad(time.h)} u="HRS" />
        <span style={s.sep}>:</span>
        <Block v={pad(time.m)} u="MIN" />
        <span style={s.sep}>:</span>
        <Block v={pad(time.s)} u="SEC" />
      </div>
    </div>
  );
};

const Block = ({ v, u }) => (
  <div style={s.block}>
    <span style={s.num}>{v}</span>
    <span style={s.unit}>{u}</span>
  </div>
);

const s = {
  wrap:    { textAlign: "center", marginBottom: "8px" },
  label:   { fontSize: "10px", color: "#888", letterSpacing: "3px" },
  timer:   { display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "4px" },
  block:   { display: "flex", flexDirection: "column", alignItems: "center",
             background: "#1a1a1a", borderRadius: "4px", padding: "4px 8px", minWidth: "40px" },
  num:     { fontSize: "20px", fontWeight: "800", color: "#cc0000", lineHeight: 1 },
  unit:    { fontSize: "9px", color: "#555", letterSpacing: "1px", marginTop: "2px" },
  sep:     { fontSize: "20px", fontWeight: "800", color: "#333", marginBottom: "8px" },
  expired: { color: "#555", fontSize: "12px", letterSpacing: "2px" }
};

export default CountdownTimer;