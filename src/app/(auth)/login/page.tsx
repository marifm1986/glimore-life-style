'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

      {/* LEFT: Branding */}
      <div className="hidden lg:block relative aspect-square overflow-hidden glass p-2" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.5]"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop")' }}
        />
        <div className="relative z-10 flex flex-col justify-end h-full p-8 text-left space-y-4">
          <span className="text-[10px] tracking-[0.3em] text-primary uppercase font-bold">Uncompromising Quality</span>
          <h2 className="font-['Montserrat'] text-3xl font-semibold text-white tracking-widest leading-tight">
            ESTABLISH YOUR GLIMORE PORTAL
          </h2>
          <p className="text-zinc-300 text-xs tracking-wider font-light leading-relaxed max-w-md">
            Unlock instant tracking updates, custom atelier order placement capabilities, and personal bespoke dress sizing archives.
          </p>
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div className="space-y-8 text-left max-w-md mx-auto w-full">

        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Luxury Collective
          </span>
          <h1 className="font-['Montserrat'] text-3xl font-bold tracking-widest text-white">
            SIGN IN
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          aria-label="Sign in form"
          aria-describedby={error ? 'login-error' : undefined}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
              Email Address
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
                required
              />
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
                required
              />
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
            </div>
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 p-2.5 font-medium tracking-wide">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-disabled={loading}
            className="w-full py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'ENTER PORTAL'}
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
