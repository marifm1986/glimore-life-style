'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Grid, List, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const PRODUCT_LIST = [
  {
    id: 'prod-trench-01',
    title: 'Bespoke Cashmere Trench Coat',
    slug: 'bespoke-cashmere-trench',
    price: 389000,
    category: 'Haute Couture',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Maison de L’Or',
    stock: 5,
    description: 'Artfully hand-tailored from premium 100% Mongolian Cashmere. Designed with structured shoulders, double-breasted buttons, and deep silk-lined pockets. A lifetime wardrobe statement piece.',
  },
  {
    id: 'prod-bag-02',
    title: 'Saddle Calfskin Duffel Bag',
    slug: 'calfskin-saddle-duffel',
    price: 185000,
    category: 'Artisanal Leather',
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Velasco Leatherworks',
    stock: 3,
    description: 'Forged with raw saddle-grade vegetable tanned calfskin leather. Double hand-stitched with waxed linen threads and loaded with custom brushed solid brass buckles. Develops a rich amber patina.',
  },
  {
    id: 'prod-watch-03',
    title: 'Chrono Champagne Gold Watch',
    slug: 'chrono-champagne-gold',
    price: 495000,
    category: 'Bespoke Jewelry',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Aurelia Timepieces',
    stock: 2,
    description: 'Precision Japanese high-beat automatic movement set inside an unblemished 18k Champagne gold plated stainless steel casing. Sapphire crystal lens with full calendar sub-dials.',
  },
  {
    id: 'prod-dress-04',
    title: 'Silk Organza Evening Gown',
    slug: 'silk-organza-gown',
    price: 290000,
    category: 'Haute Couture',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Maison de L’Or',
    stock: 4,
    description: 'Float seamlessly across runways. Layered silk organza silhouette featuring an elegant drop-waist corseted bodice and subtle hand-sewn metallic lace applications.',
  },
  {
    id: 'prod-chelsea-05',
    title: 'Nappa Leather Chelsea Boots',
    slug: 'nappa-leather-chelsea',
    price: 68000, // $680.00
    category: 'Artisanal Leather',
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Velasco Leatherworks',
    stock: 8,
    description: 'Super-soft Italian Nappa leather uppers with flexible double-elastic goring. Hand-finished Goodyear welted sole guarantees absolute foot support and longevity.',
  },
  {
    id: 'prod-ring-06',
    title: 'Diamond Halo Solitaire Ring',
    slug: 'diamond-halo-solitaire',
    price: 890000, // $8,900.00
    category: 'Bespoke Jewelry',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
    vendorName: 'Aurelia Timepieces',
    stock: 1,
    description: 'VVS1 clarity 1.5 carat round brilliant center-cut diamond surrounded by a high-brilliance diamond pavé micro-halo in solid 950 Platinum band.',
  }
];

export default function CollectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState(1000000); // Up to $10,000

  const categories = ['All', 'Haute Couture', 'Artisanal Leather', 'Bespoke Jewelry'];

  const filteredProducts = useMemo(() => {
    return PRODUCT_LIST.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesPrice = product.price <= priceRange;
      
      return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0; // Default featured ranking
    });
  }, [searchTerm, selectedCategory, sortBy, priceRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header Banner */}
      <div className="text-center space-y-4 mb-12">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3" /> Designer Portfolio
        </span>
        <h1 className="font-['Cinzel'] text-4xl sm:text-5xl font-bold tracking-widest text-white">THE BOUTIQUE</h1>
        <p className="text-zinc-500 text-xs sm:text-sm tracking-wider max-w-xl mx-auto font-light">
          Browse through our current global collections. Each item is manufactured on-demand or in extremely small boutique quantities.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* FILTER SIDEBAR FRAME */}
        <aside className="w-full lg:w-64 space-y-8 glass p-6 border border-white/5 h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter Options
            </h3>
          </div>

          {/* Search bar */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Search</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Categories</label>
            <div className="flex flex-col gap-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-left text-xs py-1.5 px-2.5 transition-all tracking-wider ${
                    selectedCategory === category
                      ? 'bg-primary text-black font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
              <span>Max Price</span>
              <span className="text-primary font-bold">{formatPrice(priceRange)}</span>
            </div>
            <input 
              type="range" 
              min={10000} 
              max={1000000} 
              step={10000} 
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-primary bg-zinc-800"
            />
          </div>

          {/* Sorter Selection */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-black border border-white/10 px-2 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
            >
              <option value="featured">Featured Designer</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* PRODUCTS CATALOG LIST */}
        <section className="flex-grow space-y-6">
          <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-white/5">
            <p>Showing <strong className="text-white">{filteredProducts.length}</strong> creations</p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="glass p-12 text-center border border-white/5 space-y-4">
              <p className="text-zinc-400 text-sm font-light">No garments match your active filters.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setPriceRange(1000000); }} 
                className="text-primary text-xs underline font-semibold tracking-wider hover:opacity-80"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.slug}`}
                  className="group flex flex-col glass border border-white/5 transition-all duration-300 hover:transform hover:-translate-y-2 dark-gold-border text-left"
                >
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
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
