import React, { useEffect, useState } from "react";
import { getUserOrders, cancelOrder } from "../services/api";
import { useCart } from "../context/CartContext";

const USER_ID = "user_001";

const statusColors = {
  confirmed: "#cc0000",
  cancelled: "#444",
  delivered: "#28a745",
  processing: "#c9a84c"
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const { showToast } = useCart();

  const fetchOrders = () => {
    setLoading(true);
    getUserOrders(USER_ID)
      .then(res => setOrders(res.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId) => {
    try {
      await cancelOrder(orderId, USER_ID);
      showToast("Order cancelled successfully", "success");
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || "Cancel failed", "error");
    }
  };

  if (loading) return <div style={styles.page}><div className="spinner" /></div>;

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <p style={styles.headerSub}>HISTORY</p>
        <h1 style={styles.headerTitle}>My <span style={styles.red}>Orders</span></h1>
      </div>

      <div style={styles.content}>
        {orders.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>📦</p>
            <p style={{ color: "#888" }}>No orders yet. Start shopping! 🏎️</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.order_id} style={styles.card}>
              <div style={styles.cardHeader}
                onClick={() => setExpanded(expanded === order.order_id ? null : order.order_id)}>
                <div style={styles.orderMeta}>
                  <span style={styles.orderId}>#{order.order_id.slice(0, 8).toUpperCase()}</span>
                  <span style={styles.orderDate}>
                    📅 {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.orderRight}>
                  <span style={{ ...styles.statusBadge,
                    backgroundColor: statusColors[order.status] || "#444" }}>
                    {order.status.toUpperCase()}
                  </span>
                  <span style={styles.orderTotal}>
                    ${parseFloat(order.order_total || 0).toFixed(2)}
                  </span>
                  <span style={styles.expandIcon}>
                    {expanded === order.order_id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {expanded === order.order_id && (
                <div style={styles.cardBody}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Item","Qty","Price","Total"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>{item.name}</td>
                          <td style={styles.td}>{item.quantity}</td>
                          <td style={styles.td}>${item.price?.toFixed(2)}</td>
                          <td style={{ ...styles.td, color: "#cc0000", fontWeight: "700" }}>
                            ${item.item_total?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {order.status === "confirmed" && (
                    <button onClick={() => handleCancel(order.order_id)}
                      style={styles.cancelBtn}>
                      Cancel Order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  header: { textAlign: "center", padding: "50px 24px 30px" },
  headerSub: { fontSize: "11px", letterSpacing: "4px", color: "#cc0000",
    fontWeight: "700", textTransform: "uppercase", marginBottom: "10px" },
  headerTitle: { fontSize: "36px", fontWeight: "900", color: "#fff" },
  red: { color: "#cc0000" },
  content: { padding: "0 32px 40px", maxWidth: "900px", margin: "0 auto" },
  empty: { textAlign: "center", padding: "80px 24px" },
  card: { backgroundColor: "#141414", border: "1px solid #2a2a2a",
    borderRadius: "10px", marginBottom: "16px", overflow: "hidden" },
  cardHeader: { display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "20px 24px",
    cursor: "pointer", transition: "background 0.15s" },
  orderMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  orderId: { fontSize: "14px", fontWeight: "700", color: "#fff" },
  orderDate: { fontSize: "12px", color: "#666" },
  orderRight: { display: "flex", alignItems: "center", gap: "16px" },
  statusBadge: { padding: "4px 12px", borderRadius: "12px",
    fontSize: "10px", fontWeight: "800", letterSpacing: "1px", color: "#fff" },
  orderTotal: { fontSize: "18px", fontWeight: "800", color: "#cc0000" },
  expandIcon: { color: "#666", fontSize: "12px" },
  cardBody: { borderTop: "1px solid #2a2a2a", padding: "20px 24px" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "16px" },
  th: { padding: "10px 12px", textAlign: "left", fontSize: "11px",
    letterSpacing: "1px", color: "#666", borderBottom: "1px solid #2a2a2a" },
  tr: { borderBottom: "1px solid #1a1a1a" },
  td: { padding: "12px", fontSize: "14px", color: "#ccc" },
  cancelBtn: { padding: "8px 20px", backgroundColor: "transparent",
    color: "#cc0000", border: "1px solid #cc0000",
    borderRadius: "6px", fontSize: "13px", fontWeight: "700" }
};

export default OrdersPage;