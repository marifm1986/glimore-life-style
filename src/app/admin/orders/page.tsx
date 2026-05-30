'use client';

import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { db } from '@/config/firebase';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { ShoppingCart, Search, ChevronDown, Truck, CheckCircle, XCircle } from 'lucide-react';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type ShippingStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface FirestoreOrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  vendorId: string;
  image: string;
}

interface FirestoreOrder {
  id: string;
  customerId: string;
  customerEmail: string;
  items: FirestoreOrderItem[];
  totalAmount: number;
  stripePaymentIntentId: string;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: any;
  updatedAt: any;
}

const SHIPPING_NEXT: Record<ShippingStatus, ShippingStatus | null> = {
  processing: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
};

function nameFromEmail(email: string): string {
  return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatTs(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

function formatAddress(a?: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string }): string {
  if (!a) return 'No address on file';
  return [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ');
}

function paymentBadge(status: PaymentStatus) {
  const styles: Record<PaymentStatus, string> = {
    paid: 'bg-green-500/10 text-green-400 border border-green-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    failed: 'bg-red-500/10 text-red-400 border border-red-500/20',
    refunded: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  };
  return styles[status];
}

function shippingBadge(status: ShippingStatus) {
  const styles: Record<ShippingStatus, string> = {
    processing: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
    shipped: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    delivered: 'bg-green-500/10 text-green-400 border border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return styles[status];
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [shippingFilter, setShippingFilter] = useState<ShippingStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOrder)));
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = useMemo(() => orders.filter((o) => {
    const customer = nameFromEmail(o.customerEmail);
    const matchSearch = [o.id, customer, o.customerEmail].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    const matchShipping = shippingFilter === 'all' || o.shippingStatus === shippingFilter;
    return matchSearch && matchPayment && matchShipping;
  }), [orders, search, paymentFilter, shippingFilter]);

  const totalRevenue = useMemo(
    () => orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
    [orders]
  );

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying access...</p></div>;
  }

  const advanceShipping = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = SHIPPING_NEXT[order.shippingStatus];
    if (!next) return;
    await updateDoc(doc(db, 'orders', id), { shippingStatus: next, updatedAt: serverTimestamp() });
  };

  const cancelOrder = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { shippingStatus: 'cancelled', paymentStatus: 'refunded', updatedAt: serverTimestamp() });
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8">

      <div className="border-b border-white/5 pb-6">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
          <ShoppingCart className="h-3.5 w-3.5" /> Order Management
        </span>
        <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">ALL ORDERS</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: formatPrice(totalRevenue), color: 'text-primary' },
          { label: 'Total Orders', value: `${orders.length} Orders`, color: 'text-white' },
          { label: 'Processing', value: `${orders.filter(o => o.shippingStatus === 'processing').length} Active`, color: 'text-amber-400' },
          { label: 'Delivered', value: `${orders.filter(o => o.shippingStatus === 'delivered').length} Complete`, color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="glass p-5 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{s.label}</span>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
          className="bg-black border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={shippingFilter}
          onChange={(e) => setShippingFilter(e.target.value as ShippingStatus | 'all')}
          className="bg-black border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
        >
          <option value="all">All Shipping</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="glass border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400">
            <thead className="bg-black/40 text-zinc-600 uppercase tracking-widest text-[9px] border-b border-white/5">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold">Order ID</th>
                <th className="px-5 py-3.5 text-left font-semibold">Customer</th>
                <th className="px-5 py-3.5 text-center font-semibold">Items</th>
                <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                <th className="px-5 py-3.5 text-left font-semibold">Payment</th>
                <th className="px-5 py-3.5 text-left font-semibold">Shipping</th>
                <th className="px-5 py-3.5 text-left font-semibold">Date</th>
                <th className="px-5 py-3.5 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-600 text-xs">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-600 text-xs">
                    {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                  </td>
                </tr>
              ) : filtered.map((order) => {
                const customer = nameFromEmail(order.customerEmail);
                const itemCount = order.items.length;
                const date = formatTs(order.createdAt);
                const address = formatAddress(order.shippingAddress);
                return (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-white/2 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                      <td className="px-5 py-3.5 font-mono text-white text-[10px] font-medium">{order.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-zinc-300 font-medium text-[11px]">{customer}</p>
                        <p className="text-zinc-600 text-[9px]">{order.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">{itemCount}</td>
                      <td className="px-5 py-3.5 text-right text-primary font-semibold">{formatPrice(order.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${paymentBadge(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${shippingBadge(order.shippingStatus)}`}>
                          {order.shippingStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 text-[10px]">{date}</td>
                      <td className="px-5 py-3.5 text-center">
                        <ChevronDown className={`h-4 w-4 text-zinc-500 mx-auto transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>

                    {expandedId === order.id && (
                      <tr className="bg-black/20">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="flex flex-wrap gap-6 items-start">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Ship To</p>
                              <p className="text-xs text-zinc-300">{address}</p>
                            </div>
                            <div className="flex gap-2 ml-auto flex-wrap">
                              {SHIPPING_NEXT[order.shippingStatus] && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); advanceShipping(order.id); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
                                >
                                  <Truck className="h-3 w-3" />
                                  Mark as {SHIPPING_NEXT[order.shippingStatus]}
                                </button>
                              )}
                              {order.shippingStatus !== 'delivered' && order.shippingStatus !== 'cancelled' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                >
                                  <XCircle className="h-3 w-3" /> Cancel
                                </button>
                              )}
                              {order.shippingStatus === 'delivered' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-green-400 text-[10px] font-semibold uppercase tracking-wider">
                                  <CheckCircle className="h-3 w-3" /> Order Complete
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
