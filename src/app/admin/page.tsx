'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { db } from '@/config/firebase';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  Sparkles, ShieldCheck, DollarSign, Users, Award,
  UserCheck, UserX, TrendingUp, AlertTriangle, ShoppingCart,
} from 'lucide-react';

interface FirestoreOrder {
  id: string;
  customerId: string;
  customerEmail: string;
  items: { productId: string; title: string; quantity: number; price: number; vendorId: string; image: string }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

interface FirestoreInventory {
  id: string;
  productName: string;
  collection: string;
  stock: number;
  price: number;
  status: string;
  category: string;
  createdAt: any;
}

interface FirestoreUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'vendor' | 'admin';
  createdAt: any;
}

interface FirestoreVendor {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  ownerUid: string;
  status: 'pending' | 'approved' | 'suspended';
  createdAt: any;
}

function nameFromEmail(email: string): string {
  return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatTs(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [recentOrders, setRecentOrders] = useState<FirestoreOrder[]>([]);
  const [allOrders, setAllOrders] = useState<FirestoreOrder[]>([]);
  const [inventory, setInventory] = useState<FirestoreInventory[]>([]);
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [vendors, setVendors] = useState<FirestoreVendor[]>([]);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const unsubRecent = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)),
      (snap) => setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOrder)))
    );

    const unsubAll = onSnapshot(
      query(collection(db, 'orders')),
      (snap) => setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOrder)))
    );

    const unsubInventory = onSnapshot(
      collection(db, 'inventory'),
      (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreInventory)))
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreUser)))
    );

    const unsubVendors = onSnapshot(
      query(collection(db, 'vendors'), orderBy('createdAt', 'desc')),
      (snap) => setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreVendor)))
    );

    return () => {
      unsubRecent();
      unsubAll();
      unsubInventory();
      unsubUsers();
      unsubVendors();
    };
  }, [user]);

  const consolidatedVolume = useMemo(
    () => allOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
    [allOrders]
  );

  const platformFee = useMemo(() => consolidatedVolume * 0.08, [consolidatedVolume]);

  const activeMerchants = useMemo(
    () => new Set(inventory.map(i => i.collection).filter(Boolean)).size,
    [inventory]
  );

  const totalCustomers = useMemo(
    () => users.filter(u => u.role === 'customer').length,
    [users]
  );

  const handleUpdateStatus = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      await updateDoc(doc(db, 'vendors', id), { status: 'approved', updatedAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'vendors', id), { status: 'suspended' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="glass p-8 border border-white/10 text-center">
          <p className="text-white text-sm font-semibold">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="glass p-8 border border-white/10 text-center max-w-sm">
          <p className="text-white text-sm font-semibold mb-2">Admin access required</p>
          <p className="text-zinc-400 text-xs">Sign in with an admin account to access this console.</p>
        </div>
      </div>
    );
  }

  const pendingVendors = vendors.filter(v => v.status === 'pending');

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8">

      <div className="border-b border-white/5 pb-6">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
          <Sparkles className="h-3.5 w-3.5" /> High Console Panel
        </span>
        <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">
          SUPER ADMIN DASHBOARD
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Consolidated Volume', value: formatPrice(consolidatedVolume), icon: DollarSign, highlight: true },
          { label: 'Platform Fee (8%)', value: formatPrice(platformFee), icon: TrendingUp, highlight: false },
          { label: 'Active Merchants', value: `${activeMerchants} Brands`, icon: Award, highlight: false },
          { label: 'Total Customers', value: `${totalCustomers} Accounts`, icon: Users, highlight: false },
        ].map((metric) => (
          <div key={metric.label} className="glass p-5 border border-white/5 flex justify-between items-center bg-black/40">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{metric.label}</span>
              <p className={`text-xl font-semibold ${metric.highlight ? 'text-primary' : 'text-white'}`}>
                {metric.value}
              </p>
            </div>
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
              <metric.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <div className="xl:col-span-2 glass border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-zinc-400">
              <thead className="bg-black/40 text-zinc-600 uppercase tracking-widest text-[9px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-5 py-3 text-left font-semibold">Customer</th>
                  <th className="px-5 py-3 text-left font-semibold">Total</th>
                  <th className="px-5 py-3 text-left font-semibold">Payment</th>
                  <th className="px-5 py-3 text-left font-semibold">Shipping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-zinc-600 text-xs">No orders yet.</td>
                  </tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 font-mono text-white text-[10px]">{order.id}</td>
                    <td className="px-5 py-3 font-medium text-zinc-300">{nameFromEmail(order.customerEmail)}</td>
                    <td className="px-5 py-3 text-primary font-semibold">{formatPrice(order.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        order.shippingStatus === 'delivered'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : order.shippingStatus === 'shipped'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {order.shippingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">

          <div className="glass border border-white/5">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">
                  Merchant Applications
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold rounded-full">
                {pendingVendors.length} pending
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {vendors.length === 0 ? (
                <p className="p-5 text-zinc-500 text-xs text-center">All applications reviewed.</p>
              ) : (
                vendors.map((vendor) => (
                  <div key={vendor.id} className={`p-4 space-y-3 ${vendor.status === 'approved' ? 'opacity-40' : ''}`}>
                    <div className="flex gap-3 items-start justify-between">
                      <div className="flex gap-2 items-center min-w-0">
                        {vendor.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={vendor.logoUrl} alt={vendor.name} className="h-8 w-8 object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="h-8 w-8 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {vendor.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-['Cinzel'] text-xs font-bold text-white tracking-wide truncate">{vendor.name}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{formatTs(vendor.createdAt)}</p>
                        </div>
                      </div>
                      {vendor.status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 shrink-0">
                          <ShieldCheck className="h-2.5 w-2.5" /> OK
                        </span>
                      ) : vendor.status === 'suspended' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                          Rejected
                        </span>
                      ) : (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUpdateStatus(vendor.id, 'approve')}
                            className="p-1 border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black transition-all rounded"
                            title="Approve"
                          >
                            <UserCheck className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(vendor.id, 'reject')}
                            className="p-1 border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black transition-all rounded"
                            title="Reject"
                          >
                            <UserX className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-500 text-[10px] font-light leading-relaxed line-clamp-2">{vendor.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass p-5 border border-white/5 space-y-4">
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white border-b border-white/5 pb-3">
              System Status
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Auth Mode</span>
                <span className="text-white font-semibold text-[10px] px-2 py-0.5 bg-black border border-white/10">Sandbox</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Firestore Rules</span>
                <span className="text-green-400 font-semibold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Active
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Stripe Connect</span>
                <span className="text-amber-400 font-semibold text-[10px]">Test Mode</span>
              </div>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/15 text-amber-400 text-[10px] leading-relaxed flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
              <p>Connect live Stripe keys before routing real transactions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
