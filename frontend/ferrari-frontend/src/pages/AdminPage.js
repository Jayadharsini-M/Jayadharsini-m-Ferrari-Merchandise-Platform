import React, { useEffect, useState, useCallback } from "react";
import { getAllProducts, createProduct, updateProduct, deleteProduct, configureFlashSale } from "../services/api";
import { useCart } from "../context/CartContext";
 
const emptyForm = {
  name: "", description: "", price: "", stock: "",
  image_url: "", category: "",
  is_flash_sale: false, drop_end_time: "", flash_label: ""
};
 
const Field = ({ label, field, type = "text", placeholder, rows, value, onChange, error }) => (
  <div style={fieldStyles.wrapper}>
    <label style={fieldStyles.label}>{label}</label>
    {rows ? (
      <textarea value={value} onChange={e => onChange(field, e.target.value)} placeholder={placeholder} rows={rows}
        style={{ ...fieldStyles.input, borderColor: error ? "#cc0000" : "#2a2a2a", resize: "vertical" }} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(field, e.target.value)} placeholder={placeholder}
        style={{ ...fieldStyles.input, borderColor: error ? "#cc0000" : "#2a2a2a" }} />
    )}
    {error && <span style={fieldStyles.errorText}>{error}</span>}
  </div>
);
 
const fieldStyles = {
  wrapper:   { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "4px" },
  label:     { fontSize: "11px", fontWeight: "700", color: "#888", letterSpacing: "1px", textTransform: "uppercase" },
  input:     { backgroundColor: "#0d0d0d", color: "#fff", border: "1px solid #2a2a2a",
               borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
               transition: "border-color 0.2s", width: "100%", fontFamily: "inherit" },
  errorText: { fontSize: "11px", color: "#cc0000" }
};
 
