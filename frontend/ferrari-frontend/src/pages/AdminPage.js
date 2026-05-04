import React, { useEffect, useState, useCallback } from "react";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import { useCart } from "../context/CartContext";

const emptyForm = {
  name: "", description: "", price: "", stock: "", image_url: "", category: ""
};

// ✅ FIX: Field component defined OUTSIDE AdminPage — stops focus loss
const Field = ({ label, field, type = "text", placeholder, rows, value, onChange, error }) => (
  <div style={fieldStyles.wrapper}>
    <label style={fieldStyles.label}>{label}</label>
    {rows ? (
      <textarea
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...fieldStyles.input, borderColor: error ? "#cc0000" : "#2a2a2a", resize: "vertical" }}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        style={{ ...fieldStyles.input, borderColor: error ? "#cc0000" : "#2a2a2a" }}
      />
    )}
    {error && <span style={fieldStyles.errorText}>{error}</span>}
  </div>
);

const fieldStyles = {
  wrapper: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "4px" },
  label: { fontSize: "11px", fontWeight: "700", color: "#888", letterSpacing: "1px", textTransform: "uppercase" },
  input: {
    backgroundColor: "#0d0d0d", color: "#fff", border: "1px solid #2a2a2a",
    borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
    transition: "border-color 0.2s", width: "100%", fontFamily: "inherit"
  },
  errorText: { fontSize: "11px", color: "#cc0000" }
};

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [view, setView] = useState("list");
  const { showToast } = useCart();

  const fetchProducts = useCallback(() => {
    setLoading(true);
    getAllProducts()
      .then(res => setProducts(res.data.products || []))
      .catch(err => {
        console.error("Fetch error:", err);
        showToast("Failed to load products — check console", "error");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ✅ FIX: Single field updater — no re-render loop
  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      e.price = "Enter a valid price";
    if (form.stock === "" || isNaN(form.stock) || Number(form.stock) < 0)
      e.stock = "Enter a valid stock number";
    if (!form.image_url.trim()) e.image_url = "Image URL is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock),
        image_url:   form.image_url.trim(),
        category:    form.category.trim()
      };
      if (editId) {
        await updateProduct(editId, payload);
        showToast("Product updated successfully!", "success");
      } else {
        await createProduct(payload);
        showToast("Product created successfully!", "success");
      }
      setForm(emptyForm);
      setEditId(null);
      setErrors({});
      setView("list");
      fetchProducts();
    } catch (err) {
      console.error("Submit error:", err.response || err);
      const msg = err.response?.data?.message || "Operation failed — check console";
      showToast(msg, "error");
    }
    setFormLoading(false);
  };

  const handleEdit = (product) => {
    setForm({
      name:        product.name || "",
      description: product.description || "",
      price:       String(product.price || ""),
      stock:       String(product.stock || ""),
      image_url:   product.image_url || "",
      category:    product.category || ""
    });
    setEditId(product.product_id);
    setErrors({});
    setView("form");
  };

  const handleDelete = async (productId, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(productId);
      showToast("Product deleted", "success");
      fetchProducts();
    } catch (err) {
      console.error("Delete error:", err.response || err);
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const handleNewProduct = () => {
    setForm(emptyForm);
    setEditId(null);
    setErrors({});
    setView("form");
  };

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.headerSub}>DASHBOARD</p>
          <h1 style={styles.headerTitle}>Admin <span style={styles.red}>Panel</span></h1>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.stat}>
            <span style={styles.statNum}>{products.length}</span>
            <span style={styles.statLabel}>Products</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{products.filter(p => p.stock === 0).length}</span>
            <span style={styles.statLabel}>Out of Stock</span>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(view === "list" ? styles.tabActive : {}) }}
            onClick={() => setView("list")}>
            📦 All Products
          </button>
          <button
            style={{ ...styles.tab, ...(view === "form" ? styles.tabActive : {}) }}
            onClick={handleNewProduct}>
            ➕ {editId ? "Edit Product" : "Add Product"}
          </button>
        </div>

        {/* Product List */}
        {view === "list" && (
          <div style={styles.section}>
            {loading ? (
              <div className="spinner" />
            ) : products.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: "40px", marginBottom: "12px" }}>📦</p>
                <p style={{ color: "#888" }}>No products yet. Click "Add Product" to create one!</p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Image","Name","Price","Stock","Category","Actions"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.product_id} style={styles.tr}>
                        <td style={styles.td}>
                          <img
                            src={p.image_url}
                            alt={p.name}
                            style={styles.thumbnail}
                            onError={e => { e.target.src = "https://placehold.co/50x50/1a1a1a/cc0000?text=F1";; }}
                          />
                        </td>
                        <td style={styles.td}>
                          <strong style={{ color: "#fff" }}>{p.name}</strong><br />
                          <span style={{ fontSize: "12px", color: "#555" }}>
                            {(p.description || "").slice(0, 50)}...
                          </span>
                        </td>
                        <td style={{ ...styles.td, color: "#cc0000", fontWeight: "700" }}>
                          ${parseFloat(p.price).toFixed(2)}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.stockBadge,
                            backgroundColor: p.stock === 0 ? "#2a0000" : p.stock <= 5 ? "#2a1f00" : "#0a1f0a",
                            color: p.stock === 0 ? "#cc0000" : p.stock <= 5 ? "#c9a84c" : "#28a745"
                          }}>{p.stock}</span>
                        </td>
                        <td style={{ ...styles.td, color: "#666" }}>{p.category || "—"}</td>
                        <td style={styles.td}>
                          <div style={styles.actionBtns}>
                            <button onClick={() => handleEdit(p)} style={styles.editBtn}>Edit</button>
                            <button onClick={() => handleDelete(p.product_id, p.name)} style={styles.deleteBtn}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Product Form */}
        {view === "form" && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              {editId ? "✏️ Edit Product" : "➕ New Product"}
            </h2>

            {/* ⚠️ Image URL notice */}
            <div style={styles.notice}>
              ⚠️ <strong>Image URL must be a web link</strong> (e.g. https://example.com/image.jpg)
              — not a file from your computer. Use <a href="https://imgur.com" target="_blank"
              rel="noreferrer" style={{ color: "#cc0000" }}>imgur.com</a> to upload images for free.
            </div>

            <div style={styles.formGrid}>
              <Field label="Product Name *" field="name" placeholder="e.g. Ferrari Cap"
                value={form.name} onChange={handleFieldChange} error={errors.name} />
              <Field label="Category" field="category" placeholder="e.g. Apparel"
                value={form.category} onChange={handleFieldChange} error={errors.category} />
              <Field label="Price ($) *" field="price" type="number" placeholder="e.g. 49.99"
                value={form.price} onChange={handleFieldChange} error={errors.price} />
              <Field label="Stock *" field="stock" type="number" placeholder="e.g. 100"
                value={form.stock} onChange={handleFieldChange} error={errors.stock} />
            </div>

            <Field label="Image URL *" field="image_url"
              placeholder="https://i.imgur.com/your-image.jpg"
              value={form.image_url} onChange={handleFieldChange} error={errors.image_url} />

            <div style={{ marginTop: "16px" }}>
              <Field label="Description *" field="description"
                placeholder="Describe the product..." rows={3}
                value={form.description} onChange={handleFieldChange} error={errors.description} />
            </div>

            {/* Image Preview */}
            {form.image_url && form.image_url.startsWith("http") && (
              <div style={styles.preview}>
                <p style={styles.previewLabel}>Preview:</p>
                <img src={form.image_url} alt="preview" style={styles.previewImg}
                  onError={e => { e.target.style.display = "none"; }} />
              </div>
            )}

            <div style={styles.formActions}>
              <button
                onClick={() => { setView("list"); setForm(emptyForm); setEditId(null); setErrors({}); }}
                style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleSubmit} style={styles.submitBtn} disabled={formLoading}>
                {formLoading ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "40px 32px 24px", borderBottom: "1px solid #1a1a1a"
  },
  headerSub: { fontSize: "11px", letterSpacing: "4px", color: "#cc0000",
    fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" },
  headerTitle: { fontSize: "32px", fontWeight: "900", color: "#fff" },
  red: { color: "#cc0000" },
  headerStats: { display: "flex", gap: "32px" },
  stat: { textAlign: "center" },
  statNum: { display: "block", fontSize: "32px", fontWeight: "900", color: "#cc0000" },
  statLabel: { fontSize: "11px", color: "#666", letterSpacing: "1px", textTransform: "uppercase" },
  content: { padding: "24px 32px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "24px" },
  tab: {
    padding: "10px 20px", backgroundColor: "#141414", color: "#888",
    border: "1px solid #2a2a2a", borderRadius: "8px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer"
  },
  tabActive: { backgroundColor: "#cc0000", color: "#fff", borderColor: "#cc0000" },
  section: { overflowX: "auto" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px", textAlign: "left", fontSize: "11px",
    letterSpacing: "1px", color: "#666", borderBottom: "1px solid #2a2a2a",
    textTransform: "uppercase"
  },
  tr: { borderBottom: "1px solid #1a1a1a" },
  td: { padding: "14px 16px", fontSize: "13px", color: "#ccc", verticalAlign: "middle" },
  thumbnail: { width: "48px", height: "48px", objectFit: "cover",
    borderRadius: "6px", border: "1px solid #2a2a2a" },
  stockBadge: { padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" },
  actionBtns: { display: "flex", gap: "8px" },
  editBtn: {
    padding: "6px 14px", backgroundColor: "transparent",
    color: "#c9a84c", border: "1px solid #c9a84c",
    borderRadius: "5px", fontSize: "12px", fontWeight: "600", cursor: "pointer"
  },
  deleteBtn: {
    padding: "6px 14px", backgroundColor: "transparent",
    color: "#cc0000", border: "1px solid #cc0000",
    borderRadius: "5px", fontSize: "12px", fontWeight: "600", cursor: "pointer"
  },
  empty: { textAlign: "center", padding: "60px 24px" },
  formCard: {
    backgroundColor: "#141414", border: "1px solid #2a2a2a",
    borderRadius: "12px", padding: "32px", maxWidth: "800px"
  },
  formTitle: { fontSize: "20px", fontWeight: "800", color: "#fff", marginBottom: "16px" },
  notice: {
    backgroundColor: "#1a1000", border: "1px solid #c9a84c",
    borderRadius: "8px", padding: "12px 16px",
    fontSize: "13px", color: "#c9a84c", marginBottom: "20px", lineHeight: "1.5"
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  preview: { marginTop: "16px", marginBottom: "8px" },
  previewLabel: { fontSize: "12px", color: "#666", marginBottom: "8px" },
  previewImg: { width: "120px", height: "80px", objectFit: "cover",
    borderRadius: "8px", border: "1px solid #2a2a2a" },
  formActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" },
  cancelBtn: {
    padding: "10px 24px", backgroundColor: "transparent",
    color: "#888", border: "1px solid #2a2a2a",
    borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer"
  },
  submitBtn: {
    padding: "10px 32px", backgroundColor: "#cc0000", color: "white",
    border: "none", borderRadius: "8px", fontSize: "14px",
    fontWeight: "800", letterSpacing: "1px", cursor: "pointer"
  }
};

export default AdminPage;