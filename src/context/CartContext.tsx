'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  sku?: string;
  title: string;
  price: number; // in cents
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
  variant?: string;
}

function itemKey(productId: string, variant?: string) {
  return `${productId}::${variant || ''}`;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
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
    const key = itemKey(newItem.productId, newItem.variant);
    const existing = cart.find(i => itemKey(i.productId, i.variant) === key);
    if (existing) {
      saveCart(
        cart.map(i =>
          itemKey(i.productId, i.variant) === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      );
    } else {
      saveCart([...cart, newItem]);
    }
  };

  const removeFromCart = (productId: string, variant?: string) => {
    saveCart(cart.filter(i => itemKey(i.productId, i.variant) !== itemKey(productId, variant)));
  };

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    const key = itemKey(productId, variant);
    saveCart(
      cart.map(i => (itemKey(i.productId, i.variant) === key ? { ...i, quantity } : i))
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
