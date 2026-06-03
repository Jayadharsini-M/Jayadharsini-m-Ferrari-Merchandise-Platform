import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import PaymentPage from "./pages/PaymentPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import DropsPage from "./pages/DropsPage";
import LoginPage from "./pages/LoginPage";
 
const ProtectedRoute = ({ element, allowedRoles }) => {
  const role = localStorage.getItem("role");
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return element;
};
 
function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));
 
  const handleLogin = (newRole) => {
    localStorage.setItem("role", newRole);
    setRole(newRole);
  };
 
  const handleLogout = () => {
    localStorage.removeItem("role");
    setRole(null);
  };
 
  return (
    <CartProvider>
      <Router>
        {role && <Navbar onLogout={handleLogout} />}
        <Routes>
          <Route path="/login" element={!role ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />} />
 
          {/* User routes */}
          <Route path="/"        element={<ProtectedRoute element={<ProductsPage />}              allowedRoles={["user"]} />} />
          <Route path="/cart"    element={<ProtectedRoute element={<CartPage />}                  allowedRoles={["user"]} />} />
          <Route path="/orders"  element={<ProtectedRoute element={<OrdersPage />}               allowedRoles={["user"]} />} />
          <Route path="/search"  element={<ProtectedRoute element={<SearchPage />}               allowedRoles={["user"]} />} />
          <Route path="/payment" element={<ProtectedRoute element={<PaymentPage />}              allowedRoles={["user"]} />} />
          <Route path="/order-confirmation" element={<ProtectedRoute element={<OrderConfirmationPage />} allowedRoles={["user"]} />} />
          <Route path="/drops"   element={<ProtectedRoute element={<DropsPage />}                allowedRoles={["user"]} />} />
 
          {/* Admin routes */}
          <Route path="/admin"   element={<ProtectedRoute element={<AdminPage />}                allowedRoles={["admin"]} />} />
 
          <Route path="*" element={<Navigate to={role ? (role === "admin" ? "/admin" : "/") : "/login"} replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}
 
export default App;
 