const AdminPage = () => {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [errors, setErrors]             = useState({});
  const [view, setView]                 = useState("list");
  const [flashTab, setFlashTab]         = useState(null);
  const [flashForm, setFlashForm]       = useState({ is_flash_sale: false, drop_end_time: "", flash_label: "", stock: "" });
  const [flashLoading, setFlashLoading] = useState(false);
  const { showToast } = useCart();
 
  const fetchProducts = useCallback(() => {
    setLoading(true);
    getAllProducts()
      .then(res => setProducts(res.data.products || []))
      .catch(() => showToast("Failed to load products", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);
 
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
 
  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);
 
  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = "Enter a valid price";
    if (form.stock === "" || isNaN(form.stock) || Number(form.stock) < 0) e.stock = "Enter a valid stock number";
    if (!form.image_url.trim())   e.image_url = "Image URL is required";
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
        showToast("Product updated!", "success");
      } else {
        await createProduct(payload);
        showToast("Product created!", "success");
      }
      setForm(emptyForm); setEditId(null); setErrors({}); setView("list");
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    }
    setFormLoading(false);
  };
 
  const handleEdit = (product) => {
    setForm({
      name: product.name || "", description: product.description || "",
      price: String(product.price || ""), stock: String(product.stock || ""),
      image_url: product.image_url || "", category: product.category || "",
      is_flash_sale: false, drop_end_time: "", flash_label: ""
    });
    setEditId(product.product_id); setErrors({}); setView("form");
  };
 
  const handleDelete = async (productId, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(productId);
      showToast("Product deleted", "success");
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };
 
  const handleNewProduct = () => {
    setForm(emptyForm); setEditId(null); setErrors({}); setView("form");
  };
 
  const openFlashConfig = (product) => {
    setFlashTab(product.product_id);
    setFlashForm({
      is_flash_sale: product.is_flash_sale || false,
      drop_end_time: product.drop_end_time || "",
      flash_label:   product.flash_label   || "LIMITED DROP",
      stock:         String(product.stock  || "")
    });
    setView("flash");
  };
 
  const handleFlashSave = async () => {
    if (!flashForm.drop_end_time && flashForm.is_flash_sale) {
      showToast("Drop end time is required for flash sales", "error"); return;
    }
    setFlashLoading(true);
    try {
      await configureFlashSale(flashTab, {
        is_flash_sale: flashForm.is_flash_sale,
        drop_end_time: flashForm.drop_end_time,
        flash_label:   flashForm.flash_label.trim() || "LIMITED DROP",
        stock:         parseInt(flashForm.stock) || 0
      });
      showToast("Flash sale configured! 🏎️", "success");
      setView("list"); setFlashTab(null); fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save flash config", "error");
    }
    setFlashLoading(false);
  };
 
  // ── NEW: Remove drop ──────────────────────────────────
  const handleRemoveDrop = async () => {
    if (!window.confirm("Remove this item from drops?")) return;
    setFlashLoading(true);
    try {
      await configureFlashSale(flashTab, {
        is_flash_sale: false,
        drop_end_time: "",
        flash_label:   "",
        stock:         parseInt(flashForm.stock) || 0
      });
      showToast("Drop removed successfully", "success");
      setView("list"); setFlashTab(null); fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove drop", "error");
    }
    setFlashLoading(false);
  };
 
  return (
    <div style={styles.page} className="page-enter">
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
          <div style={styles.stat}>
            <span style={styles.statNum}>{products.filter(p => p.is_flash_sale).length}</span>
            <span style={styles.statLabel}>Active Drops</span>
          </div>
        </div>
      </div>
 
      <div style={styles.content}>
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(view === "list" ? styles.tabActive : {}) }} onClick={() => setView("list")}>
            📦 All Products
          </button>
          <button style={{ ...styles.tab, ...(view === "form" ? styles.tabActive : {}) }} onClick={handleNewProduct}>
            ➕ {editId ? "Edit Product" : "Add Product"}
          </button>
          {view === "flash" && (
            <button style={{ ...styles.tab, ...styles.tabFlash }}>⚡ Flash Config</button>
          )}
        </div>
 
        {/* Product List */}
        {view === "list" && (
          <div style={styles.section}>
            {loading ? <div className="spinner" /> : products.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: "40px", marginBottom: "12px" }}>📦</p>
                <p style={{ color: "#888" }}>No products yet.</p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Image","Name","Price","Stock","Drop","Actions"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.product_id} style={styles.tr}>
                        <td style={styles.td}>
                          <img src={p.image_url} alt={p.name} style={styles.thumbnail}
                            onError={e => { e.target.src = "https://placehold.co/50x50/1a1a1a/cc0000?text=F1"; }} />
                        </td>
                        <td style={styles.td}>
                          <strong style={{ color: "#fff" }}>{p.name}</strong><br />
                          <span style={{ fontSize: "12px", color: "#555" }}>{(p.description || "").slice(0, 50)}...</span>
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
                        <td style={styles.td}>
                          {p.is_flash_sale
                            ? <span style={styles.dropBadge}>⚡ LIVE</span>
                            : <span style={{ color: "#444", fontSize: "12px" }}>—</span>}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionBtns}>
                            <button onClick={() => handleEdit(p)} style={styles.editBtn}>Edit</button>
                            <button onClick={() => openFlashConfig(p)} style={styles.flashBtn}>⚡ Drop</button>
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
            <h2 style={styles.formTitle}>{editId ? "✏️ Edit Product" : "➕ New Product"}</h2>
            <div style={styles.notice}>
              ⚠️ <strong>Image URL must be a web link</strong> — use{" "}
              <a href="https://imgur.com" target="_blank" rel="noreferrer" style={{ color: "#cc0000" }}>imgur.com</a> to host images.
            </div>
            <div style={styles.formGrid}>
              <Field label="Product Name *"  field="name"     placeholder="e.g. Ferrari Cap"   value={form.name}     onChange={handleFieldChange} error={errors.name} />
              <Field label="Category"        field="category" placeholder="e.g. Apparel"        value={form.category} onChange={handleFieldChange} error={errors.category} />
              <Field label="Price ($) *"     field="price"    type="number" placeholder="49.99" value={form.price}    onChange={handleFieldChange} error={errors.price} />
              <Field label="Stock *"         field="stock"    type="number" placeholder="100"   value={form.stock}    onChange={handleFieldChange} error={errors.stock} />
            </div>
            <Field label="Image URL *" field="image_url" placeholder="https://i.imgur.com/..."
              value={form.image_url} onChange={handleFieldChange} error={errors.image_url} />
            <div style={{ marginTop: "16px" }}>
              <Field label="Description *" field="description" placeholder="Describe the product..." rows={3}
                value={form.description} onChange={handleFieldChange} error={errors.description} />
            </div>
            {form.image_url && form.image_url.startsWith("http") && (
              <div style={styles.preview}>
                <p style={styles.previewLabel}>Preview:</p>
                <img src={form.image_url} alt="preview" style={styles.previewImg}
                  onError={e => { e.target.style.display = "none"; }} />
              </div>
            )}
            <div style={styles.formActions}>
              <button onClick={() => { setView("list"); setForm(emptyForm); setEditId(null); setErrors({}); }} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSubmit} style={styles.submitBtn} disabled={formLoading}>
                {formLoading ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        )}
 
        {/* Flash Sale Config */}
        {view === "flash" && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>⚡ Configure Flash Drop</h2>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "24px" }}>
              {products.find(p => p.product_id === flashTab)?.name}
            </p>
 
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Enable Flash Sale</span>
              <button
                onClick={() => setFlashForm(prev => ({ ...prev, is_flash_sale: !prev.is_flash_sale }))}
                style={{ ...styles.toggleBtn, ...(flashForm.is_flash_sale ? styles.toggleOn : styles.toggleOff) }}>
                {flashForm.is_flash_sale ? "ON" : "OFF"}
              </button>
            </div>
 
            {flashForm.is_flash_sale && (
              <div style={styles.formGrid}>
                <div style={fieldStyles.wrapper}>
                  <label style={fieldStyles.label}>Drop End Time *</label>
                  <input type="datetime-local"
                    value={flashForm.drop_end_time ? flashForm.drop_end_time.slice(0, 16) : ""}
                    onChange={e => setFlashForm(prev => ({ ...prev, drop_end_time: new Date(e.target.value).toISOString() }))}
                    style={fieldStyles.input} />
                </div>
                <div style={fieldStyles.wrapper}>
                  <label style={fieldStyles.label}>Flash Label</label>
                  <input type="text" value={flashForm.flash_label}
                    onChange={e => setFlashForm(prev => ({ ...prev, flash_label: e.target.value }))}
                    placeholder="e.g. EXCLUSIVE DROP" style={fieldStyles.input} />
                </div>
                <div style={fieldStyles.wrapper}>
                  <label style={fieldStyles.label}>Flash Stock (limited units)</label>
                  <input type="number" value={flashForm.stock}
                    onChange={e => setFlashForm(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="e.g. 10" style={fieldStyles.input} />
                </div>
              </div>
            )}
 
            <div style={styles.formActions}>
              <button onClick={() => { setView("list"); setFlashTab(null); }} style={styles.cancelBtn}>Cancel</button>
              {/* ── NEW: Remove Drop button (only if currently live) ── */}
              {products.find(p => p.product_id === flashTab)?.is_flash_sale && (
                <button onClick={handleRemoveDrop} style={styles.removeDropBtn} disabled={flashLoading}>
                  {flashLoading ? "Removing..." : "🗑 Remove Drop"}
                </button>
              )}
              <button onClick={handleFlashSave} style={styles.submitBtn} disabled={flashLoading}>
                {flashLoading ? "Saving..." : "Save Flash Config"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 
const styles = {
  page:        { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center",
                 padding: "40px 32px 24px", borderBottom: "1px solid #1a1a1a" },
  headerSub:   { fontSize: "11px", letterSpacing: "4px", color: "#cc0000", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" },
  headerTitle: { fontSize: "32px", fontWeight: "900", color: "#fff" },
  red:         { color: "#cc0000" },
  headerStats: { display: "flex", gap: "32px" },
  stat:        { textAlign: "center" },
  statNum:     { display: "block", fontSize: "32px", fontWeight: "900", color: "#cc0000" },
  statLabel:   { fontSize: "11px", color: "#666", letterSpacing: "1px", textTransform: "uppercase" },
  content:     { padding: "24px 32px" },
  tabs:        { display: "flex", gap: "8px", marginBottom: "24px" },
  tab:         { padding: "10px 20px", backgroundColor: "#141414", color: "#888", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  tabActive:   { backgroundColor: "#cc0000", color: "#fff", borderColor: "#cc0000" },
  tabFlash:    { backgroundColor: "#1a0d00", color: "#c9a84c", borderColor: "#c9a84c" },
  section:     { overflowX: "auto" },
  tableWrapper:{ overflowX: "auto" },
  table:       { width: "100%", borderCollapse: "collapse" },
  th:          { padding: "12px 16px", textAlign: "left", fontSize: "11px", letterSpacing: "1px", color: "#666", borderBottom: "1px solid #2a2a2a", textTransform: "uppercase" },
  tr:          { borderBottom: "1px solid #1a1a1a" },
  td:          { padding: "14px 16px", fontSize: "13px", color: "#ccc", verticalAlign: "middle" },
  thumbnail:   { width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid #2a2a2a" },
  stockBadge:  { padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" },
  dropBadge:   { padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", backgroundColor: "#2a0000", color: "#cc0000", letterSpacing: "1px" },
  actionBtns:  { display: "flex", gap: "6px" },
  editBtn:     { padding: "6px 12px", backgroundColor: "transparent", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  flashBtn:    { padding: "6px 12px", backgroundColor: "transparent", color: "#cc0000", border: "1px solid #cc0000", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  deleteBtn:   { padding: "6px 12px", backgroundColor: "transparent", color: "#555", border: "1px solid #333", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  empty:       { textAlign: "center", padding: "60px 24px" },
  formCard:    { backgroundColor: "#141414", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "32px", maxWidth: "800px" },
  formTitle:   { fontSize: "20px", fontWeight: "800", color: "#fff", marginBottom: "16px" },
  notice:      { backgroundColor: "#1a1000", border: "1px solid #c9a84c", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#c9a84c", marginBottom: "20px", lineHeight: "1.5" },
  formGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  preview:     { marginTop: "16px", marginBottom: "8px" },
  previewLabel:{ fontSize: "12px", color: "#666", marginBottom: "8px" },
  previewImg:  { width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #2a2a2a" },
  formActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" },
  cancelBtn:   { padding: "10px 24px", backgroundColor: "transparent", color: "#888", border: "1px solid #2a2a2a", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  submitBtn:   { padding: "10px 32px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "800", letterSpacing: "1px", cursor: "pointer" },
  removeDropBtn: { padding: "10px 24px", backgroundColor: "transparent", color: "#ff4444", border: "1px solid #ff4444", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
  toggleRow:   { display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" },
  toggleLabel: { fontSize: "13px", color: "#ccc", fontWeight: "600" },
  toggleBtn:   { padding: "8px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: "800", letterSpacing: "2px", cursor: "pointer", border: "none" },
  toggleOn:    { backgroundColor: "#cc0000", color: "#fff" },
  toggleOff:   { backgroundColor: "#2a2a2a", color: "#555" }
};
 
export default AdminPage;