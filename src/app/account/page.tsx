'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { User, MapPin, ShoppingBag, Sparkles, LogOut, Package, CheckCircle, Truck, Clock, Pencil, Check, X } from 'lucide-react';
import Image from 'next/image';

const MOCK_ORDERS = [
  { id: 'ORD-4821', date: '2026-05-29', total: 574000, items: 2, status: 'processing', products: ['Bespoke Cashmere Trench Coat', 'Saddle Calfskin Duffel Bag'] },
  { id: 'ORD-4815', date: '2026-05-20', total: 495000, items: 1, status: 'delivered', products: ['Chrono Champagne Gold Watch'] },
  { id: 'ORD-4802', date: '2026-05-10', total: 290000, items: 1, status: 'delivered', products: ['Silk Organza Evening Gown'] },
];

function statusIcon(status: string) {
  if (status === 'delivered') return <CheckCircle className="h-4 w-4 text-green-400" />;
  if (status === 'shipped') return <Truck className="h-4 w-4 text-blue-400" />;
  return <Clock className="h-4 w-4 text-amber-400" />;
}

function statusBadge(status: string) {
  if (status === 'delivered') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'shipped') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
}

export default function AccountPage() {
  const { user, logout, loading, updateName } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      await updateName(nameInput.trim());
      setEditingName(false);
    } catch (err: any) {
      setNameError(err.message || 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass p-10 border border-white/5 text-center max-w-sm space-y-5">
          <div className="flex rounded-full bg-primary/10 border border-primary/20 w-25 h-25 text-primary overflow-hidden mx-auto">
            <img src="/only_logo.webp" alt="GLIMORE LIFE STYLE Logo" width={100} height={100} className="object-cover" />
          </div>
          <div className="space-y-2">
            <h2 className="font-['Cinzel'] text-xl font-bold tracking-widest text-white">SIGN IN REQUIRED</h2>
            <p className="text-zinc-500 text-xs font-light leading-relaxed">Access your Glimore account to view your profile, orders, and preferences.</p>
          </div>
          <Link href="/login" className="block px-6 py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-90 transition-all">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Glimore Member Portal
          </span>
          <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">
            {user.displayName?.toUpperCase() || 'MY ACCOUNT'}
          </h1>
          <p className="text-zinc-500 text-xs mt-1">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-500 hover:text-destructive transition-colors text-xs uppercase tracking-widest font-semibold self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
          user.role === 'admin'
            ? 'bg-primary/10 text-primary border-primary/20'
            : user.role === 'vendor'
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
        }`}>
          <User className="h-3 w-3" /> {user.role}
        </span>
        {user.role === 'admin' && (
          <Link href="/admin" className="text-[10px] text-primary hover:underline tracking-wider uppercase font-semibold">
            → Admin Console
          </Link>
        )}
        {user.role === 'vendor' && (
          <Link href="/vendor" className="text-[10px] text-primary hover:underline tracking-wider uppercase font-semibold">
            → Vendor Hub
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-6">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'orders', label: 'Order History', icon: ShoppingBag },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Personal Info */}
          <div className="glass p-6 border border-white/5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <User className="h-4 w-4 text-primary" />
              <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Personal Details</h3>
            </div>
            <div className="space-y-4 text-xs">
              {/* Full Name — editable */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Full Name</span>
                {editingName ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                        autoFocus
                        className="flex-1 bg-black border border-primary/40 px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-white"
                      />
                      <button onClick={handleSaveName} disabled={nameSaving} className="p-1.5 bg-primary text-black hover:bg-opacity-90 disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setEditingName(false); setNameError(null); }} className="p-1.5 border border-white/10 text-zinc-500 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {nameError && <p className="text-[10px] text-red-400">⚠ {nameError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="text-zinc-300 font-medium">{user.displayName || '—'}</span>
                    <button
                      onClick={() => { setNameInput(user.displayName || ''); setEditingName(true); setNameError(null); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-primary"
                      title="Edit name"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {[
                { label: 'Email Address', value: user.email },
                { label: 'Account Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
                { label: 'Account ID', value: user.uid.slice(0, 16) + '...' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">{label}</span>
                  <span className="text-zinc-300 font-medium">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="glass p-6 border border-white/5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Shipping Address</h3>
            </div>
            {user.shippingAddress ? (
              <div className="space-y-2 text-xs text-zinc-300">
                <p>{user.shippingAddress.line1}</p>
                {user.shippingAddress.line2 && <p>{user.shippingAddress.line2}</p>}
                <p>{user.shippingAddress.city}, {user.shippingAddress.state} {user.shippingAddress.postalCode}</p>
                <p>{user.shippingAddress.country}</p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <MapPin className="h-8 w-8 text-zinc-700 mx-auto" />
                <p className="text-zinc-600 text-xs font-light">No address on file.</p>
                <p className="text-zinc-600 text-[10px]">Your shipping address will be saved after your first order.</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-2 glass p-6 border border-white/5">
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white border-b border-white/5 pb-4 mb-5">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all"
              >
                <ShoppingBag className="h-4 w-4" /> Browse Collection
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-zinc-300 font-semibold text-xs tracking-[0.15em] uppercase hover:border-primary hover:text-white transition-all"
              >
                <Package className="h-4 w-4" /> View Cart
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fadeIn">
          {MOCK_ORDERS.length === 0 ? (
            <div className="glass p-16 text-center border border-white/5 space-y-4">
              <ShoppingBag className="h-10 w-10 text-zinc-700 mx-auto" />
              <p className="text-zinc-500 text-sm font-light">No orders yet.</p>
              <Link href="/products" className="inline-block px-6 py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-90 transition-all">
                Start Shopping
              </Link>
            </div>
          ) : MOCK_ORDERS.map((order) => (
            <div key={order.id} className="glass border border-white/5 overflow-hidden">
              <div className="p-5 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcon(order.status)}
                  <div className="min-w-0">
                    <p className="font-mono text-white text-[11px] font-medium">{order.id}</p>
                    <p className="text-[10px] text-zinc-500">{order.date} · {order.items} {order.items === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-primary font-semibold text-sm">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="border-t border-white/5 px-5 py-3 bg-black/20">
                <ul className="space-y-1">
                  {order.products.map((p, i) => (
                    <li key={i} className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
