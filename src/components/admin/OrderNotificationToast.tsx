'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, X } from 'lucide-react';

interface OrderToast {
  id: string;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [
      { freq: 880,  start: 0.00 },
      { freq: 1100, start: 0.16 },
      { freq: 1320, start: 0.32 },
    ].forEach(({ freq, start }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.45);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.45);
    });
  } catch { /* browser blocked autoplay — silent fail */ }
}

const AUTO_DISMISS_MS = 9000;

export default function OrderNotificationToast() {
  const [toasts, setToasts] = useState<OrderToast[]>([]);
  const initialized = useRef(false);
  const seenIds    = useRef<Set<string>>(new Set());

  const dismiss = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type !== 'added') return;

        const docId = change.doc.id;

        if (!initialized.current) {
          // Record all already-existing orders so we don't notify for them
          seenIds.current.add(docId);
          return;
        }

        if (seenIds.current.has(docId)) return;
        seenIds.current.add(docId);

        const d = change.doc.data();
        const toast: OrderToast = {
          id: docId,
          customerEmail: (d.customerEmail as string) || 'Guest',
          totalAmount:   (d.totalAmount  as number) || 0,
          itemCount:     Array.isArray(d.items) ? (d.items as unknown[]).length : 0,
        };

        setToasts(prev => [...prev, toast]);
        playChime();
        setTimeout(() => dismiss(docId), AUTO_DISMISS_MS);
      });

      // After processing the initial batch, mark as ready
      if (!initialized.current) initialized.current = true;
    });

    return () => unsub();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col-reverse gap-3 max-w-xs w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-fadeIn overflow-hidden"
          style={{
            background: 'rgba(12,12,16,0.92)',
            border: '1px solid rgba(212,175,55,0.35)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.08)',
          }}
        >
          {/* Animated gold top bar */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg,transparent,#d4af37,transparent)' }}
          />

          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 p-2 rounded-full bg-primary/15 border border-primary/25">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-wide">New Order Received</p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{toast.customerEmail}</p>
                <p className="text-[12px] text-primary font-semibold mt-1">
                  {formatPrice(toast.totalAmount)}
                  <span className="text-zinc-500 font-normal text-[10px] ml-1.5">
                    · {toast.itemCount} item{toast.itemCount !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* CTA */}
            <Link
              href="/admin/orders"
              onClick={() => dismiss(toast.id)}
              className="block text-center py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary border border-primary/25 hover:bg-primary/10 transition-colors"
            >
              View Order →
            </Link>
          </div>

          {/* Auto-dismiss progress bar */}
          <div className="h-px bg-white/5 overflow-hidden">
            <div
              className="h-full bg-primary/50"
              style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
