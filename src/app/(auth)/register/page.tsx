'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(email, password, name, role);
      
      const destination = role === 'vendor' ? '/vendor' : '/';
      router.push(destination);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different email.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* LEFT: Branding Editorial */}
      <div className="hidden lg:block relative aspect-square overflow-hidden glass p-2">
        <div 
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.5]" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop")' }}
        />
        <div className="relative z-10 flex flex-col justify-end h-full p-8 text-left space-y-4">
          <span className="text-[10px] tracking-[0.3em] text-primary uppercase font-bold">Designer Syndicate</span>
          <h2 className="font-['Cinzel'] text-3xl font-semibold text-white tracking-widest leading-tight">
            BECOME PART OF THE COLLECTIVE
          </h2>
          <p className="text-zinc-300 text-xs tracking-wider font-light leading-relaxed max-w-md">
            Whether you are a discerning designer cataloging your collections, or an elite client pursuing Haute Couture, registration unlocks the total Glimore ecosystem.
          </p>
        </div>
      </div>

      {/* RIGHT: Register Box */}
      <div className="space-y-8 text-left max-w-md mx-auto w-full">
        
        {/* Header */}
        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Luxury Collective
          </span>
          <h1 className="font-['Cinzel'] text-3xl font-bold tracking-widest text-white">
            REGISTER
          </h1>
        </div>

        {/* Regular Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Your Name / Business Title</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Elena Rostova / Velasco Leather"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
                required
              />
              <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            </div>
          </div>

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
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
                required
              />
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold block">Select Portal Access</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-3 text-xs font-semibold tracking-wider uppercase border transition-all ${
                  role === 'customer'
                    ? 'bg-primary text-black border-primary'
                    : 'bg-black text-zinc-400 border-white/10 hover:border-zinc-500'
                }`}
              >
                Discerning Client
              </button>
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={`py-3 text-xs font-semibold tracking-wider uppercase border transition-all ${
                  role === 'vendor'
                    ? 'bg-primary text-black border-primary'
                    : 'bg-black text-zinc-400 border-white/10 hover:border-zinc-500'
                }`}
              >
                Artisanal Merchant
              </button>
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
            {loading ? 'Initializing account secure profile...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-xs text-zinc-500">
          Already registered?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In Here
          </Link>
        </p>

      </div>
    </div>
  );
}
