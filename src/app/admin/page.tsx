'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DollarSign, ShoppingCart, Users } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import MetricCard from '@/components/admin/MetricCard';
import RevenueChart from '@/components/admin/RevenueChart';
import SalesChart from '@/components/admin/SalesChart';
import RecentActivity from '@/components/admin/RecentActivity';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">Admin access required</p>
          <p className="text-gray-600 text-sm">Please sign in with an admin account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <AdminHeader />

        {/* Content */}
        <div className="px-8 py-6 max-w-7xl mx-auto">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard
              icon={<DollarSign size={24} />}
              label="Total Revenue"
              value=",280,000"
              change="? 12% this quarter"
              changeType="positive"
            />
            <MetricCard
              icon={<ShoppingCart size={24} />}
              label="Active Orders"
              value="156"
              change="24 items in queue"
              changeType="positive"
            />
            <MetricCard
              icon={<Users size={24} />}
              label="Avg Order Value"
              value=",210"
              change="? 3.2% vs last quarter"
              changeType="positive"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <div>
              <SalesChart />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
