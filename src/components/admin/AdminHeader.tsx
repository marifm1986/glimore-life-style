'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, BellOff, Sparkles, Crown, Menu, Send } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth();
  const initials = user?.displayName?.slice(0, 2).toUpperCase() || 'AD';

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'err' | null>(null);

  // Detect current subscription state on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
    if (Notification.permission !== 'granted') return;

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  const handleBell = async () => {
    if (loading || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      // Already subscribed → unsubscribe
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
          setSubscribed(false);
        }
        return;
      }

      // Request permission if needed
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set'); return; }

      // Unsubscribe any stale subscription before creating a fresh one
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
        reg.showNotification('✅ Subscribed on this device', {
          body: 'You will receive order notifications here.',
          icon: '/only_logo.webp',
          tag: 'setup',
          silent: false,
          vibrate: [200, 100, 200],
        } as NotificationOptions);
      } else {
        console.error('[push] Failed to save subscription — status', res.status);
        await sub.unsubscribe();
      }
    } catch (err) {
      console.error('[push] subscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (testLoading) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      setTestResult(res.ok ? 'ok' : 'err');
    } catch {
      setTestResult('err');
    } finally {
      setTestLoading(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const bellTitle = subscribed
    ? 'Notifications ON — click to disable'
    : permission === 'denied'
    ? 'Notifications blocked in browser settings'
    : 'Enable order notifications on this device';

  const BellIcon = subscribed ? Bell : BellOff;
  const bellColor = subscribed
    ? 'text-primary'
    : permission === 'denied'
    ? 'text-zinc-700 cursor-not-allowed'
    : 'text-zinc-500 hover:text-white';

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
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold" suppressHydrationWarning>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="sm:hidden">
          <span className="font-['Montserrat'] text-sm font-bold tracking-widest gold-text">GLIMORE</span>
        </div>
      </div>

      <div className="flex items-center gap-4">

        {/* Test push button — only shown when subscribed */}
        {subscribed && (
          <button
            onClick={handleTest}
            disabled={testLoading}
            title="Send a test notification to all subscribed devices"
            aria-label="Send test notification"
            className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-1 border transition-all ${
              testResult === 'ok'
                ? 'border-green-500/40 text-green-400'
                : testResult === 'err'
                ? 'border-red-500/40 text-red-400'
                : 'border-white/10 text-zinc-500 hover:border-primary/40 hover:text-primary'
            } ${testLoading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {testLoading ? '...' : testResult === 'ok' ? '✓ Sent' : testResult === 'err' ? '✗ Failed' : <span className="flex items-center gap-1"><Send size={9} />Test</span>}
          </button>
        )}

        {/* Bell subscribe button */}
        <button
          onClick={permission !== 'denied' ? handleBell : undefined}
          disabled={loading || permission === 'denied'}
          title={bellTitle}
          className={`relative transition-colors ${bellColor} ${loading ? 'opacity-50 cursor-wait' : ''}`}
          aria-label={bellTitle}
        >
          <BellIcon size={16} />
          {subscribed && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
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
