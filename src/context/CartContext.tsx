'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  title: string;
  price: number; // in cents
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('glimore_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart items:', e);
      }
    }
    setMounted(true);
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('glimore_cart', JSON.stringify(newCart));
  };

  const addToCart = (newItem: CartItem) => {
    const existing = cart.find(i => i.productId === newItem.productId);
    if (existing) {
      saveCart(
        cart.map(i =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      );
    } else {
      saveCart([...cart, newItem]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    saveCart(
      cart.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => saveCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Return loading state or children based on mounting to prevent hydrations mismatch
  return (
    <CartContext.Provider
      value={{
        cart: mounted ? cart : [],
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal: mounted ? cartTotal : 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
