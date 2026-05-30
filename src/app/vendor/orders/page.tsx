'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Truck, CheckCircle, Package, Search } from 'lucide-react';

type ShippingStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface VendorOrder {
  id: string;
  customer: string;
  customerEmail: string;
  product: string;
  quantity: number;
  subtotal: number;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  shippingStatus: ShippingStatus;
  date: string;
  address: string;
}

const MOCK_VENDOR_ORDERS: VendorOrder[] = [
  { id: 'ORD-4821', customer: 'Elena Rostova', customerEmail: 'elena@glimore.style', product: 'Saddle Calfskin Duffel Bag', quantity: 1, subtotal: 185000, paymentStatus: 'paid', shippingStatus: 'processing', date: '2026-05-29', address: '12 Luxury Blvd, New York, NY 10001' },
  { id: 'ORD-4818', customer: 'James Bellini', customerEmail: 'jbellini@example.com', product: 'Nappa Leather Chelsea Boots', quantity: 2, subtotal: 136000, paymentStatus: 'pending', shippingStatus: 'processing', date: '2026-05-27', address: '55 Bond Street, London W1S 1PR' },
  { id: 'ORD-4816', customer: 'Dmitri Volkov', customerEmail: 'dvolkov@example.com', product: 'Nappa Leather Chelsea Boots', quantity: 1, subtotal: 68000, paymentStatus: 'paid', shippingStatus: 'shipped', date: '2026-05-25', address: '7 Tverskaya St, Moscow 125009' },
  { id: 'ORD-4814', customer: 'Carlos Reyes', customerEmail: 'creyes@example.com', product: 'Saddle Calfskin Duffel Bag', quantity: 1, subtotal: 185000, paymentStatus: 'paid', shippingStatus: 'delivered', date: '2026-05-23', address: '15 Passeig de Gracia, Barcelona 08007' },
  { id: 'ORD-4810', customer: 'Sophie Laurent', customerEmail: 'sophie.l@example.com', product: 'Saddle Calfskin Duffel Bag', quantity: 1, subtotal: 185000, paymentStatus: 'paid', shippingStatus: 'delivered', date: '2026-05-20', address: '21 Bahnhofstrasse, Zurich 8001' },
];

const NEXT_STATUS: Record<ShippingStatus, ShippingStatus | null> = {
  processing: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
};

function shippingBadge(s: ShippingStatus) {
  if (s === 'delivered') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (s === 'shipped') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (s === 'cancelled') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
}

function paymentBadge(s: string) {
  if (s === 'paid') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (s === 'refunded') return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>(MOCK_VENDOR_ORDERS);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'vendor') router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'vendor') {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying vendor access...</p></div>;
  }

  const advanceShipping = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = NEXT_STATUS[o.shippingStatus];
      return next ? { ...o, shippingStatus: next } : o;
    }));
  };

  const filtered = orders.filter(o =>
    [o.id, o.customer, o.product].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.subtotal, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
            <ShoppingCart className="h-3.5 w-3.5" /> Fulfillment Centre
          </span>
          <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">MY ORDERS</h1>
          <p className="text-zinc-500 text-xs mt-1 font-light">
            Track and fulfill incoming orders for {user.displayName}.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: formatPrice(totalRevenue), color: 'text-primary' },
          { label: 'Total Orders', value: `${orders.length}`, color: 'text-white' },
          { label: 'Awaiting Dispatch', value: `${orders.filter(o => o.shippingStatus === 'processing').length}`, color: 'text-amber-400' },
          { label: 'Delivered', value: `${orders.filter(o => o.shippingStatus === 'delivered').length}`, color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="glass p-5 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{s.label}</span>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass p-12 text-center border border-white/5">
            <p className="text-zinc-500 text-xs">No orders match your search.</p>
          </div>
        ) : filtered.map((order) => (
          <div
            key={order.id}
            className="glass border border-white/5 overflow-hidden"
          >
            {/* Main row */}
            <button
              className="w-full p-5 flex flex-wrap gap-4 items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2 bg-primary/10 border border-primary/20 text-primary rounded">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-white text-[11px] font-medium">{order.id}</p>
                  <p className="font-['Cinzel'] text-xs text-zinc-300 font-semibold tracking-wide truncate">{order.product}</p>
                  <p className="text-[10px] text-zinc-500">for {order.customer} · {order.date}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${paymentBadge(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${shippingBadge(order.shippingStatus)}`}>
                  {order.shippingStatus}
                </span>
                <span className="text-primary font-semibold text-sm">{formatPrice(order.subtotal)}</span>
              </div>
            </button>

            {/* Expanded */}
            {expandedId === order.id && (
              <div className="border-t border-white/5 px-5 py-4 bg-black/20 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Customer</p>
                    <p className="text-zinc-300">{order.customer}</p>
                    <p className="text-zinc-500">{order.customerEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Ship To</p>
                    <p className="text-zinc-300">{order.address}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Order Summary</p>
                    <p className="text-zinc-300">{order.product} × {order.quantity}</p>
                    <p className="text-primary font-semibold">{formatPrice(order.subtotal)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  {NEXT_STATUS[order.shippingStatus] && (
                    <button
                      onClick={() => advanceShipping(order.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black text-[10px] font-semibold uppercase tracking-wider hover:bg-opacity-90 transition-all"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Mark as {NEXT_STATUS[order.shippingStatus]}
                    </button>
                  )}
                  {order.shippingStatus === 'delivered' && (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-green-400 text-[10px] font-semibold uppercase tracking-wider">
                      <CheckCircle className="h-3.5 w-3.5" /> Fulfillment Complete
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
