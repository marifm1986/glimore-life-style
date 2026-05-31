'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShoppingBag,
  Crown,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={`
        w-64 bg-[#050507] border-r border-white/5 h-screen flex flex-col
        fixed left-0 top-0 z-30 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo header */}
      <div className="h-16 lg:h-28 px-6 flex flex-col justify-center lg:justify-end lg:pb-4 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-['Montserrat'] text-xl font-bold tracking-[0.2em] gold-text">
              GLIMORE
            </span>
            <span className="text-[9px] tracking-[0.4em] uppercase text-primary/60 font-semibold mt-0.5 block">
              Admin Console
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-zinc-500 hover:text-white transition-colors p-1"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
        {user?.superAdmin && (
          <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary text-[9px] font-bold tracking-[0.3em] uppercase w-fit">
            <Crown size={9} /> Super Admin
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase transition-all rounded-none ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
              }`}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Shop link + logout */}
      <div className="px-4 py-4 border-t border-white/5 space-y-1 shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase text-zinc-500 hover:text-white hover:bg-white/5 transition-all border-l-2 border-transparent pl-[10px]"
        >
          <ShoppingBag size={15} />
          <span>View Shop</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase text-zinc-500 hover:text-destructive hover:bg-destructive/5 transition-all border-l-2 border-transparent pl-[10px]"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
