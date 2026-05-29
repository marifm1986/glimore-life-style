'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050507] border-t border-white/5 text-zinc-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="space-y-4">
          <span className="font-['Cinzel'] text-xl font-bold tracking-[0.2em] gold-text">
            GLIMORE
          </span>
          <p className="text-zinc-600 leading-relaxed text-xs">
            A premium collective of elite independent fashion houses, artisans, and avant-garde designers producing sustainable, ethical, and high-fashion statement pieces.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-white font-['Cinzel'] tracking-widest text-xs uppercase mb-4 font-semibold">Collections</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/products" className="hover:text-primary transition-colors">Haute Couture</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Handmade Leather</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Fine Accessories</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Seasonal Curations</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-['Cinzel'] tracking-widest text-xs uppercase mb-4 font-semibold">Service</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/products" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Sizing Consultations</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Stripe Connect Portals</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="text-white font-['Cinzel'] tracking-widest text-xs uppercase mb-2 font-semibold">Newsletter</h4>
          <p className="text-zinc-600 text-xs">Subscribe to gain exclusive access to runway pre-orders and seasonal lookbooks.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex">
            <input 
              type="email" 
              placeholder="YOUR EMAIL" 
              className="bg-black border border-white/10 px-3 py-2 text-xs tracking-wider focus:outline-none focus:border-primary w-full text-white" 
            />
            <button 
              type="submit" 
              className="bg-primary text-black font-semibold text-xs tracking-wider px-4 py-2 hover:bg-opacity-90 transition-opacity"
            >
              JOIN
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-6 bg-black text-center text-[10px] tracking-widest uppercase text-zinc-700">
        <p>&copy; {new Date().getFullYear()} GLIMORE STYLE. All Rights Reserved. Built for Luxury Commerce.</p>
      </div>
    </footer>
  );
};

export default Footer;
