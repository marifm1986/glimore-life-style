'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { 
  Sparkles, ShieldCheck, DollarSign, Users, Award, 
  Settings, UserCheck, UserX, TrendingUp, AlertTriangle 
} from 'lucide-react';

interface LocalVendorRequest {
  id: string;
  name: string;
  description: string;
  logo: string;
  ownerEmail: string;
  status: 'pending' | 'approved' | 'suspended';
}

const INITIAL_VENDOR_REQUESTS: LocalVendorRequest[] = [
  {
    id: 'req-01',
    name: 'Atelier de L’Etoile',
    description: 'Fine silk weavers, offering hand-embroidered evening slips and cashmere items from Northern Italy.',
    logo: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=150',
    ownerEmail: 'contact@letoile.atelier',
    status: 'pending',
  },
  {
    id: 'req-02',
    name: 'Norden Solen',
    description: 'Nordic minimalist outerwear. Down-insulated weatherproof technical wool parkas tailored in Sweden.',
    logo: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=150',
    ownerEmail: 'magnus@nordensolen.se',
    status: 'pending',
  }
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LocalVendorRequest[]>(INITIAL_VENDOR_REQUESTS);

  const handleUpdateStatus = (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } else {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Dashboard Header */}
      <div className="border-b border-white/5 pb-6 text-left">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> High Console Panel
        </span>
        <h1 className="font-['Cinzel'] text-3xl font-bold tracking-widest text-white">
          SUPER ADMIN CONSOLE
        </h1>
      </div>

      {/* METRIC GRAPH SHIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center bg-black/40">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Consolidated Volume</span>
            <p className="text-2xl font-semibold text-primary">{formatPrice(12845000)}</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center bg-black/40">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Platform Fee cut (8%)</span>
            <p className="text-2xl font-semibold text-white">{formatPrice(1027600)}</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center bg-black/40">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Active Merchants</span>
            <p className="text-2xl font-semibold text-white">32 Brands</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center bg-black/40">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total Customers</span>
            <p className="text-2xl font-semibold text-white">1,248 Accounts</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT: Merchant Verification Requests (2 Cols) */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <h3 className="font-['Cinzel'] text-base font-semibold tracking-wider text-white border-b border-white/5 pb-3">
            Merchant Applications ({requests.filter(r => r.status === 'pending').length})
          </h3>

          {requests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="glass p-10 text-center border border-white/5">
              <p className="text-zinc-500 text-xs tracking-wider">No pending applications left to verify.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div 
                  key={req.id} 
                  className={`glass p-6 border border-white/5 text-left space-y-4 transition-all ${
                    req.status === 'approved' ? 'opacity-50 border-green-500/20 bg-green-500/[0.02]' : ''
                  }`}
                >
                  <div className="flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="relative h-12 w-12 bg-zinc-950 overflow-hidden shrink-0 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={req.logo} alt={req.name} className="w-full h-full object-cover filter brightness-[0.8]" />
                      </div>
                      <div>
                        <h4 className="font-['Cinzel'] text-sm font-bold text-white tracking-wide">{req.name}</h4>
                        <span className="text-[10px] text-zinc-500">{req.ownerEmail}</span>
                      </div>
                    </div>

                    {req.status === 'approved' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Approved
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'approve')}
                          className="p-1.5 rounded border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black transition-all"
                          title="Verify Atelier"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'reject')}
                          className="p-1.5 rounded border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-black transition-all"
                          title="Reject Application"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-zinc-400 text-xs font-light leading-relaxed">{req.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Administrative adjustments & Security status (1 Col) */}
        <div className="space-y-6 text-left">
          <div className="glass p-6 border border-white/5 space-y-6">
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white border-b border-white/5 pb-3">
              System Adjustments
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="flex items-center gap-1.5"><Settings className="h-4 w-4 text-primary" /> Mode</span>
                <span className="text-white uppercase font-bold text-[10px] tracking-wider px-2 py-0.5 bg-black border border-white/10">Production Sandbox</span>
              </div>

              <div className="flex justify-between items-center text-zinc-400">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Security Rules</span>
                <span className="text-green-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                  ✓ Active Locked
                </span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            <div className="p-4 bg-amber-500/5 border border-amber-500/15 text-amber-500 rounded text-[10px] leading-relaxed flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
              <p>
                <strong>System Note:</strong> Multi-Vendor Connect split transfers are routing under Stripe test accounts. Verify live public keys before routing final transactions.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
