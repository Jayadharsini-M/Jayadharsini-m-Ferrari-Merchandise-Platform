import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const [hovering, setHovering] = useState(null);

  const links = [
    { to: "/", label: "Store" },
    { to: "/search", label: "Search" },
    { to: "/cart", label: `Cart ${cartCount > 0 ? `(${cartCount})` : ""}` },
    { to: "/orders", label: "Orders" },
    { to: "/admin", label: "Admin" },
  ];

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
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
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 32px", height: "64px",
    backgroundColor: "#0d0d0d",
    borderBottom: "1px solid #1e1e1e",
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
  }
};

export default Navbar;