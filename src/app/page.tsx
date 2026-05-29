'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// Premium Curated Luxury Products for Immediate Visual Wow factor
const FEATURED_PRODUCTS = [
  {
    id: 'prod-trench-01',
    title: 'Bespoke Cashmere Trench Coat',
    slug: 'bespoke-cashmere-trench',
    price: 389000, // $3,890.00
    category: 'Haute Couture',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Maison de L’Or',
  },
  {
    id: 'prod-bag-02',
    title: 'Saddle Calfskin Duffel Bag',
    slug: 'calfskin-saddle-duffel',
    price: 185000, // $1,850.00
    category: 'Artisanal Leather',
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Velasco Leatherworks',
  },
  {
    id: 'prod-watch-03',
    title: 'Chrono Champagne Gold Watch',
    slug: 'chrono-champagne-gold',
    price: 495000, // $4,950.00
    category: 'Bespoke Jewelry',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Aurelia Timepieces',
  },
  {
    id: 'prod-dress-04',
    title: 'Silk Organza Evening Gown',
    slug: 'silk-organza-gown',
    price: 290000, // $2,900.00
    category: 'Haute Couture',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Maison de L’Or',
  }
];

export default function HomePage() {
  return (
    <div className="w-full relative bg-background pb-20">
      
      {/* 1. HERO SECTION WITH PARALLAX VIBE & DYNAMIC ACCENTS */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat filter brightness-[0.4]"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop")',
          }}
        />
        {/* Subtle radial shading overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

        <div className="relative z-10 text-center max-w-4xl px-6 space-y-8 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] tracking-[0.25em] uppercase font-medium">
            <Sparkles className="h-3 w-3" /> Paris • Milan • New York
          </div>
          
          <h1 className="font-['Cinzel'] text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.15em] text-white leading-tight">
            CURATED <br />
            <span className="gold-text">ELEGANCE</span>
          </h1>
          
          <p className="text-zinc-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed tracking-wider font-light">
            Indulge in a meticulously curated portfolio of high-fashion statements, bespoke couture, and hand-tailored leather works sourced directly from global ateliers.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link 
              href="/products" 
              className="px-8 py-3.5 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all duration-300 dark-gold-border rounded-none flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Explore Collection
            </Link>
            <Link 
              href="/products" 
              className="px-8 py-3.5 border border-white/20 text-white font-semibold text-xs tracking-[0.2em] uppercase hover:bg-white/5 transition-all duration-300 rounded-none"
            >
              Runway Edit
            </Link>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="glass p-8 text-center border border-white/5 flex flex-col items-center space-y-4">
            <div className="p-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-['Cinzel'] text-lg font-semibold tracking-wider text-white">Avant-Garde Curation</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-light">
              We exclusively partner with highly acclaimed independent fashion houses, selecting only a limited number of items to assure unparalleled uniqueness.
            </p>
          </div>

          <div className="glass p-8 text-center border border-white/5 flex flex-col items-center space-y-4">
            <div className="p-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-['Cinzel'] text-lg font-semibold tracking-wider text-white">Verified Authenticity</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-light">
              Every single product in our boutique undergoes rigorous verification by industry specialists to promise genuine designer craftsmanship.
            </p>
          </div>

          <div className="glass p-8 text-center border border-white/5 flex flex-col items-center space-y-4">
            <div className="p-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="font-['Cinzel'] text-lg font-semibold tracking-wider text-white">Split Vendor Checkout</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-light">
              Buy from multiple global brands in a single purchase. Our Stripe Connect architecture splits payouts and coordinates fulfillment securely.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CURATED FEATURED COLLECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold">Exquisite Additions</span>
          <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold tracking-widest text-white">THE RUNWAY PIECES</h2>
          <div className="h-[1px] w-24 bg-primary mx-auto opacity-40 mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURED_PRODUCTS.map((product) => (
            <Link 
              key={product.id} 
              href={`/products/${product.slug}`}
              className="group flex flex-col glass border border-white/5 transition-all duration-300 hover:transform hover:-translate-y-2 dark-gold-border text-left"
            >
              {/* Product Image Frame */}
              <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 brightness-[0.9]"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-black/60 text-primary text-[10px] tracking-widest uppercase px-2.5 py-1 backdrop-blur-sm border border-primary/20">
                  {product.category}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-3 bg-[#0a0a0d]">
                <div className="space-y-1">
                  <span className="text-[9px] tracking-wider text-zinc-500 uppercase">{product.vendorName}</span>
                  <h3 className="font-['Cinzel'] text-sm font-semibold text-white group-hover:text-primary transition-colors tracking-wide leading-tight line-clamp-1">
                    {product.title}
                  </h3>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-primary">{formatPrice(product.price)}</span>
                  <span className="text-[10px] text-zinc-500 group-hover:text-white group-hover:underline transition-all tracking-wider uppercase font-medium">
                    View Specs
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center pt-16">
          <Link 
            href="/products" 
            className="px-10 py-4 border border-primary text-primary hover:bg-primary hover:text-black font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 rounded-none inline-block"
          >
            Browse Full Catalog
          </Link>
        </div>
      </section>

      {/* 4. RUNWAY EDIT EDITORIAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden glass border border-white/10 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop" 
              alt="Editorial model" 
              className="w-full h-full object-cover filter brightness-[0.7]" 
            />
          </div>
          <div className="space-y-6 text-left">
            <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold">Behind The Seams</span>
            <h2 className="font-['Cinzel'] text-3xl sm:text-5xl font-bold tracking-widest text-white leading-tight">ARTISANAL SUSTAINABILITY</h2>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              At GLIMORE, we believe fashion should be eternal, not transient. Our curated collection focuses on limited-edition, slow-fashion masterpieces. By sourcing directly from independent creators, we support traditional couture techniques and guarantee ethical, high-standard working environments.
            </p>
            <div className="pt-4 border-t border-white/5">
              <blockquote className="font-['Cinzel'] text-base italic text-primary font-medium tracking-wide">
                "Fashion is the armor to survive the reality of everyday life."
              </blockquote>
              <cite className="block text-[10px] text-zinc-500 uppercase tracking-widest mt-2">— Maison de L’Or Creative Lead</cite>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
