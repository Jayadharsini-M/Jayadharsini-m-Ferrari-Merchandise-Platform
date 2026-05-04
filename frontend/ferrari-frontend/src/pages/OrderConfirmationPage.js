import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const OrderConfirmationPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { clearCart } = useCart();

  const { order_id, payment_id, amount, items, paid_at } = location.state || {};

  // Clear cart on successful payment landing
  useEffect(() => {
    if (!order_id) {
      navigate("/");
      return;
    }
    clearCart?.();
  }, []);

  const formattedDate = paid_at
    ? new Date(paid_at).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div style={styles.page} className="page-enter">
      {/* Success Banner */}
      <div style={styles.banner}>
        <div style={styles.checkCircle}>✓</div>
        <h1 style={styles.title}>Payment Confirmed!</h1>
        <p style={styles.subtitle}>
          Your Ferrari merchandise is on its way 🏎️
        </p>
      </div>

      <div style={styles.content}>
        {/* Receipt Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.receiptLabel}>RECEIPT</span>
            <span style={styles.receiptDate}>{formattedDate}</span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailKey}>Order ID</span>
            <span style={styles.detailVal}>
              #{(order_id || "").slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailKey}>Payment ID</span>
            <span style={styles.detailVal}>
              {(payment_id || "SIM_" + Date.now()).slice(0, 20)}
            </span>
          </div>

          <div style={styles.divider} />

          {/* Items */}
          <p style={styles.itemsTitle}>Items Purchased</p>
          {(items || []).map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <div>
                <span style={styles.itemName}>{item.name}</span>
                <span style={styles.itemQty}> × {item.quantity}</span>
              </div>
              <span style={styles.itemPrice}>
                ${parseFloat(item.item_total || 0).toFixed(2)}
              </span>
            </div>
          ))}

          <div style={styles.divider} />

          {/* Total */}
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total Paid</span>
            <span style={styles.totalAmount}>
              ${parseFloat(amount || 0).toFixed(2)}
            </span>
          </div>

          <div style={styles.simulationBadge}>
            ⚠️ Simulated payment — no real charge was made
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            style={styles.ordersBtn}
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </button>
          <button
            style={styles.shopBtn}
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page:           { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  banner:         { textAlign: "center", padding: "60px 24px 40px",
                    borderBottom: "1px solid #1a1a1a" },
  checkCircle:    { width: "72px", height: "72px", borderRadius: "50%",
                    backgroundColor: "#0a2a0a", border: "2px solid #28a745",
                    color: "#28a745", fontSize: "32px", fontWeight: "900",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 20px" },
  title:          { fontSize: "36px", fontWeight: "900", color: "#fff",
                    marginBottom: "10px" },
  subtitle:       { color: "#888", fontSize: "16px" },
  content:        { maxWidth: "560px", margin: "40px auto",
                    padding: "0 24px 60px" },
  card:           { backgroundColor: "#141414", border: "1px solid #2a2a2a",
                    borderRadius: "12px", padding: "32px",
                    marginBottom: "24px" },
  cardHeader:     { display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "20px" },
  receiptLabel:   { fontSize: "10px", letterSpacing: "3px",
                    color: "#cc0000", fontWeight: "800" },
  receiptDate:    { fontSize: "12px", color: "#555" },
  detailRow:      { display: "flex", justifyContent: "space-between",
                    padding: "8px 0" },
  detailKey:      { color: "#666", fontSize: "13px" },
  detailVal:      { color: "#ccc", fontSize: "13px",
                    fontFamily: "monospace" },
  divider:        { borderTop: "1px solid #2a2a2a", margin: "16px 0" },
  itemsTitle:     { color: "#888", fontSize: "11px", letterSpacing: "1px",
                    fontWeight: "700", marginBottom: "12px" },
  itemRow:        { display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "6px 0" },
  itemName:       { color: "#ccc", fontSize: "14px" },
  itemQty:        { color: "#555", fontSize: "13px" },
  itemPrice:      { color: "#fff", fontWeight: "700", fontSize: "14px" },
  totalRow:       { display: "flex", justifyContent: "space-between",
                    alignItems: "center" },
  totalLabel:     { color: "#fff", fontSize: "16px", fontWeight: "700" },
  totalAmount:    { color: "#cc0000", fontSize: "28px", fontWeight: "900" },
  simulationBadge:{ marginTop: "20px", padding: "10px 14px",
                    backgroundColor: "#1a1500", border: "1px solid #3a3000",
                    borderRadius: "8px", color: "#c9a84c",
                    fontSize: "11px", textAlign: "center" },
  actions:        { display: "flex", gap: "12px" },
  ordersBtn:      { flex: 1, padding: "14px", backgroundColor: "transparent",
                    border: "1px solid #cc0000", color: "#cc0000",
                    borderRadius: "8px", fontSize: "14px",
                    fontWeight: "700", cursor: "pointer" },
  shopBtn:        { flex: 1, padding: "14px", backgroundColor: "#cc0000",
                    border: "none", color: "#fff", borderRadius: "8px",
                    fontSize: "14px", fontWeight: "700", cursor: "pointer" },
};

export default OrderConfirmationPage;