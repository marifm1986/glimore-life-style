'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell, Sparkles, Crown, Menu } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth();
  const initials = user?.displayName?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <header className="h-14 bg-background/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-zinc-500 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="sm:hidden">
          <span className="font-['Cinzel'] text-sm font-bold tracking-widest gold-text">GLIMORE</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-zinc-500 hover:text-white transition-colors" title="Notifications">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-[11px] tracking-wider shrink-0">
            {initials}
            {user?.superAdmin && (
              <Crown size={9} className="absolute -top-1 -right-1 text-primary" />
            )}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-zinc-400 font-medium max-w-30 truncate">
              {user?.displayName || 'Administrator'}
            </span>
            {user?.superAdmin && (
              <span className="text-[9px] text-primary font-semibold tracking-widest uppercase">
                Super Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
