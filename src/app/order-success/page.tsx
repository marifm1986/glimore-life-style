'use client';

import React, { use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Compass, ArrowRight, Printer } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || `order_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8 animate-fadeIn">
      
      {/* Visual Indicator */}
      <div className="inline-flex p-6 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
        <ShieldCheck className="h-12 w-12" />
      </div>

      <div className="space-y-3">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold">Payment Confirmed</span>
        <h1 className="font-['Montserrat'] text-3xl sm:text-4xl font-bold tracking-widest text-white leading-tight">
          ORDER ACQUIRED
        </h1>
        <p className="text-zinc-500 text-xs tracking-wider max-w-md mx-auto font-light leading-relaxed">
          Your payment transaction was securely processed via Stripe Connect. We have notified our individual partner ateliers to commence preparing your curated items.
        </p>
      </div>

      {/* Details Box */}
      <div className="glass p-6 border border-white/5 space-y-4 max-w-md mx-auto text-left text-xs text-zinc-400">
        <div className="flex justify-between">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider">Tracking Reference:</span>
          <span className="text-white font-mono font-medium select-all">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider">Estimated Dispatch:</span>
          <span className="text-primary font-medium uppercase">Within 48 Ateliers Hours</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider">Delivery Carrier:</span>
          <span className="text-white">Premium Insured DHL Express</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 max-w-md mx-auto">
        <Link 
          href="/products" 
          className="flex-grow px-6 py-3.5 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all text-center rounded-none flex items-center justify-center gap-2"
        >
          <Compass className="h-4 w-4" /> Return to Boutique
        </Link>
        <button 
          onClick={() => window.print()}
          className="px-6 py-3.5 border border-white/20 text-white font-semibold text-xs tracking-[0.2em] uppercase hover:bg-white/5 transition-all rounded-none flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4 text-primary" /> Print Invoice
        </button>
      </div>

    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-zinc-500 text-xs">
        Loading purchase confirmation details...
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
