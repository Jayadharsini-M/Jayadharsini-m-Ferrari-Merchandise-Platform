import React, { createContext, useState, useContext, useCallback } from "react";
import Toast from "../components/Toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, showToast }}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);