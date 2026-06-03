import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
 
const Navbar = ({ onLogout }) => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate  = useNavigate();
  const [hovering, setHovering] = useState(null);
 
  const role = localStorage.getItem("role");
 
  const userLinks = [
    { to: "/",       label: "Store" },
    { to: "/drops",  label: "⚡ Drops" },
    { to: "/search", label: "Search" },
    { to: "/cart",   label: `Cart${cartCount > 0 ? ` (${cartCount})` : ""}` },
    { to: "/orders", label: "Orders" },
  ];
 
  const adminLinks = [
    { to: "/admin", label: "⚙ Product Management" },
  ];
 
  const links = role === "admin" ? adminLinks : userLinks;
 
  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };
 
  return (
    <nav style={styles.nav}>
      <Link to={role === "admin" ? "/admin" : "/"} style={styles.brand}>
        <span style={styles.brandIcon}>🏎️</span>
        <span>FERRARI <span style={styles.brandAccent}>STORE</span></span>
      </Link>
 
      <div style={styles.links}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              ...styles.link,
              ...(location.pathname === link.to ? styles.activeLink : {}),
              ...(hovering === link.to ? styles.linkHover : {})
            }}
            onMouseEnter={() => setHovering(link.to)}
            onMouseLeave={() => setHovering(null)}
          >
            {link.label}
            {location.pathname === link.to && <span style={styles.activeDot} />}
          </Link>
        ))}
 
        <span style={{ ...styles.roleBadge, ...(role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser) }}>
          {role === "admin" ? "ADMIN" : "USER"}
        </span>
 
        <button
          onClick={handleLogout}
          style={{
            ...styles.link, ...styles.logoutBtn,
            ...(hovering === "__logout" ? styles.logoutHover : {})
          }}
          onMouseEnter={() => setHovering("__logout")}
          onMouseLeave={() => setHovering(null)}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
 
const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 32px", height: "64px",
    backgroundColor: "#0d0d0d", borderBottom: "1px solid #1e1e1e",
    position: "sticky", top: 0, zIndex: 1000,
    boxShadow: "0 2px 20px rgba(0,0,0,0.8)"
  },
  brand: {
    display: "flex", alignItems: "center", gap: "10px",
    fontSize: "18px", fontWeight: "800", letterSpacing: "2px",
    color: "#ffffff", textDecoration: "none"
  },
  brandIcon: { fontSize: "24px" },
  brandAccent: { color: "#cc0000" },
  links: { display: "flex", gap: "4px", alignItems: "center" },
  link: {
    color: "#aaaaaa", textDecoration: "none", fontSize: "13px",
    fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase",
    padding: "8px 16px", borderRadius: "6px",
    position: "relative", transition: "all 0.2s ease"
  },
  linkHover: { color: "#ffffff", backgroundColor: "#1a1a1a" },
  activeLink: { color: "#cc0000" },
  activeDot: {
    position: "absolute", bottom: "2px", left: "50%",
    transform: "translateX(-50%)",
    width: "4px", height: "4px", borderRadius: "50%",
    backgroundColor: "#cc0000", display: "block"
  },
  roleBadge: {
    padding: "3px 10px", borderRadius: "4px",
    fontSize: "10px", fontWeight: "800", letterSpacing: "2px"
  },
  roleBadgeUser:  { backgroundColor: "#0a1a0a", color: "#28a745", border: "1px solid #1a3a1a" },
  roleBadgeAdmin: { backgroundColor: "#1a0000", color: "#cc0000", border: "1px solid #3a0000" },
  logoutBtn: {
    background: "none", border: "1px solid #2a2a2a", cursor: "pointer",
    color: "#666", fontSize: "13px"
  },
  logoutHover: { color: "#cc0000", borderColor: "#cc0000", backgroundColor: "#1a0000" }
};
 
export default Navbar;