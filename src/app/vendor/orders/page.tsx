'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Truck, CheckCircle, Package, Search } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

type ShippingStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  vendorId: string;
  image?: string;
}

interface FirestoreOrder {
  id: string;
  customerId: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingAddress?: {
    customerName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: any;
}

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

function paymentBadge(s: PaymentStatus) {
  if (s === 'paid') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (s === 'refunded') return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
}

function formatTs(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [allOrders, setAllOrders] = useState<FirestoreOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'vendor' && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) return;
    const unsub = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOrder)));
        setDataLoading(false);
      }
    );
    return () => unsub();
  }, [loading, user]);

  const vendorOrders = useMemo(
    () => allOrders.filter(o => o.items?.some(i => i.vendorId === user?.uid)),
    [allOrders, user]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vendorOrders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      (o.shippingAddress?.customerName || o.customerEmail).toLowerCase().includes(q) ||
      o.items.some(i => i.title.toLowerCase().includes(q))
    );
  }, [vendorOrders, search]);

  const totalRevenue = useMemo(
    () => vendorOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.items
        .filter(i => i.vendorId === user?.uid)
        .reduce((s, i) => s + i.price * i.quantity, 0), 0),
    [vendorOrders, user]
  );

  if (loading || !user) {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying vendor access...</p></div>;
  }

  const advanceShipping = async (orderId: string, current: ShippingStatus) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    setAdvancing(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        shippingStatus: next,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setAdvancing(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
            <ShoppingCart className="h-3.5 w-3.5" /> Fulfillment Centre
          </span>
          <h1 className="font-['Montserrat'] text-2xl font-bold tracking-widest text-white">MY ORDERS</h1>
          <p className="text-zinc-500 text-xs mt-1 font-light">Track and fulfill orders for {user.displayName}.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Revenue (Paid)', value: dataLoading ? '—' : formatPrice(totalRevenue), color: 'text-primary' },
          { label: 'Total Orders', value: dataLoading ? '—' : `${vendorOrders.length}`, color: 'text-white' },
          { label: 'Awaiting Dispatch', value: dataLoading ? '—' : `${vendorOrders.filter(o => o.shippingStatus === 'processing').length}`, color: 'text-amber-400' },
          { label: 'Delivered', value: dataLoading ? '—' : `${vendorOrders.filter(o => o.shippingStatus === 'delivered').length}`, color: 'text-green-400' },
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {dataLoading ? (
          <div className="glass p-12 text-center border border-white/5">
            <p className="text-zinc-600 text-xs">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass p-12 text-center border border-white/5 space-y-2">
            <Package className="h-8 w-8 text-zinc-700 mx-auto" />
            <p className="text-zinc-500 text-xs">{search ? 'No orders match your search.' : 'No orders yet.'}</p>
          </div>
        ) : filtered.map((order) => {
          const vendorItems = order.items.filter(i => i.vendorId === user.uid);
          const vendorSubtotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0);
          const addr = order.shippingAddress;
          const customerName = addr?.customerName || order.customerEmail;

          return (
            <div key={order.id} className="glass border border-white/5 overflow-hidden">
              {/* Summary row */}
              <button
                className="w-full p-5 flex flex-wrap gap-4 items-center justify-between hover:bg-white/2 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 bg-primary/10 border border-primary/20 text-primary rounded shrink-0">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-white text-[11px] font-medium">{order.id}</p>
                    <p className="text-xs text-zinc-300 font-semibold truncate">
                      {vendorItems.map(i => i.title).join(', ')}
                    </p>
                    <p className="text-[10px] text-zinc-500">for {customerName} · {formatTs(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${paymentBadge(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${shippingBadge(order.shippingStatus)}`}>
                    {order.shippingStatus}
                  </span>
                  <span className="text-primary font-semibold text-sm">{formatPrice(vendorSubtotal)}</span>
                </div>
              </button>

              {/* Expanded detail */}
              {expandedId === order.id && (
                <div className="border-t border-white/5 px-5 py-4 bg-black/20 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Customer</p>
                      <p className="text-zinc-300">{customerName}</p>
                      <p className="text-zinc-500">{order.customerEmail}</p>
                      {addr?.phone && <p className="text-zinc-500">{addr.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Ship To</p>
                      {addr ? (
                        <>
                          <p className="text-zinc-300">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-zinc-500">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-zinc-500">{addr.country}</p>
                        </>
                      ) : (
                        <p className="text-zinc-600">No address on file</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Your Items</p>
                      {vendorItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-zinc-300">
                          <span className="truncate mr-2">{item.title} × {item.quantity}</span>
                          <span className="text-primary font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <p className="text-primary font-semibold pt-1 border-t border-white/5">{formatPrice(vendorSubtotal)}</p>
                    </div>
                  </div>

                  {/* Shipping actions */}
                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    {NEXT_STATUS[order.shippingStatus] && (
                      <button
                        onClick={() => advanceShipping(order.id, order.shippingStatus)}
                        disabled={advancing === order.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black text-[10px] font-semibold uppercase tracking-wider hover:bg-opacity-90 transition-all disabled:opacity-50"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {advancing === order.id ? 'Updating...' : `Mark as ${NEXT_STATUS[order.shippingStatus]}`}
                      </button>
                    )}
                    {order.shippingStatus === 'delivered' && (
                      <span className="flex items-center gap-1.5 px-4 py-2 text-green-400 text-[10px] font-semibold uppercase tracking-wider">
                        <CheckCircle className="h-3.5 w-3.5" /> Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
