'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Image from 'next/image';

export default function Footer() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getDocs(collection(db, 'inventory')).then((snap) => {
      const unique = Array.from(new Set(snap.docs.map(d => d.data().category).filter(Boolean))) as string[];
      setCategories(unique.slice(0, 6));
    });
  }, []);

  return (
    <footer className="bg-[#050507] border-t border-white/5 text-zinc-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="space-y-4">
         <Image src="/logo.webp" alt="GLIMORE LIFE STYLE Logo" width={120} height={120} className="object-contain rounded-md overflow-hidden" />
          <p className="text-zinc-600 leading-relaxed text-xs">
            A premium collective of elite independent fashion houses, artisans, and avant-garde designers producing sustainable, ethical, and high-fashion statement pieces.
          </p>
        </div>

        {/* Collections — real data */}
        <nav aria-label="Product collections">
          <h4 className="text-white font-['Cinzel'] tracking-widest text-xs uppercase mb-4 font-semibold">Collections</h4>
          <ul className="space-y-2 text-xs">
            {categories.length === 0 ? (
              <li className="text-zinc-700" aria-live="polite">Loading...</li>
            ) : (
              categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/products?category=${encodeURIComponent(cat)}`} className="hover:text-primary transition-colors">
                    {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </nav>

        {/* Service */}
        <nav aria-label="Service links">
          <h4 className="text-white font-['Cinzel'] tracking-widest text-xs uppercase mb-4 font-semibold">Service</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/products" className="hover:text-primary transition-colors">Shipping &amp; Returns</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Sizing Consultations</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Stripe Connect Portals</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
          </ul>
        </nav>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 id="newsletter-heading" className="text-white font-['Cinzel'] tracking-widest text-xs uppercase mb-2 font-semibold">Newsletter</h4>
          <p className="text-zinc-600 text-xs">Subscribe to gain exclusive access to runway pre-orders and seasonal lookbooks.</p>
          <form onSubmit={(e) => e.preventDefault()} aria-labelledby="newsletter-heading" className="flex">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="YOUR EMAIL"
              autoComplete="email"
              className="bg-black border border-white/10 px-3 py-2 text-xs tracking-wider focus:outline-none focus:border-primary w-full text-white"
            />
            <button
              type="submit"
              aria-label="Subscribe to newsletter"
              className="bg-primary text-black font-semibold text-xs tracking-wider px-4 py-2 hover:bg-opacity-90 transition-opacity"
            >
              JOIN
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-6 bg-black text-center text-[10px] tracking-widest uppercase text-zinc-700">
        <p>&copy; {new Date().getFullYear()} GLIMORE LIFE STYLE. All Rights Reserved. Built for Luxury Commerce.</p>
      </div>
    </footer>
  );
}
