import React, { useState } from "react";
import { searchProducts } from "../services/api";
import ProductCard from "../components/ProductCard";

const SearchPage = () => {
  const [keyword, setKeyword] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword && !minPrice && !maxPrice) return;
    setLoading(true); setSearched(true);
    try {
      const res = await searchProducts(keyword, minPrice, maxPrice);
      setResults(res.data.products || []);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <p style={styles.headerSub}>SEARCH</p>
        <h1 style={styles.headerTitle}>Find Your <span style={styles.red}>Ferrari</span> Gear</h1>
      </div>

      <div style={styles.searchBox}>
        <div style={styles.searchRow}>
          <input
            placeholder="🔍  Search products..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.mainInput}
          />
        </div>
        <div style={styles.filterRow}>
          <input placeholder="Min Price $" value={minPrice} type="number"
            onChange={e => setMinPrice(e.target.value)} style={styles.filterInput} />
          <input placeholder="Max Price $" value={maxPrice} type="number"
            onChange={e => setMaxPrice(e.target.value)} style={styles.filterInput} />
          <button onClick={handleSearch} style={styles.searchBtn}>Search</button>
          <button onClick={() => { setKeyword(""); setMinPrice(""); setMaxPrice(""); setResults([]); setSearched(false); }}
            style={styles.clearBtn}>Clear</button>
        </div>
      </div>

      <div style={styles.content}>
        {loading && <div className="spinner" />}
        {searched && !loading && results.length === 0 && (
          <div style={styles.empty}>
            <p style={{ fontSize: "40px" }}>🔍</p>
            <p>No products found. Try a different keyword.</p>
          </div>
        )}
        {searched && !loading && results.length > 0 && (
          <p style={styles.resultCount}>{results.length} product{results.length !== 1 ? "s" : ""} found</p>
        )}
        <div style={styles.grid}>
          {results.map(p => <ProductCard key={p.product_id} product={p} />)}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  header: { textAlign: "center", padding: "50px 24px 30px" },
  headerSub: { fontSize: "11px", letterSpacing: "4px", color: "#cc0000",
    fontWeight: "700", textTransform: "uppercase", marginBottom: "10px" },
  headerTitle: { fontSize: "36px", fontWeight: "900", color: "#fff", letterSpacing: "2px" },
  red: { color: "#cc0000" },
  searchBox: { maxWidth: "700px", margin: "0 auto", padding: "0 24px 32px" },
  searchRow: { marginBottom: "12px" },
  mainInput: { fontSize: "16px", padding: "14px 18px",
    backgroundColor: "#141414", border: "1px solid #2a2a2a",
    borderRadius: "8px", color: "#fff", width: "100%" },
  filterRow: { display: "flex", gap: "10px", alignItems: "center" },
  filterInput: { flex: 1, padding: "10px 14px", fontSize: "13px",
    backgroundColor: "#141414", border: "1px solid #2a2a2a",
    borderRadius: "8px", color: "#fff" },
  searchBtn: { padding: "10px 24px", backgroundColor: "#cc0000", color: "#fff",
    border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px",
    letterSpacing: "1px" },
  clearBtn: { padding: "10px 16px", backgroundColor: "#1a1a1a", color: "#888",
    border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "13px" },
  content: { padding: "0 32px 40px" },
  resultCount: { color: "#888", fontSize: "13px", marginBottom: "20px" },
  grid: { display: "flex", flexWrap: "wrap", gap: "24px" },
  empty: { textAlign: "center", color: "#555", marginTop: "60px", fontSize: "15px" }
};

export default SearchPage;