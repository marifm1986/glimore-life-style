'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowLeft, Heart, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface InventoryItem {
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
  description?: string;
  variants?: string[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addToCart } = useCart();
  const [product, setProduct] = useState<(InventoryItem & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [variantError, setVariantError] = useState(false);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'inventory', slug))
      .then((snap) => {
        if (snap.exists()) {
          setProduct({ id: snap.id, ...(snap.data() as InventoryItem) });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants && !selectedVariant) {
      setVariantError(true);
      return;
    }
    addToCart({
      productId: product.id,
      title: product.productName,
      price: product.price,
      quantity,
      image: product.image,
      vendorId: '',
      vendorName: product.collection,
      ...(selectedVariant ? { variant: selectedVariant } : {}),
    });
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-3/4 bg-white/5 animate-pulse" />
          <div className="space-y-6 pt-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-white/5 animate-pulse rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <p className="text-zinc-400 text-sm">This piece could not be found.</p>
        <Link href="/products" className="text-primary text-xs underline tracking-wider">Back to Boutique</Link>
      </div>
    );
  }

  const details = [
    `Material: ${product.material}`,
    `Gemstone: ${product.gemstone}`,
    `Collection: ${product.collection}`,
    `SKU: ${product.sku}`,
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link href="/products" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs tracking-widest uppercase mb-10 transition-colors font-medium">
        <ArrowLeft className="h-4 w-4 text-primary" /> Back to Boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Image */}
        <div className="relative aspect-3/4 overflow-hidden glass border border-white/10 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.productName}
            className="w-full h-full object-cover filter brightness-[0.95]"
          />
          <span className="absolute top-6 left-6 bg-black/70 text-primary text-[10px] tracking-widest uppercase px-3 py-1.5 backdrop-blur-sm border border-primary/20">
            {product.category}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-8 text-left">

          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> {product.collection} Collection
            </span>
            <h1 className="font-['Montserrat'] text-3xl sm:text-4xl font-bold tracking-widest text-white leading-tight">
              {product.productName}
            </h1>
            <p className="text-2xl font-semibold text-primary">{formatPrice(product.price)}</p>
          </div>

          <div className="h-px w-full bg-white/5" />

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">About This Product</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">{product.description}</p>
            </div>
          )}

          {/* Specs */}
          <div className="space-y-3">
            <h3 className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Creation Specs</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.map((detail, idx) => (
                <li key={idx} className="text-xs text-zinc-400 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px w-full bg-white/5" />

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
                  Select Option
                  {selectedVariant && (
                    <span className="ml-2 text-primary normal-case tracking-normal font-bold">— {selectedVariant}</span>
                  )}
                </h3>
                {variantError && (
                  <span className="text-[10px] text-red-400 font-semibold">Please select an option</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setSelectedVariant(v); setVariantError(false); }}
                    className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                      selectedVariant === v
                        ? 'bg-primary text-black border-primary'
                        : 'border-white/15 text-zinc-400 hover:border-primary/60 hover:text-white bg-transparent'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Inventory Status:</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
              product.status === 'in-stock'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : product.status === 'low-stock'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {product.status === 'in-stock'
                ? `In Stock (${product.stock} pieces)`
                : product.status === 'low-stock'
                ? `Limited (${product.stock} left)`
                : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex flex-wrap gap-4 items-center pt-2">
            <div className="flex border border-white/10 bg-black">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-zinc-500 hover:text-white text-sm"
                disabled={product.status === 'out-of-stock'}
              >
                -
              </button>
              <span className="px-4 py-2.5 text-xs text-white flex items-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="px-4 py-2.5 text-zinc-500 hover:text-white text-sm"
                disabled={product.status === 'out-of-stock'}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.status === 'out-of-stock'}
              className="grow px-8 py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-4 w-4" />
              {product.status === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button className="p-3 border border-white/10 hover:border-primary/50 text-zinc-400 hover:text-primary transition-all">
              <Heart className="h-4 w-4" />
            </button>
          </div>

          {addedMessage && (
            <p className="text-xs text-green-400 font-semibold tracking-wider animate-fadeIn">
              ✓ Added to your Glimore cart!
            </p>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="flex gap-3 items-start">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide">Secure Atelier Routing</h4>
                <p className="text-[10px] text-zinc-500 leading-normal">Direct encrypted vendor payout routing powered by Stripe Connect.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <RefreshCw className="h-5 w-5 text-primary shrink-0" />
              <div>
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
