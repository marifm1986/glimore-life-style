'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, User, LogOut, ShieldAlert, Award, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-['Cinzel'] text-2xl font-bold tracking-[0.2em] gold-text transition-all duration-300 group-hover:opacity-90">
            GLIMORE LIFE STYLE
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest text-zinc-400">
          <Link href="/" className="hover:text-primary transition-colors uppercase">Home</Link>
          <Link href="/products" className="hover:text-primary transition-colors uppercase">Collection</Link>
          {user?.role === 'vendor' && (
            <>
              <Link href="/vendor" className="text-primary font-bold flex items-center gap-1 hover:opacity-85 transition-opacity uppercase">
                <Award className="h-4 w-4" /> Vendor Hub
              </Link>
              <Link href="/vendor/orders" className="text-zinc-400 hover:text-primary flex items-center gap-1 transition-colors uppercase">
                Orders
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link href="/admin" className="text-primary font-bold flex items-center gap-1 hover:opacity-85 transition-opacity uppercase">
              <ShieldAlert className="h-4 w-4" /> Admin Console
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="text-xs text-zinc-400 hover:text-primary transition-colors font-medium max-w-30 truncate"
                title="My Account"
              >
                {user.displayName}
              </Link>
              <button
                onClick={logout}
                className="text-zinc-400 hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 text-sm tracking-widest uppercase">
              <User className="h-5 w-5" /> Login
            </Link>
          )}

          <Link href="/cart" className="relative text-zinc-400 hover:text-primary transition-colors p-1">
            <ShoppingBag className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-black font-bold text-[10px] h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                {cartItemsCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile trigger */}
        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" className="relative text-zinc-400 hover:text-primary transition-colors p-1">
            <ShoppingBag className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-black font-bold text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-zinc-400 hover:text-white p-1"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-background px-4 py-6 space-y-4 animate-fadeIn">
          <nav className="flex flex-col gap-4 text-sm font-medium tracking-wider text-zinc-400">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors uppercase">Home</Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors uppercase">Collection</Link>
            {user?.role === 'vendor' && (
              <>
                <Link href="/vendor" onClick={() => setMobileMenuOpen(false)} className="text-primary font-bold flex items-center gap-1 uppercase">
                  <Award className="h-4 w-4" /> Vendor Hub
                </Link>
                <Link href="/vendor/orders" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white transition-colors uppercase">
                  My Orders
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-primary font-bold flex items-center gap-1 uppercase">
                <ShieldAlert className="h-4 w-4" /> Admin Console
              </Link>
            )}
          </nav>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-zinc-400 hover:text-primary transition-colors"
                >
                  <strong>{user.displayName}</strong> · My Account
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-destructive hover:opacity-80 flex items-center gap-1 text-xs uppercase tracking-wider"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <User className="h-5 w-5" /> Login / Signup
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
