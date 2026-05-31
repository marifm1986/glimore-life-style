'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderNotificationToast from '@/components/admin/OrderNotificationToast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>

      <OrderNotificationToast />
    </div>
  );
}
