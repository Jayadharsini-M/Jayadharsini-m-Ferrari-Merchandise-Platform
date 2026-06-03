import React, { useEffect, useState } from "react";
import { getFlashSaleProducts } from "../services/api";
import CountdownTimer from "../components/CountdownTimer";
import FlashBadge from "../components/FlashBadge";
import ProductCard from "../components/ProductCard";

const DropsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getFlashSaleProducts()
      .then(r => { setProducts(r.data.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <p style={s.sub}>FERRARI EXCLUSIVE</p>
        <h1 style={s.title}>LIMITED <span style={s.red}>DROPS</span></h1>
        <p style={s.desc}>Ultra-rare items. Once they're gone, they're gone.</p>
        <div style={s.line} />
      </div>
      <div style={s.content}>
        {loading && <div className="spinner" />}
        {!loading && products.length === 0 && (
          <div style={s.empty}>
            <p style={{ fontSize: "48px" }}>🏎️</p>
            <p>No active drops right now. Check back soon.</p>
          </div>
        )}
        <div style={s.grid}>
          {products.map(p => {
            const sold = parseInt(p.stock || 0) === 0;
            return (
              <div key={p.product_id} style={s.cardWrap}>
                <div style={s.badgeRow}>
                  <FlashBadge label={p.flash_label} sold={sold} />
                </div>
                <CountdownTimer endTime={p.drop_end_time} />
                <ProductCard product={p} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const s = {
  page:     { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  hero:     { textAlign: "center", padding: "60px 24px 40px",
              borderBottom: "1px solid #1a1a1a",
              background: "linear-gradient(180deg,#0d0d0d 0%,#0a0a0a 100%)" },
  sub:      { fontSize: "11px", letterSpacing: "4px", color: "#cc0000",
              fontWeight: "700", textTransform: "uppercase", marginBottom: "12px" },
  title:    { fontSize: "48px", fontWeight: "900", letterSpacing: "4px",
              color: "#fff", textTransform: "uppercase", marginBottom: "12px" },
  red:      { color: "#cc0000" },
  desc:     { fontSize: "14px", color: "#666", marginBottom: "24px" },
  line:     { width: "60px", height: "3px", background: "#cc0000", margin: "0 auto" },
  content:  { padding: "40px 32px" },
  grid:     { display: "flex", flexWrap: "wrap", gap: "32px" },
  cardWrap: { display: "flex", flexDirection: "column", gap: "8px" },
  badgeRow: { display: "flex", justifyContent: "center" },
  empty:    { textAlign: "center", color: "#555", marginTop: "60px", fontSize: "16px" }
};

export default DropsPage;