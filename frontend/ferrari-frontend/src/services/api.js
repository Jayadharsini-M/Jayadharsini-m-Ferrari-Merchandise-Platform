import axios from "axios";

// ✅ /v1 added — all routes automatically versioned
const BASE_URL = "https://cx4u0cff8i.execute-api.ap-southeast-1.amazonaws.com/v1";
const api = axios.create({ baseURL: BASE_URL });

// ─── PRODUCTS ─────────────────────────────────────────
export const getAllProducts  = () => api.get("/products");
export const getProduct      = (id) => api.get(`/products/${id}`);
export const createProduct   = (body) => api.post("/products", body);
export const updateProduct   = (id, body) => api.put(`/products/${id}`, body);
export const deleteProduct   = (id) => api.delete(`/products/${id}`);

// ─── SEARCH ───────────────────────────────────────────
export const searchProducts = (keyword, minPrice, maxPrice) => {
  const params = new URLSearchParams();
  if (keyword)  params.append("q", keyword);
  if (minPrice) params.append("min_price", minPrice);
  if (maxPrice) params.append("max_price", maxPrice);
  return api.get(`/search?${params.toString()}`);
};

// ─── CART ─────────────────────────────────────────────
export const getCart        = (userId) => api.get(`/cart/${userId}`);
export const addToCart      = (userId, productId, quantity) =>
  api.post("/cart", { user_id: userId, product_id: productId, quantity });
export const removeFromCart = (userId, productId) =>
  api.delete(`/cart/${userId}/${productId}`);
export const clearCart      = (userId) => api.delete(`/cart/${userId}`);

// ─── ORDERS ───────────────────────────────────────────
export const placeOrder = (userId) =>
  api.post("/order", { user_id: userId });

export const cancelOrder = (orderId, userId) =>
  api.post("/cancel-order", {
    order_id: orderId,
    user_id: userId
  });

export const getUserOrders = (userId) =>
  api.get(`/orders/${encodeURIComponent(userId)}`);

export const getOrder = (orderId, userId) =>
  api.get(`/order/${orderId}?user_id=${encodeURIComponent(userId)}`);

// ─── PAYMENT ──────────────────────────────────────────
export const processPayment = (body) =>
  api.post("/payment", body);