'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowLeft, Heart, Sparkles, Shield, RefreshCw, Send } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const PRODUCT_DATABASE = [
  {
    id: 'prod-trench-01',
    title: 'Bespoke Cashmere Trench Coat',
    slug: 'bespoke-cashmere-trench',
    price: 389000,
    category: 'Haute Couture',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop',
    vendorId: 'vendor-maison-01',
    vendorName: 'Maison de L’Or',
    stock: 5,
    description: 'Artfully hand-tailored from premium 100% Mongolian Cashmere. Designed with structured shoulders, double-breasted custom horn buttons, and deep silk-lined pockets. An exquisite statement of timeless luxury and insulation.',
    details: [
      '100% Mongolian Cashmere outer shell',
      '100% Habotai Silk custom monogram lining',
      'Double hand-stitched pick accents',
      'Handmade in Paris, France'
    ]
  },
  {
    id: 'prod-bag-02',
    title: 'Saddle Calfskin Duffel Bag',
    slug: 'calfskin-saddle-duffel',
    price: 185000,
    category: 'Artisanal Leather',
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop',
    vendorId: 'vendor-velasco-99',
    vendorName: 'Velasco Leatherworks',
    stock: 3,
    description: 'Forged with raw saddle-grade vegetable tanned calfskin leather. Double hand-stitched with heavy waxed linen threads and loaded with custom brushed solid brass buckles. Develops a highly sought-after rich amber patina with age.',
    details: [
      'Genuine full-grain Italian calfskin leather',
      'Pure solid brass hardware elements',
      'Hand-stitched using traditional saddle stitch',
      'Lifetime warranty on structure'
    ]
  },
  {
    id: 'prod-watch-03',
    title: 'Chrono Champagne Gold Watch',
    slug: 'chrono-champagne-gold',
    price: 495000,
    category: 'Bespoke Jewelry',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
    vendorId: 'vendor-aurelia-03',
    vendorName: 'Aurelia Timepieces',
    stock: 2,
    description: 'Precision Japanese high-beat automatic movement set inside an unblemished 18k Champagne gold plated stainless steel casing. Sapphire crystal lens with full chronograph and calendar sub-dials.',
    details: [
      '18k Champagne Gold plated case & band',
      'Scratch-resistant Sapphire crystal glass',
      'Precision Japanese 28,800 bph movement',
      'Water resistant to 50 meters (5 ATM)'
    ]
  },
  {
    id: 'prod-dress-04',
    title: 'Silk Organza Evening Gown',
    slug: 'silk-organza-gown',
    price: 290000,
    category: 'Haute Couture',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    vendorId: 'vendor-maison-01',
    vendorName: 'Maison de L’Or',
    stock: 4,
    description: 'Float seamlessly across runways. Layered silk organza silhouette featuring an elegant drop-waist corseted bodice, subtle hand-sewn metallic lace details, and a flowing tiered train.',
    details: [
      '100% Premium Mulberry Silk Organza',
      'Hand-applied French metallic lace detailing',
      'Built-in inner structure bone corsetry',
      'Dry clean only'
    ]
  },
  {
    id: 'prod-chelsea-05',
    title: 'Nappa Leather Chelsea Boots',
    slug: 'nappa-leather-chelsea',
    price: 68000,
    category: 'Artisanal Leather',
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800&auto=format&fit=crop',
    vendorId: 'vendor-velasco-99',
    vendorName: 'Velasco Leatherworks',
    stock: 8,
    description: 'Super-soft Italian Nappa leather uppers with flexible double-elastic goring. Hand-finished Goodyear welted sole guarantees absolute foot support, premium water resistance, and longevity.',
    details: [
      'Premium Italian Nappa calf leather upper',
      'Goodyear welted leather sole construction',
      'Tonal leather pull tabs & elastic side gore',
      'Resoleable build'
    ]
  },
  {
    id: 'prod-ring-06',
    title: 'Diamond Halo Solitaire Ring',
    slug: 'diamond-halo-solitaire',
    price: 890000,
    category: 'Bespoke Jewelry',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
    vendorId: 'vendor-aurelia-03',
    vendorName: 'Aurelia Timepieces',
    stock: 1,
    description: 'VVS1 clarity 1.5 carat round brilliant center-cut diamond surrounded by a high-brilliance diamond pavé micro-halo in solid 950 Platinum band.',
    details: [
      '1.5 carat round brilliant center-cut diamond',
      'VVS1 Clarity, Color D (Colorless)',
      'Solid 950 Platinum secure micro-pavé band',
      'Includes GIA Grading Certification'
    ]
  }
];

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const product = PRODUCT_DATABASE.find(p => p.slug === slug) || PRODUCT_DATABASE[0];

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity,
      image: product.image,
      vendorId: product.vendorId,
      vendorName: product.vendorName
    });

    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Back Button */}
      <Link href="/products" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs tracking-widest uppercase mb-10 transition-colors font-medium">
        <ArrowLeft className="h-4 w-4 text-primary" /> Back to Boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* LEFT: Elegant Image frame with floating indicators */}
        <div className="relative aspect-[3/4] overflow-hidden glass border border-white/10 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-cover filter brightness-[0.95]" 
          />
          <span className="absolute top-6 left-6 bg-black/70 text-primary text-[10px] tracking-widest uppercase px-3 py-1.5 backdrop-blur-sm border border-primary/20">
            {product.category}
          </span>
        </div>

        {/* RIGHT: Sophisticated Purchase Panel */}
        <div className="space-y-8 text-left">
          
          {/* Product Header */}
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Crafted by {product.vendorName}
            </span>
            <h1 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold tracking-widest text-white leading-tight">
              {product.title}
            </h1>
            <p className="text-2xl font-semibold text-primary">{formatPrice(product.price)}</p>
          </div>

          <div className="h-[1px] w-full bg-white/5" />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Designer Notes</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              {product.description}
            </p>
          </div>

          {/* Core Specs */}
          <div className="space-y-3">
            <h3 className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Creations Specs</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.details.map((detail, idx) => (
                <li key={idx} className="text-xs text-zinc-400 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-[1px] w-full bg-white/5" />

          {/* Stock state */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Inventory Status:</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
              product.stock > 2 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-primary border border-primary/20'
            }`}>
              {product.stock > 0 ? `Limited Edition (${product.stock} pieces left)` : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity and Actions */}
          <div className="flex flex-wrap gap-4 items-center pt-2">
            
            {/* Quantity adjust */}
            <div className="flex border border-white/10 bg-black">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-zinc-500 hover:text-white text-sm"
              >
                -
              </button>
              <span className="px-4 py-2.5 text-xs text-white flex items-center font-medium">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="px-4 py-2.5 text-zinc-500 hover:text-white text-sm"
              >
                +
              </button>
            </div>

            {/* Main Add Button */}
            <button
              onClick={handleAddToCart}
              className="flex-grow px-8 py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none flex justify-center items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Order
            </button>

            {/* Favorite button */}
            <button className="p-3 border border-white/10 hover:border-primary/50 text-zinc-400 hover:text-primary transition-all">
              <Heart className="h-4 w-4" />
            </button>
          </div>

          {/* Feedback messages */}
          {addedMessage && (
            <p className="text-xs text-green-400 font-semibold tracking-wider animate-fadeIn">
              ✓ Added to your Glimore cart!
            </p>
          )}

          {/* Secure details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="flex gap-3 items-start">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <h4 className="text-xs font-semibold text-white tracking-wide">Secure Atelier Routing</h4>
                <p className="text-[10px] text-zinc-500 leading-normal">Direct encrypted vendor payout routing powered by Stripe Connect.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <RefreshCw className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <h4 className="text-xs font-semibold text-white tracking-wide">Express Delivery</h4>
                <p className="text-[10px] text-zinc-500 leading-normal">Insured premium worldwide shipping with dynamic tracking.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
