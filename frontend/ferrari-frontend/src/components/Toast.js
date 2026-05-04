import React, { useEffect } from "react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{ ...styles.toast, borderLeft: `4px solid ${type === "success" ? "#28a745" : "#cc0000"}` }}>
      <span style={styles.icon}>{type === "success" ? "✅" : "❌"}</span>
      <span style={styles.message}>{message}</span>
      <button onClick={onClose} style={styles.close}>×</button>
    </div>
  );
};

const styles = {
  toast: {
    position: "fixed", top: "80px", right: "20px",
    backgroundColor: "#1a1a1a", color: "#ffffff",
    padding: "14px 18px", borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", gap: "12px",
    fontSize: "14px", zIndex: 9999, minWidth: "300px",
    animation: "slideIn 0.3s ease", border: "1px solid #2a2a2a"
  },
  icon: { fontSize: "16px" },
  message: { flex: 1, color: "#ffffff" },
  close: {
    background: "none", border: "none", color: "#666",
    fontSize: "20px", cursor: "pointer", lineHeight: 1,
    padding: "0 4px"
  }
};

export default Toast;