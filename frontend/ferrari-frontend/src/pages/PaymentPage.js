import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { processPayment } from "../services/api";
import { useCart } from "../context/CartContext";

const USER_ID = "user_001";

const PaymentPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { showToast, clearCart } = useCart();

  // Order info passed from CartPage via navigate state
  const { order_id, order_total, items } = location.state || {};

  const [cardNumber, setCardNumber]   = useState("");
  const [expiry, setExpiry]           = useState("");
  const [cvv, setCvv]                 = useState("");
  const [cardName, setCardName]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [cardType, setCardType]       = useState("");

  // Redirect if no order info
  useEffect(() => {
    if (!order_id) navigate("/cart");
  }, [order_id, navigate]);

  // Detect card type from number
  useEffect(() => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.startsWith("4"))       setCardType("VISA");
    else if (num.startsWith("5"))  setCardType("MASTERCARD");
    else if (num.startsWith("34") || num.startsWith("37")) setCardType("AMEX");
    else                           setCardType("");
  }, [cardNumber]);

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handlePay = async () => {
    const digits = cardNumber.replace(/\s/g, "");

    // Basic frontend validation
    if (!cardName.trim()) {
      showToast("Please enter cardholder name", "error"); return;
    }
    if (digits.length < 16) {
      showToast("Please enter a valid 16-digit card number", "error"); return;
    }
    if (expiry.length < 5) {
      showToast("Please enter a valid expiry date", "error"); return;
    }
    if (cvv.length < 3) {
      showToast("Please enter a valid CVV", "error"); return;
    }

    setLoading(true);
    try {
      // Simulate Stripe token (in production, use Stripe.js to generate real token)
      const simulatedToken = `tok_simulated_${Date.now()}`;

      const res = await processPayment({
        user_id:      USER_ID,
        order_id:     order_id,
        stripe_token: simulatedToken,
        amount:       order_total,
      });

      const data = res.data;

      if (data.success) {
        showToast("Payment successful! 🏎️", "success");
        navigate("/order-confirmation", {
          state: {
            order_id:   order_id,
            payment_id: data.payment_id,
            amount:     order_total,
            items:      items,
            paid_at:    data.paid_at,
          },
        });
      } else {
        showToast(data.message || "Payment failed", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Payment failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <p style={styles.headerSub}>CHECKOUT</p>
        <h1 style={styles.headerTitle}>
          Secure <span style={styles.red}>Payment</span>
        </h1>
      </div>

      <div style={styles.layout}>
        {/* ── Left: Card Form ── */}
        <div style={styles.formCard}>

          {/* Card Preview */}
          <div style={styles.cardPreview}>
            <div style={styles.cardTop}>
              <span style={styles.cardChip}>▬▬</span>
              <span style={styles.cardTypeLabel}>{cardType}</span>
            </div>
            <div style={styles.cardNumber}>
              {cardNumber || "•••• •••• •••• ••••"}
            </div>
            <div style={styles.cardBottom}>
              <div>
                <div style={styles.cardLabel}>CARD HOLDER</div>
                <div style={styles.cardValue}>{cardName || "YOUR NAME"}</div>
              </div>
              <div>
                <div style={styles.cardLabel}>EXPIRES</div>
                <div style={styles.cardValue}>{expiry || "MM/YY"}</div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div style={styles.field}>
            <label style={styles.label}>Cardholder Name</label>
            <input
              style={styles.input}
              placeholder="John Ferrari"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Card Number</label>
            <input
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Expiry Date</label>
              <input
                style={styles.input}
                placeholder="MM/YY"
                value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>CVV</label>
              <input
                style={styles.input}
                placeholder="123"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                type="password"
              />
            </div>
          </div>

          <div style={styles.secureNote}>
            🔒 Your payment is encrypted and secure
          </div>

          <button
            style={{ ...styles.payBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay $${parseFloat(order_total || 0).toFixed(2)}`}
          </button>
        </div>

        {/* ── Right: Order Summary ── */}
        <div style={styles.summary}>
          <h2 style={styles.summaryTitle}>Order Summary</h2>
          <p style={styles.orderId}>
            Order #{(order_id || "").slice(0, 8).toUpperCase()}
          </p>

          <div style={styles.itemsList}>
            {(items || []).map((item, i) => (
              <div key={i} style={styles.summaryItem}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={styles.itemQty}>× {item.quantity}</span>
                </div>
                <span style={styles.itemTotal}>
                  ${parseFloat(item.item_total || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total</span>
            <span style={styles.totalAmount}>
              ${parseFloat(order_total || 0).toFixed(2)}
            </span>
          </div>

          <div style={styles.simulationNote}>
            ⚠️ Simulation Mode — no real charge is made
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page:          { minHeight: "100vh", backgroundColor: "#0a0a0a" },
  header:        { textAlign: "center", padding: "50px 24px 30px" },
  headerSub:     { fontSize: "11px", letterSpacing: "4px", color: "#cc0000",
                   fontWeight: "700", marginBottom: "10px" },
  headerTitle:   { fontSize: "36px", fontWeight: "900", color: "#fff" },
  red:           { color: "#cc0000" },
  layout:        { display: "flex", gap: "32px", maxWidth: "960px",
                   margin: "0 auto", padding: "0 32px 60px",
                   flexWrap: "wrap" },

  // Card form
  formCard:      { flex: "1 1 400px", backgroundColor: "#141414",
                   border: "1px solid #2a2a2a", borderRadius: "12px",
                   padding: "32px" },

  // Card preview widget
  cardPreview:   { background: "linear-gradient(135deg, #cc0000, #880000)",
                   borderRadius: "12px", padding: "24px",
                   marginBottom: "28px", minHeight: "160px",
                   display: "flex", flexDirection: "column",
                   justifyContent: "space-between" },
  cardTop:       { display: "flex", justifyContent: "space-between",
                   alignItems: "center" },
  cardChip:      { color: "#ffd700", fontSize: "18px", letterSpacing: "2px" },
  cardTypeLabel: { color: "#fff", fontWeight: "900", fontSize: "14px",
                   letterSpacing: "2px" },
  cardNumber:    { color: "#fff", fontSize: "20px", letterSpacing: "4px",
                   fontFamily: "monospace", margin: "16px 0" },
  cardBottom:    { display: "flex", justifyContent: "space-between" },
  cardLabel:     { fontSize: "9px", color: "rgba(255,255,255,0.6)",
                   letterSpacing: "1px", marginBottom: "2px" },
  cardValue:     { fontSize: "13px", color: "#fff", fontWeight: "700" },

  // Form
  field:         { marginBottom: "18px" },
  label:         { display: "block", fontSize: "11px", letterSpacing: "1px",
                   color: "#888", marginBottom: "8px", fontWeight: "700" },
  input:         { width: "100%", backgroundColor: "#0a0a0a",
                   border: "1px solid #2a2a2a", borderRadius: "8px",
                   padding: "12px 14px", color: "#fff", fontSize: "15px",
                   outline: "none", boxSizing: "border-box",
                   transition: "border 0.2s" },
  row:           { display: "flex", gap: "16px" },
  secureNote:    { fontSize: "12px", color: "#555", textAlign: "center",
                   margin: "16px 0" },
  payBtn:        { width: "100%", padding: "16px", backgroundColor: "#cc0000",
                   color: "#fff", border: "none", borderRadius: "8px",
                   fontSize: "16px", fontWeight: "900", cursor: "pointer",
                   letterSpacing: "1px", transition: "opacity 0.2s" },

  // Summary panel
  summary:       { flex: "1 1 280px", backgroundColor: "#141414",
                   border: "1px solid #2a2a2a", borderRadius: "12px",
                   padding: "32px", height: "fit-content" },
  summaryTitle:  { color: "#fff", fontSize: "18px", fontWeight: "800",
                   marginBottom: "8px" },
  orderId:       { color: "#555", fontSize: "12px", marginBottom: "24px" },
  itemsList:     { display: "flex", flexDirection: "column", gap: "12px" },
  summaryItem:   { display: "flex", justifyContent: "space-between",
                   alignItems: "center" },
  itemInfo:      { display: "flex", flexDirection: "column" },
  itemName:      { color: "#ccc", fontSize: "14px" },
  itemQty:       { color: "#555", fontSize: "12px" },
  itemTotal:     { color: "#fff", fontWeight: "700", fontSize: "14px" },
  divider:       { borderTop: "1px solid #2a2a2a", margin: "20px 0" },
  totalRow:      { display: "flex", justifyContent: "space-between",
                   alignItems: "center" },
  totalLabel:    { color: "#888", fontSize: "14px", fontWeight: "700" },
  totalAmount:   { color: "#cc0000", fontSize: "24px", fontWeight: "900" },
  simulationNote:{ marginTop: "20px", padding: "10px 14px",
                   backgroundColor: "#1a1500", border: "1px solid #3a3000",
                   borderRadius: "8px", color: "#c9a84c",
                   fontSize: "11px", textAlign: "center" },
};

export default PaymentPage;