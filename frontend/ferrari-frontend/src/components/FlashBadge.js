import React from "react";

const FlashBadge = ({ label = "LIMITED DROP", sold = false }) => (
  <div style={{ ...s.badge, ...(sold ? s.sold : s.active) }}>
    {sold ? "SOLD OUT" : `⚡ ${label}`}
  </div>
);

const s = {
  badge:  { display: "inline-block", fontSize: "10px", fontWeight: "800",
            letterSpacing: "2px", padding: "4px 10px", borderRadius: "3px" },
  active: { background: "#cc0000", color: "#fff" },
  sold:   { background: "#2a2a2a", color: "#555" }
};

export default FlashBadge;