import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import PaymentPage           from "./pages/PaymentPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";

function App() {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/"       element={<ProductsPage />} />
          <Route path="/cart"   element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin"  element={<AdminPage />} />
          <Route path="/payment"            element={<PaymentPage />} />
<Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;