import React, { useState } from "react";
import { addToCart } from "../services/api";
import { useCart } from "../context/CartContext";

const USER_ID = "user_001";

const ProductCard = ({ product }) => {
  const { setCartCount, showToast } = useCart();
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await addToCart(USER_ID, product.product_id, 1);
      setCartCount(prev => prev + 1);
      showToast(`${product.name} added to cart!`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add to cart", "error");
    }
    setLoading(false);
  };

  return (
    <div
      style={{ ...styles.card, ...(hovered ? styles.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.imageWrapper}>
        <img
          src={product.image_url}
          alt={product.name}
          style={styles.image}
          onError={e => { e.target.src = e.target.src = "https://placehold.co/300x200/1a1a1a/cc0000?text=Ferrari"; }}
        />
        {product.stock === 0 && <div style={styles.outOfStockBadge}>Out of Stock</div>}
        {product.stock > 0 && product.stock <= 5 && (
          <div style={styles.lowStockBadge}>Only {product.stock} left</div>
        )}
      </div>
      <div style={styles.body}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.desc}>{product.description}</p>
        <div style={styles.footer}>
          <span style={styles.price}>${parseFloat(product.price).toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            style={{
              ...styles.button,
              ...(product.stock === 0 ? styles.buttonDisabled : {}),
              ...(loading ? styles.buttonLoading : {})
            }}
            disabled={product.stock === 0 || loading}
          >
            {loading ? "Adding..." : product.stock === 0 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "10px", overflow: "hidden",
    transition: "all 0.2s ease", width: "280px"
  },
  cardHover: {
    border: "1px solid #cc0000",
    boxShadow: "0 8px 32px rgba(204,0,0,0.15)",
    transform: "translateY(-2px)"
  },
  imageWrapper: { position: "relative", overflow: "hidden" },
  image: { width: "100%", height: "180px", objectFit: "cover", display: "block" },
  outOfStockBadge: {
    position: "absolute", top: "10px", right: "10px",
    backgroundColor: "#333", color: "#aaa",
    padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600"
  },
  lowStockBadge: {
    position: "absolute", top: "10px", right: "10px",
    backgroundColor: "#cc0000", color: "white",
    padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600"
  },
  body: { padding: "16px" },
  name: { fontSize: "15px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" },
  desc: { fontSize: "12px", color: "#888", marginBottom: "16px", lineHeight: "1.5",
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: "20px", fontWeight: "800", color: "#cc0000" },
  button: {
    backgroundColor: "#cc0000", color: "white", border: "none",
    padding: "8px 16px", borderRadius: "6px", fontSize: "12px",
    fontWeight: "700", letterSpacing: "0.5px"
  },
  buttonDisabled: { backgroundColor: "#333", color: "#666", cursor: "not-allowed" },
  buttonLoading: { backgroundColor: "#990000", cursor: "wait" }
};

export default ProductCard;