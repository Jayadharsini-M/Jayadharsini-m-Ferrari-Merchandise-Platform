import React, { useEffect, useState } from "react";
import {
  getCart,
  removeFromCart,
  clearCart,
  placeOrder
} from "../services/api";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const USER_ID = "user_001";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const { setCartCount, showToast } = useCart();
  const navigate = useNavigate(); // ✅ FIXED (must be inside component)

  const fetchCart = () => {
    setLoading(true);
    getCart(USER_ID)
      .then(res => {
        setCart(res.data);
        setCartCount(res.data.item_count || 0);
      })
      .catch(() =>
        setCart({ items: [], cart_total: 0, item_count: 0 })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(USER_ID, productId);
      showToast("Item removed from cart", "success");
      fetchCart();
    } catch {
      showToast("Failed to remove item", "error");
    }
  };

  const handleClear = async () => {
    try {
      await clearCart(USER_ID);
      setCartCount(0);
      showToast("Cart cleared", "success");
      fetchCart();
    } catch {
      showToast("Failed to clear cart", "error");
    }
  };

  // ✅ FIXED: Checkout → Place Order → Navigate to Payment
  const handleCheckout = async () => {
    try {
      setLoading(true);

      const res = await placeOrder(USER_ID);
      const data = res.data;

      if (data.success) {
        showToast("Order placed! Proceeding to payment...", "success");

        // update UI state
        setCartCount(0);
        fetchCart();

        // navigate to payment page with order data
        navigate("/payment", {
          state: {
            order_id: data.order_id,
            order_total: data.order_total,
            items: data.items,
            user_id: USER_ID
          }
        });
      } else {
        showToast(data.message || "Checkout failed", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Checkout failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <div className="spinner" />
      </div>
    );

  const items = cart?.items || [];

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <p style={styles.headerSub}>SHOPPING</p>
        <h1 style={styles.headerTitle}>
          Your <span style={styles.red}>Cart</span>
        </h1>
      </div>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</p>
          <p style={{ color: "#888", marginBottom: "24px" }}>
            Your cart is empty
          </p>
          <button onClick={() => navigate("/")} style={styles.shopBtn}>
            Browse Products
          </button>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map(item => (
                  <tr key={item.product_id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{item.name}</strong>
                    </td>

                    <td style={styles.td}>
                      ${item.price.toFixed(2)}
                    </td>

                    <td style={styles.td}>
                      {item.quantity}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        color: "#cc0000",
                        fontWeight: "700"
                      }}
                    >
                      ${item.total_price.toFixed(2)}
                    </td>

                    <td style={styles.td}>
                      <button
                        onClick={() => handleRemove(item.product_id)}
                        style={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.summary}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryRow}>
                <span style={{ color: "#888" }}>Items</span>
                <span>{cart.item_count}</span>
              </div>

              <div style={styles.summaryRow}>
                <span style={{ color: "#888" }}>Subtotal</span>
                <span style={styles.totalAmt}>
                  ${cart.cart_total?.toFixed(2)}
                </span>
              </div>

              <div style={styles.divider} />

              <button onClick={handleCheckout} style={styles.orderBtn}>
                Checkout & Pay 🏎️
              </button>

              <button onClick={handleClear} style={styles.clearBtn}>
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  header: { textAlign: "center", padding: "50px 24px 30px" },
  headerSub: {
    fontSize: "11px",
    letterSpacing: "4px",
    color: "#cc0000",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: "10px"
  },
  headerTitle: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#fff"
  },
  red: { color: "#cc0000" },
  content: {
    display: "flex",
    gap: "32px",
    padding: "0 32px 40px",
    flexWrap: "wrap"
  },
  tableWrapper: { flex: 1, overflowX: "auto", minWidth: "300px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "11px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#666",
    borderBottom: "1px solid #2a2a2a"
  },
  tr: {
    borderBottom: "1px solid #1a1a1a",
    transition: "background 0.15s"
  },
  td: { padding: "16px", fontSize: "14px", color: "#ccc" },
  removeBtn: {
    padding: "6px 14px",
    backgroundColor: "transparent",
    color: "#cc0000",
    border: "1px solid #cc0000",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: "600"
  },
  summary: { width: "280px" },
  summaryCard: {
    backgroundColor: "#141414",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "24px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "14px",
    fontSize: "14px"
  },
  totalAmt: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#cc0000"
  },
  divider: { borderTop: "1px solid #2a2a2a", margin: "16px 0" },
  orderBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#cc0000",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "800",
    fontSize: "14px",
    letterSpacing: "1px",
    marginBottom: "10px"
  },
  clearBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "transparent",
    color: "#666",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    fontSize: "13px"
  },
  empty: { textAlign: "center", padding: "80px 24px" },
  shopBtn: {
    padding: "12px 32px",
    backgroundColor: "#cc0000",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "14px"
  }
};

export default CartPage;