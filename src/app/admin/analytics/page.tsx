'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { db } from '@/config/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { BarChart3, TrendingUp, Users, ShoppingCart, Award } from 'lucide-react';

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
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingStatus: string;
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
  material: string;
  gemstone: string;
  createdAt: any;
}

function formatTs(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

const MONTH_LABELS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const MONTH_KEYS: Array<{ year: number; month: number }> = [
  { year: 2025, month: 11 },
  { year: 2026, month: 0 },
  { year: 2026, month: 1 },
  { year: 2026, month: 2 },
  { year: 2026, month: 3 },
  { year: 2026, month: 4 },
];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [inventory, setInventory] = useState<FirestoreInventory[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOrder)));
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreInventory)));
      setInventoryLoading(false);
    });
    return () => unsub();
  }, [user]);

  const monthlyRevenue = useMemo(() => {
    return MONTH_KEYS.map((mk, idx) => {
      const bucket = orders.filter(o => {
        if (o.paymentStatus !== 'paid') return false;
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return d.getFullYear() === mk.year && d.getMonth() === mk.month;
      });
      return {
        month: MONTH_LABELS[idx],
        revenue: bucket.reduce((s, o) => s + o.totalAmount, 0),
        orders: bucket.length,
      };
    });
  }, [orders]);

  const kpis = useMemo(() => {
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const uniqueCustomers = new Set(orders.map(o => o.customerId)).size;
    const apr = monthlyRevenue[4]?.revenue ?? 0;
    const may = monthlyRevenue[5]?.revenue ?? 0;
    const mom = apr > 0 ? ((may - apr) / apr * 100).toFixed(1) : '0.0';
    return { totalRevenue, totalOrders, avgOrderValue, uniqueCustomers, mom };
  }, [orders, monthlyRevenue]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; revenue: number; units: number }>();
    orders.forEach(o => {
      o.items.forEach(item => {
        const existing = map.get(item.title);
        const rev = item.quantity * item.price;
        if (existing) {
          existing.revenue += rev;
          existing.units += item.quantity;
        } else {
          map.set(item.title, { title: item.title, revenue: rev, units: item.quantity });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => {
        const inv = inventory.find(i => i.productName === p.title);
        return { ...p, collection: inv?.collection ?? '—' };
      });
  }, [orders, inventory]);

  const topCategories = useMemo(() => {
    const map = new Map<string, { catalogValue: number; products: number }>();
    inventory.forEach(item => {
      const cat = item.category || 'Uncategorised';
      const existing = map.get(cat);
      const val = (item.stock ?? 0) * (item.price ?? 0);
      if (existing) {
        existing.catalogValue += val;
        existing.products += 1;
      } else {
        map.set(cat, { catalogValue: val, products: 1 });
      }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.catalogValue - a.catalogValue)
      .slice(0, 5);
  }, [inventory]);

  const maxRevenue = useMemo(
    () => Math.max(...monthlyRevenue.map(m => m.revenue), 1),
    [monthlyRevenue]
  );

  const totalRevenue6m = useMemo(
    () => monthlyRevenue.reduce((s, m) => s + m.revenue, 0),
    [monthlyRevenue]
  );

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying access...</p></div>;
  }

  if (ordersLoading || inventoryLoading) {
    return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Loading analytics...</p></div>;
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8">

      <div className="border-b border-white/5 pb-6">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
          <BarChart3 className="h-3.5 w-3.5" /> Platform Intelligence
        </span>
        <h1 className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">ANALYTICS</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue (6M)', value: formatPrice(totalRevenue6m), icon: TrendingUp, color: 'text-primary', trend: `+${kpis.mom}% MoM` },
          { label: 'Total Orders', value: `${kpis.totalOrders} Orders`, icon: ShoppingCart, color: 'text-white', trend: '' },
          { label: 'Avg Order Value', value: formatPrice(kpis.avgOrderValue), icon: Award, color: 'text-white', trend: '' },
          { label: 'Unique Customers', value: `${kpis.uniqueCustomers}`, icon: Users, color: 'text-white', trend: '' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass p-5 border border-white/5 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{kpi.label}</span>
              <div className="p-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                <kpi.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className={`text-xl font-semibold ${kpi.color}`}>{kpi.value}</p>
            {kpi.trend && <span className="text-[10px] text-green-400 font-semibold">{kpi.trend}</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <div className="xl:col-span-2 glass border border-white/5 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Monthly Revenue</h3>
          </div>

          <div className="flex items-end gap-3 h-48">
            {monthlyRevenue.map((m) => {
              const heightPct = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end" style={{ height: '180px' }}>
                    <div
                      className="w-full bg-primary/20 border-t-2 border-primary hover:bg-primary/30 transition-all group relative"
                      style={{ height: `${heightPct}%` }}
                      title={formatPrice(m.revenue)}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatPrice(m.revenue)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{m.month}</span>
                  <span className="text-[9px] text-zinc-600">{m.orders} orders</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-600 border-t border-white/5 pt-3">
            <span>Dec 2025 — May 2026</span>
            <span className="text-primary font-semibold">6-Month Window</span>
          </div>
        </div>

        <div className="glass border border-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Top Categories</h3>
          </div>
          <div className="space-y-4">
            {topCategories.length === 0 ? (
              <p className="text-zinc-600 text-xs text-center py-4">No inventory data.</p>
            ) : topCategories.map((cat, idx) => {
              const pct = Math.round((cat.catalogValue / topCategories[0].catalogValue) * 100);
              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-primary font-bold w-4">#{idx + 1}</span>
                      <p className="text-[11px] text-white font-medium truncate">{cat.name}</p>
                    </div>
                    <span className="text-[10px] text-primary font-semibold shrink-0 ml-2">{formatPrice(cat.catalogValue)}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-4 text-[9px] text-zinc-600">
                    <span>{cat.products} products</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Top Performing Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400">
            <thead className="bg-black/40 text-zinc-600 uppercase tracking-widest text-[9px] border-b border-white/5">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold">#</th>
                <th className="px-5 py-3.5 text-left font-semibold">Product</th>
                <th className="px-5 py-3.5 text-left font-semibold">Collection</th>
                <th className="px-5 py-3.5 text-center font-semibold">Units</th>
                <th className="px-5 py-3.5 text-right font-semibold">Revenue</th>
                <th className="px-5 py-3.5 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-600 text-xs">No order data yet.</td>
                </tr>
              ) : topProducts.map((product, idx) => {
                const share = kpis.totalRevenue > 0 ? ((product.revenue / kpis.totalRevenue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={product.title} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5 text-primary font-bold text-[11px]">#{idx + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-white text-[11px]">{product.title}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{product.collection}</td>
                    <td className="px-5 py-3.5 text-center font-mono">{product.units}</td>
                    <td className="px-5 py-3.5 text-right text-primary font-semibold">{formatPrice(product.revenue)}</td>
                    <td className="px-5 py-3.5 text-right text-zinc-500">{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
