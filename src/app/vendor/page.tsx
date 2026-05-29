'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { productSchema } from '@/lib/validations';
import { 
  Sparkles, Plus, Package, DollarSign, ShoppingCart, 
  Trash2, Edit, Upload, Eye, Check, X 
} from 'lucide-react';

interface LocalProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  status: 'draft' | 'active' | 'out-of-stock';
  image: string;
}

const INITIAL_VENDOR_PRODUCTS: LocalProduct[] = [
  {
    id: 'prod-bag-02',
    title: 'Saddle Calfskin Duffel Bag',
    price: 185000,
    category: 'Artisanal Leather',
    stock: 3,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'prod-chelsea-05',
    title: 'Nappa Leather Chelsea Boots',
    price: 68000,
    category: 'Artisanal Leather',
    stock: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800&auto=format&fit=crop',
  }
];

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<LocalProduct[]>(INITIAL_VENDOR_PRODUCTS);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(1);
  const [category, setCategory] = useState('Haute Couture');
  const [imageUrl, setImageUrl] = useState('');

  // Handle image upload simulation
  const handleImageSimulation = async () => {
    setUploadingImage(true);
    try {
      // 1. Test Cloudinary Signature route
      const sigRes = await fetch('/api/cloudinary/sign');
      const sigData = await sigRes.json();
      
      console.log('Signature acquired:', sigData);

      // Simulate network wait
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set a premium high-res image
      const luxuryMockImages = [
        'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop'
      ];
      const randomImage = luxuryMockImages[Math.floor(Math.random() * luxuryMockImages.length)];
      
      setImageUrl(randomImage);
    } catch (e) {
      console.error('Image signature mock failing:', e);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationError(null);

    // Convert price to cents
    const priceInCents = Math.round(price * 100);

    const payload = {
      title,
      description,
      price: priceInCents,
      category,
      stock,
      status: 'active' as const,
      images: [
        {
          publicId: `mock-img-${Date.now()}`,
          url: imageUrl || 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop',
          thumbnailUrl: imageUrl || 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop',
        }
      ]
    };

    // Zod verification
    const result = productSchema.safeParse(payload);
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    // Add product to local state
    const newProduct: LocalProduct = {
      id: `prod-${Math.random().toString(36).substr(2, 5)}`,
      title: result.data.title,
      price: result.data.price,
      stock: result.data.stock,
      category: result.data.category,
      status: 'active',
      image: result.data.images[0].url,
    };

    setProducts([newProduct, ...products]);
    setFormOpen(false);
    
    // Clear form
    setTitle('');
    setDescription('');
    setPrice(0);
    setStock(1);
    setImageUrl('');
    setLoading(false);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6 text-left">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Atelier Syndicate Hub
          </span>
          <h1 className="font-['Cinzel'] text-3xl font-bold tracking-widest text-white">
            {user?.displayName || 'Merchant Atelier'}
          </h1>
        </div>

        <button 
          onClick={() => setFormOpen(true)}
          className="px-6 py-3 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none flex items-center gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" /> Onboard Creation
        </button>
      </div>

      {/* METRIC GRAPH SHIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total Revenue</span>
            <p className="text-2xl font-semibold text-primary">{formatPrice(1986000)}</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Fulfillments</span>
            <p className="text-2xl font-semibold text-white">12 Orders</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-6 border border-white/5 text-left flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Creations Catalog</span>
            <p className="text-2xl font-semibold text-white">{products.length} Products</p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* PRODUCTS ATELIER TABLE */}
      <div className="glass border border-white/5 text-left overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">Atelier Collection</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400">
            <thead className="bg-[#07070a] text-zinc-500 uppercase tracking-widest text-[9px] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Creation</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0a0a0d]">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="relative h-10 w-8 bg-zinc-950 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate max-w-[200px]">{p.title}</span>
                  </td>
                  <td className="px-6 py-4 tracking-wider">{p.category}</td>
                  <td className="px-6 py-4 text-primary font-semibold">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4 font-mono font-medium">{p.stock}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button className="text-zinc-500 hover:text-white transition-colors" title="Quick View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-zinc-500 hover:text-primary transition-colors" title="Edit Catalog">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-zinc-500 hover:text-destructive transition-colors" 
                      title="Decommission Creation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: PRODUCT ONBOARDING FORM */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-left animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wider text-white">
                Onboard Atelier Creation
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProduct} className="space-y-4">
              
              {/* Product Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Creation Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Silk Lace Bodice Gown"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Designer Notes / Description</label>
                <textarea 
                  placeholder="Details of materials, artisanal process, and fits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white h-24"
                  required
                />
              </div>

              {/* Numbers grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Price (BDT)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g. 1850.00"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Atelier Stock</label>
                  <input 
                    type="number" 
                    placeholder="1"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    required
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Collection Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
                >
                  <option value="Haute Couture">Haute Couture</option>
                  <option value="Artisanal Leather">Artisanal Leather</option>
                  <option value="Bespoke Jewelry">Bespoke Jewelry</option>
                </select>
              </div>

              {/* Image uploader */}
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold block">Creations Graphic (Cloudinary)</label>
                
                {imageUrl ? (
                  <div className="relative aspect-[3/4] h-28 w-20 overflow-hidden bg-zinc-950 border border-white/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-destructive hover:bg-black"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleImageSimulation}
                    disabled={uploadingImage}
                    className="w-full py-6 border border-dashed border-white/10 hover:border-primary text-zinc-500 hover:text-white flex flex-col items-center justify-center gap-2 bg-black transition-all"
                  >
                    <Upload className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-[10px] tracking-wider uppercase font-semibold">
                      {uploadingImage ? 'Generating Secure signature...' : 'Transmit Image to Cloudinary'}
                    </span>
                  </button>
                )}
              </div>

              {validationError && (
                <p className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 p-2.5 font-medium tracking-wide">
                  ⚠ {validationError}
                </p>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-opacity-95 transition-all dark-gold-border rounded-none"
              >
                {loading ? 'Submitting secure payload...' : 'PUBLISH CREATION'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
