'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
  material: string;
  gemstone: string;
  collection: string;
}

export default function CollectionPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState(0);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<InventoryItem, 'id'>) })));
      setDataLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const minPrice = useMemo(() => items.length ? Math.min(...items.map(i => i.price)) : 0, [items]);
  const maxPrice = useMemo(() => items.length ? Math.max(...items.map(i => i.price)) : 0, [items]);

  useEffect(() => {
    if (maxPrice > 0) setPriceRange(maxPrice);
  }, [maxPrice]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map(i => i.category)))],
    [items]
  );

  const filteredProducts = useMemo(() => {
    return items
      .filter(item => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = item.productName.toLowerCase().includes(q) ||
                              item.collection.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesPrice = item.price <= priceRange;
        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [items, searchTerm, selectedCategory, sortBy, priceRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header Banner */}
      <div className="text-center space-y-4 mb-12">
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3" /> Clothing &bull; Shoes &bull; Hoodies
        </span>
        <h1 className="font-['Cinzel'] text-4xl sm:text-5xl font-bold tracking-widest text-white">THE UNIQUE COLLECTION</h1>
        <p className="text-zinc-500 text-xs sm:text-sm tracking-wider max-w-xl mx-auto font-light">
          Explore our full range of premium clothing, footwear, and hoodies — crafted for style, comfort, and everyday wear.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">

        {/* Filter Sidebar */}
        <aside className="w-full lg:w-64 space-y-8 glass p-6 border border-white/5 h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter Options
            </h3>
          </div>

          {/* Search */}
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

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Categories</label>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left text-xs py-1.5 px-2.5 transition-all tracking-wider ${
                    selectedCategory === cat
                      ? 'bg-primary text-black font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
              <span>Price Range</span>
              <span className="text-primary font-bold">{formatPrice(priceRange)}</span>
            </div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={Math.max(1, Math.round((maxPrice - minPrice) / 100))}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-primary bg-zinc-800"
              disabled={maxPrice === 0}
            />
            <div className="flex justify-between text-[9px] text-zinc-600">
              <span>{formatPrice(minPrice)}</span>
              <span>{formatPrice(maxPrice)}</span>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-black border border-white/10 px-2 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-grow space-y-6">
          <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-white/5">
            {dataLoading
              ? <p>Loading collection...</p>
              : <p>Showing <strong className="text-white">{filteredProducts.length}</strong> creations</p>
            }
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass border border-white/5 animate-pulse">
                  <div className="aspect-[3/4] bg-white/5" />
                  <div className="p-5 space-y-2">
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass p-12 text-center border border-white/5 space-y-4">
              <p className="text-zinc-400 text-sm font-light">No items match your active filters.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setPriceRange(1000000); }}
                className="text-primary text-xs underline font-semibold tracking-wider hover:opacity-80"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="group flex flex-col glass border border-white/5 transition-all duration-300 hover:transform hover:-translate-y-2 dark-gold-border text-left"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 brightness-[0.9]"
                      loading="lazy"
                    />
                    <span className="absolute top-4 left-4 bg-black/60 text-primary text-[10px] tracking-widest uppercase px-2.5 py-1 backdrop-blur-sm border border-primary/20">
                      {item.category}
                    </span>
                    {item.status === 'out-of-stock' && (
                      <span className="absolute top-4 right-4 bg-black/80 text-red-400 text-[10px] tracking-widest uppercase px-2.5 py-1 border border-red-500/20">
                        Sold Out
                      </span>
                    )}
                    {item.status === 'low-stock' && (
                      <span className="absolute top-4 right-4 bg-black/80 text-amber-400 text-[10px] tracking-widest uppercase px-2.5 py-1 border border-amber-500/20">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-3 bg-[#0a0a0d]">
                    <div className="space-y-1">
                      <span className="text-[9px] tracking-wider text-zinc-500 uppercase">{item.collection}</span>
                      <h3 className="font-['Cinzel'] text-sm font-semibold text-white group-hover:text-primary transition-colors tracking-wide leading-tight line-clamp-1">
                        {item.productName}
                      </h3>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{item.material} · {item.gemstone}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-xs font-semibold text-primary">{formatPrice(item.price)}</span>
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
