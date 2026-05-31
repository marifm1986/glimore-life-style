'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { Sparkles, Plus, Package, DollarSign, ShoppingCart, Trash2, Edit2, Upload, Camera, X, ImageIcon, Search } from 'lucide-react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, where, orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

async function compressImage(file: File): Promise<Blob> {
  const MAX_DIM = 1200;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (evt) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
          'image/jpeg', 0.82,
        );
      };
      img.src = evt.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function uploadToCloudinary(blob: Blob, filename: string, onProgress: (pct: number) => void): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) return Promise.reject(new Error('Cloudinary env vars missing'));
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'inventory');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve((JSON.parse(xhr.responseText) as { secure_url: string }).secure_url);
      } else {
        let detail = `HTTP ${xhr.status}`;
        try { const b = JSON.parse(xhr.responseText) as { error?: { message?: string } }; if (b.error?.message) detail = b.error.message; } catch { /* */ }
        reject(new Error(`Cloudinary: ${detail}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

interface VendorProduct {
  id: string;
  productName: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
  material: string;
  collection: string;
  vendorId: string;
}

interface OrderItem { productId: string; title: string; quantity: number; price: number; vendorId: string; }
interface FirestoreOrder {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
}

type FormData = Omit<VendorProduct, 'id' | 'vendorId'>;

const CATEGORIES = ['CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'ELECTRONICS', 'HOME & LIVING', 'BEAUTY', 'SPORTS', 'JEWELRY'];

const EMPTY_FORM: FormData = {
  productName: '', description: '', price: 0, stock: 1,
  category: 'CLOTHING', status: 'in-stock', image: '', material: '', collection: '',
};

function deriveStatus(stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 5) return 'low-stock';
  return 'in-stock';
}

function statusStyle(s: string) {
  if (s === 'in-stock') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (s === 'low-stock') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border border-red-500/20';
}

export default function VendorDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<VendorProduct | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'vendor' && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) return;

    const unsubProducts = onSnapshot(
      query(collection(db, 'inventory'), where('vendorId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as VendorProduct)));
        setDataLoading(false);
      }
    );

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders')),
      (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOrder)))
    );

    return () => { unsubProducts(); unsubOrders(); };
  }, [loading, user]);

  const vendorOrders = useMemo(
    () => orders.filter(o => o.items?.some(i => i.vendorId === user?.uid)),
    [orders, user]
  );

  const totalRevenue = useMemo(
    () => vendorOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.items.filter(i => i.vendorId === user?.uid).reduce((s, i) => s + i.price * i.quantity, 0), 0),
    [vendorOrders, user]
  );

  const filtered = useMemo(
    () => products.filter(p => p.productName.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  if (loading || !user) return <div className="min-h-96 flex items-center justify-center"><p className="text-zinc-500 text-xs">Verifying vendor access...</p></div>;

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, collection: user.displayName || '' });
    setEditTarget(null);
    setModalMode('create');
    setModalOpen(true);
    setError(null);
  };

  const openEdit = (p: VendorProduct) => {
    const { id: _id, vendorId: _v, ...rest } = p;
    setForm(rest);
    setEditTarget(p);
    setModalMode('edit');
    setModalOpen(true);
    setError(null);
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true); setUploadProgress(0); setError(null);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToCloudinary(compressed, file.name, setUploadProgress);
      setForm(prev => ({ ...prev, image: url }));
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false); setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true); setError(null);
    try {
      const priceInCents = Math.round(form.price * 100);
      const status = deriveStatus(form.stock);
      const sku = `VND-${user.uid.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const payload = {
        ...form,
        price: priceInCents,
        status,
        vendorId: user.uid,
        vendorName: user.displayName,
        sku: editTarget?.['sku' as keyof VendorProduct] ?? sku,
        gemstone: '',
        isFeatured: false,
        updatedAt: serverTimestamp(),
      };
      if (modalMode === 'create') {
        await addDoc(collection(db, 'inventory'), { ...payload, createdAt: serverTimestamp() });
      } else if (editTarget) {
        await updateDoc(doc(db, 'inventory', editTarget.id), payload);
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'inventory', deleteId));
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Vendor Hub
          </span>
          <h1 className="font-['Montserrat'] text-3xl font-bold tracking-widest text-white">{user.displayName || 'My Store'}</h1>
        </div>
        <button onClick={openCreate} className="px-6 py-3 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-opacity-95 transition-all shrink-0">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Revenue (Paid)', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-primary' },
          { label: 'Total Orders', value: `${vendorOrders.length} Orders`, icon: ShoppingCart, color: 'text-white' },
          { label: 'My Products', value: `${products.length} Products`, icon: Package, color: 'text-white' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass p-6 border border-white/5 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{label}</span>
              <p className={`text-2xl font-semibold ${color}`}>{dataLoading ? '—' : value}</p>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 flex items-center justify-between">
          {error} <button onClick={() => setError(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your products..."
          className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
      </div>

      {/* Products Table */}
      <div className="glass border border-white/5 overflow-hidden">
        {dataLoading ? (
          <div className="py-16 text-center text-zinc-600 text-xs">Loading your products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-zinc-400">
              <thead className="bg-black/40 text-zinc-600 uppercase tracking-widest text-[9px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold">Product</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Category</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Stock</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Price</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-600">
                      {search ? 'No products match your search.' : 'You have no products yet. Add your first one.'}
                    </td>
                  </tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.image
                          ? <img src={p.image} alt={p.productName} className="h-9 w-9 object-cover border border-white/10 shrink-0" />
                          : <div className="h-9 w-9 border border-white/10 bg-white/5 flex items-center justify-center shrink-0"><ImageIcon className="h-4 w-4 text-zinc-700" /></div>
                        }
                        <span className="font-medium text-white text-[11px] truncate max-w-45">{p.productName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 uppercase tracking-wider">{p.category}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-medium text-white">{p.stock}</td>
                    <td className="px-5 py-3.5 text-right text-primary font-semibold">{formatPrice(p.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusStyle(p.status)}`}>
                        {p.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">
                {modalMode === 'create' ? 'Add Product' : 'Edit Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} disabled={isSaving} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Product Name</label>
                <input type="text" required value={form.productName}
                  onChange={e => setForm(p => ({ ...p, productName: e.target.value }))}
                  placeholder="e.g. Classic Wool Blazer"
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                  disabled={isSaving} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Product details, materials, sizing..."
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white resize-none"
                  disabled={isSaving} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Price (BDT)</label>
                  <input type="number" required min={1} step={0.01} value={form.price || ''}
                    onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 1500"
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    disabled={isSaving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Stock</label>
                  <input type="number" required min={0} value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    disabled={isSaving} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
                    disabled={isSaving}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Material</label>
                  <input type="text" value={form.material}
                    onChange={e => setForm(p => ({ ...p, material: e.target.value }))}
                    placeholder="e.g. Cotton, Leather"
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    disabled={isSaving} />
                </div>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold block">Product Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />

                {form.image && !isUploading && (
                  <div className="relative w-fit">
                    <img src={form.image} alt="Preview" className="h-28 w-28 object-cover border border-white/10" />
                    <button type="button" onClick={() => setForm(p => ({ ...p, image: '' }))}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {!form.image && !isUploading && (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all disabled:opacity-50">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all disabled:opacity-50">
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </button>
                  </div>
                )}

                {form.image && !isUploading && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-1.5 border border-white/10 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
                    <Upload className="h-3 w-3" /> Replace
                  </button>
                )}

                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <ImageIcon className="h-3.5 w-3.5 text-primary animate-pulse" />
                      <span>Uploading… {uploadProgress ?? 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1">
                      <div className="h-1 bg-primary transition-all duration-200" style={{ width: `${uploadProgress ?? 0}%` }} />
                    </div>
                  </div>
                )}

                <input type="text" value={form.image} required readOnly className="sr-only" tabIndex={-1} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving}
                  className="flex-1 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase hover:border-white/30 transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUploading}
                  className="flex-1 py-2.5 bg-primary text-black text-xs font-semibold tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all disabled:opacity-60">
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass border border-white/10 max-w-sm w-full p-6 space-y-5 animate-fadeIn">
            <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">Remove Product?</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Remove <strong className="text-white">{products.find(p => p.id === deleteId)?.productName}</strong> from the store? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting}
                className="flex-1 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase hover:border-white/30 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-semibold uppercase hover:bg-red-700 transition-all disabled:opacity-60">
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
