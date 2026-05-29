'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Sparkles, User, Award, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Credentials invalid. Please try again.');
      setLoading(false);
    }
  };

  const handleSimulatedLogin = async (role: 'customer' | 'vendor' | 'admin') => {
    setLoading(true);
    setError(null);

    const emailMap = {
      customer: 'customer@glimore.style',
      vendor: 'vendor@glimore.style',
      admin: 'admin@glimore.style',
    };

    try {
      await login(emailMap[role], 'password123');
      
      const destination = role === 'admin' ? '/admin' : role === 'vendor' ? '/vendor' : '/';
      router.push(destination);
    } catch (err: any) {
      setError('Simulation failed.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* LEFT: Branding Visual editorial */}
      <div className="hidden lg:block relative aspect-square overflow-hidden glass p-2">
        <div 
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.5]" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop")' }}
        />
        <div className="relative z-10 flex flex-col justify-end h-full p-8 text-left space-y-4">
          <span className="text-[10px] tracking-[0.3em] text-primary uppercase font-bold">Uncompromising Quality</span>
          <h2 className="font-['Cinzel'] text-3xl font-semibold text-white tracking-widest leading-tight">
            ESTABLISH YOUR GLIMORE PORTAL
          </h2>
          <p className="text-zinc-300 text-xs tracking-wider font-light leading-relaxed max-w-md">
            Unlock instant tracking updates, custom atelier order placement capabilities, and personal bespoke dress sizing archives.
          </p>
        </div>
      </div>

      {/* RIGHT: Login Box */}
      <div className="space-y-8 text-left max-w-md mx-auto w-full">
        
        {/* Header */}
        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Luxury Collective
          </span>
          <h1 className="font-['Cinzel'] text-3xl font-bold tracking-widest text-white">
            SIGN IN
          </h1>
        </div>

        {/* MOCK DEVELOPMENT QUICK SELECTORS */}
        <div className="glass p-5 border border-primary/20 space-y-3.5 bg-primary/5">
          <span className="text-[10px] tracking-widest text-primary uppercase font-bold block border-b border-primary/10 pb-1.5">
            🔑 Simulation Portal (Quick Login)
          </span>
          <p className="text-[10px] text-zinc-400 font-light">
            Instantly bypass Firebase Auth credentials to audit dashboard routes with simulated accounts.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleSimulatedLogin('customer')}
              className="py-2 bg-black border border-white/5 hover:border-primary text-white text-[10px] tracking-wider font-semibold uppercase flex flex-col items-center gap-1.5 transition-all"
            >
              <User className="h-4 w-4 text-zinc-400" />
              Customer
            </button>
            <button
              onClick={() => handleSimulatedLogin('vendor')}
              className="py-2 bg-black border border-white/5 hover:border-primary text-white text-[10px] tracking-wider font-semibold uppercase flex flex-col items-center gap-1.5 transition-all"
            >
              <Award className="h-4 w-4 text-zinc-400" />
              Vendor
            </button>
            <button
              onClick={() => handleSimulatedLogin('admin')}
              className="py-2 bg-black border border-white/5 hover:border-primary text-white text-[10px] tracking-wider font-semibold uppercase flex flex-col items-center gap-1.5 transition-all"
            >
              <Shield className="h-4 w-4 text-zinc-400" />
              Admin
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Email Address</label>
            <div className="relative">
              <input 
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
                required
              />
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Password</label>
            <div className="relative">
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
                required
              />
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            </div>
          </div>

          {error && (
            <p className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 p-2.5 font-medium tracking-wide">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none"
          >
            {loading ? 'Transmitting credentials...' : 'ENTER PORTAL'}
          </button>
        </form>

        <p className="text-xs text-zinc-500">
          New to the collective?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create an Account
          </Link>
        </p>

      </div>
    </div>
  );
}
