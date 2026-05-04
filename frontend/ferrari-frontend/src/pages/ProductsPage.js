import React, { useEffect, useState } from "react";
import { getAllProducts } from "../services/api";
import ProductCard from "../components/ProductCard";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllProducts()
      .then(res => { setProducts(res.data.products || []); setLoading(false); })
      .catch(() => { setError("Failed to load products."); setLoading(false); });
  }, []);

  return (
    <div style={styles.page} className="page-enter">
      {/* Hero */}
      <div style={styles.hero}>
        <p style={styles.heroSub}>THE OFFICIAL COLLECTION</p>
        <h1 style={styles.heroTitle}>Ferrari <span style={styles.heroRed}>F1</span> Store</h1>
        <p style={styles.heroDesc}>Exclusive merchandise for true Ferrari fans</p>
        <div style={styles.heroLine} />
      </div>

      {/* Products */}
      <div style={styles.content}>
        {loading && <div className="spinner" />}
        {error && <p style={styles.error}>{error}</p>}
        {!loading && !error && products.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🏎️</p>
            <p>No products yet. Add some from the Admin Panel!</p>
          </div>
        )}
        {!loading && (
          <div style={styles.grid}>
            {products.map(p => <ProductCard key={p.product_id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  hero: {
    textAlign: "center", padding: "60px 24px 40px",
    borderBottom: "1px solid #1a1a1a",
    background: "linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)"
  },
  heroSub: { fontSize: "11px", letterSpacing: "4px", color: "#cc0000",
    fontWeight: "700", textTransform: "uppercase", marginBottom: "12px" },
  heroTitle: { fontSize: "48px", fontWeight: "900", letterSpacing: "4px",
    color: "#ffffff", textTransform: "uppercase", marginBottom: "12px" },
  heroRed: { color: "#cc0000" },
  heroDesc: { fontSize: "14px", color: "#666", marginBottom: "24px" },
  heroLine: { width: "60px", height: "3px", backgroundColor: "#cc0000", margin: "0 auto" },
  content: { padding: "40px 32px" },
  grid: { display: "flex", flexWrap: "wrap", gap: "24px" },
  error: { color: "#cc0000", textAlign: "center", fontSize: "16px", marginTop: "40px" },
  empty: { textAlign: "center", color: "#555", marginTop: "60px", fontSize: "16px" },
  emptyIcon: { fontSize: "48px", marginBottom: "16px" }
};

export default ProductsPage;