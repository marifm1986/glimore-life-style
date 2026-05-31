'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit2, Trash2, X, Package, Search, Upload, Camera, ImageIcon, Star } from 'lucide-react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useFormState, useFormStatus } from 'react-dom';

async function compressImage(file: File): Promise<Blob> {
  const MAX_DIM = 1200;
  const QUALITY = 0.82;
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
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
          'image/jpeg',
          QUALITY,
        );
      };
      img.src = evt.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function uploadToCloudinary(
  blob: Blob,
  filename: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return Promise.reject(
      new Error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local'),
    );
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'inventory');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve((JSON.parse(xhr.responseText) as { secure_url: string }).secure_url);
      } else {
        // Surface the actual Cloudinary error message
        let detail = `HTTP ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          if (body.error?.message) detail = body.error.message;
        } catch { /* response wasn't JSON */ }
        reject(new Error(`Cloudinary: ${detail}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

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
  description?: string;
  isFeatured?: boolean;
  variants?: string[];
}

type InventoryFormData = Omit<InventoryItem, 'id'>;

const DEFAULT_CATEGORIES = [
  'CLOTHING', 'FOOTWEAR', 'ACCESSORIES', 'ELECTRONICS',
  'HOME & LIVING', 'BEAUTY', 'SPORTS', 'JEWELRY',
];

const EMPTY_FORM: InventoryFormData = {
  productName: '', sku: '', category: 'CLOTHING', stock: 0, price: 0,
  status: 'in-stock', image: '', material: '', gemstone: '', collection: '', description: '', isFeatured: false, variants: [],
};

const ITEMS_PER_PAGE = 5;
const INVENTORY_COLLECTION = 'inventory';

const DEFAULT_MATERIAL_SUGGESTIONS = [
  'Cotton', 'Polyester', 'Wool', 'Linen', 'Silk', 'Cashmere', 'Denim', 'Velvet',
  'Leather', 'Suede', 'Nylon', 'Spandex',
  'Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Silver', 'Titanium',
  'Stainless Steel', 'Ceramic', 'Silicone', 'Aluminum', 'Wood', 'Plastic',
];

const DEFAULT_VARIANT_SUGGESTIONS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Grey', 'Brown', 'Navy', 'Beige',
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '32GB', '64GB', '128GB', '256GB',
  'Diamond', 'Sapphire', 'Pearl', 'Emerald', 'Ruby', 'Amethyst',
];

interface AutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

function AutocompleteInput({ value, onChange, onEnter, suggestions, placeholder, disabled, required }: AutocompleteProps) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    return (q
      ? suggestions.filter(s => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      : suggestions
    ).slice(0, 8);
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setOpen(false); onEnter?.(); } }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 w-full bg-[#0f0f0f] border border-white/10 border-t-0 max-h-36 overflow-y-auto shadow-xl">
          {filtered.map(s => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getStatusStyle(status: string) {
  if (status === 'in-stock') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'low-stock') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border border-red-500/20';
}

function getStatusLabel(status: string) {
  if (status === 'in-stock') return 'In Stock';
  if (status === 'low-stock') return 'Low Stock';
  return 'Out of Stock';
}

export default function InventoryPage() {
  const {pending, data, action} = useFormStatus();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryFormData>(EMPTY_FORM);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [variantInput, setVariantInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/login');
  }, [loading, user, router]);

  // Real-time Firestore listener
  useEffect(() => {
    if (loading || !user || user.role !== 'admin') return;

    const q = query(collection(db, INVENTORY_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: InventoryItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<InventoryItem, 'id'>),
        }));
        setInventory(items);
        setDataLoading(false);
      },
      (err) => {
        console.error('Inventory listener error:', err);
        setError('Failed to load inventory.');
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading, user]);

  const materialSuggestions = useMemo(() => {
    const fromData = inventory.map(i => i.material).filter(Boolean);
    return [...new Set([...DEFAULT_MATERIAL_SUGGESTIONS, ...fromData])].sort();
  }, [inventory]);

  const variantSuggestions = useMemo(() => {
    const fromData = inventory.map(i => i.gemstone).filter(Boolean);
    return [...new Set([...DEFAULT_VARIANT_SUGGESTIONS, ...fromData])].sort();
  }, [inventory]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <p className="text-zinc-500 text-xs">Verifying access...</p>
      </div>
    );
  }

  const resetUpload = () => { setUploadProgress(null); setIsUploading(false); };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCustomCategoryInput('');
    setVariantInput('');
    setSelectedItem(null);
    setModalMode('create');
    setModalOpen(true);
    setError(null);
    resetUpload();
  };

  const openEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    const { id: _id, ...rest } = item;
    setForm({ ...rest, variants: rest.variants ?? [] });
    setCustomCategoryInput(DEFAULT_CATEGORIES.includes(item.category) ? '' : item.category);
    setVariantInput('');
    setModalMode('edit');
    setModalOpen(true);
    setError(null);
    resetUpload();
  };

  const addVariant = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setForm(prev => ({
      ...prev,
      variants: prev.variants?.includes(v) ? prev.variants : [...(prev.variants ?? []), v],
    }));
    setVariantInput('');
  };

  const removeVariant = (v: string) => {
    setForm(prev => ({ ...prev, variants: prev.variants?.filter(x => x !== v) ?? [] }));
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToCloudinary(compressed, file.name, setUploadProgress);
      setForm(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Upload error:', err);
      setError('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (modalMode === 'create') {
        await addDoc(collection(db, INVENTORY_COLLECTION), {
          ...form,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (selectedItem) {
        await updateDoc(doc(db, INVENTORY_COLLECTION, selectedItem.id), {
          ...form,
          updatedAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
      setCurrentPage(1);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteDoc(doc(db, INVENTORY_COLLECTION, deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = inventory.filter(i =>
    i.productName.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalValue = inventory.reduce((s, i) => s + i.stock * i.price, 0);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8">

      {/* Page header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold flex items-center gap-1 mb-1">
            <Package className="h-3.5 w-3.5" /> Catalog Management
          </span>
          <h1 className="font-['Montserrat'] text-2xl font-bold tracking-widest text-white">INVENTORY</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-primary text-black font-semibold text-xs tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass p-5 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Inventory Value</span>
          <p className="text-xl font-semibold text-primary">{formatPrice(totalValue)}</p>
        </div>
        <div className="glass p-5 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total SKUs</span>
          <p className="text-xl font-semibold text-white">{inventory.length} Products</p>
        </div>
        <div className="glass p-5 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Low / Out of Stock</span>
          <p className="text-xl font-semibold text-amber-400">
            {inventory.filter(i => i.status !== 'in-stock').length} Alerts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full bg-black border border-white/10 px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-primary text-white"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
      </div>

      {/* Table */}
      <div className="glass border border-white/5 overflow-hidden">
        {dataLoading ? (
          <div className="py-16 text-center text-zinc-600 text-xs">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-zinc-400">
              <thead className="bg-black/40 text-zinc-600 uppercase tracking-widest text-[9px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold">Product</th>
                  <th className="px-5 py-3.5 text-left font-semibold">SKU</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Category</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Stock</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Price</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-zinc-600 text-xs">
                      {search ? 'No items match your search.' : 'No inventory items yet. Add your first piece.'}
                    </td>
                  </tr>
                ) : paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.productName} className="h-9 w-9 object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="h-9 w-9 border border-white/10 flex items-center justify-center shrink-0 bg-white/5">
                            <ImageIcon className="h-4 w-4 text-zinc-700" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white text-[11px] flex items-center gap-1.5">
                            {item.productName}
                            {item.isFeatured && <Star className="h-2.5 w-2.5 fill-primary text-primary shrink-0" />}
                          </p>
                          <p className="text-[9px] text-zinc-600">{item.collection}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px]">{item.sku}</td>
                    <td className="px-5 py-3.5 uppercase tracking-wider">{item.category}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-medium text-white">{item.stock}</td>
                    <td className="px-5 py-3.5 text-right text-primary font-semibold">{formatPrice(item.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all" title="Delete">
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

        {/* Pagination */}
        {!dataLoading && totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-zinc-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
                    currentPage === p ? 'bg-primary text-black' : 'border border-white/10 text-zinc-500 hover:border-primary hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">
                {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white" disabled={isSaving}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {([
                  { label: 'Product Name',       key: 'productName', type: 'text',   colSpan: 2, placeholder: 'e.g. Classic Wool Blazer',    suggestions: null },
                  { label: 'SKU',                key: 'sku',         type: 'text',   colSpan: 1, placeholder: 'e.g. BLZ-WL-001',             suggestions: null },
                  { label: 'Brand / Collection', key: 'collection',  type: 'text',   colSpan: 1, placeholder: 'e.g. Nike, Eternal, Zara',    suggestions: null },
                  { label: 'Stock',              key: 'stock',       type: 'number', colSpan: 1, placeholder: '0',                           suggestions: null },
                  { label: 'Price (cents)',       key: 'price',       type: 'number', colSpan: 1, placeholder: '0',                           suggestions: null },
                  { label: 'Material / Fabric',  key: 'material',    type: 'text',   colSpan: 1, placeholder: 'e.g. Cotton, Leather, Gold',  suggestions: materialSuggestions },
                  { label: 'Variant / Feature',  key: 'gemstone',    type: 'text',   colSpan: 1, placeholder: 'e.g. Red, Size M, USB-C',     suggestions: variantSuggestions },
                ] as const).map(({ label, key, type, colSpan, placeholder, suggestions }) => (
                  <div key={key} className={`space-y-1.5 ${colSpan === 2 ? 'col-span-2' : ''}`}>
                    <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">{label}</label>
                    {suggestions ? (
                      <AutocompleteInput
                        value={(form as any)[key] as string}
                        onChange={val => setForm(prev => ({ ...prev, [key]: val }))}
                        suggestions={suggestions}
                        placeholder={placeholder}
                        disabled={isSaving}
                        required={false}
                      />
                    ) : (
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700"
                        required
                        disabled={isSaving}
                      />
                    )}
                  </div>
                ))}

                {/* Image upload */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
                    Product Image
                  </label>

                  {/* Hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />

                  {/* Preview */}
                  {form.image && !isUploading && (
                    <div className="relative w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image}
                        alt="Preview"
                        className="h-28 w-28 object-cover border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Upload buttons */}
                  {!form.image && !isUploading && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                      >
                        <Camera className="h-3.5 w-3.5" /> Take Photo
                      </button>
                    </div>
                  )}

                  {/* Replace button (shown when image exists) */}
                  {form.image && !isUploading && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 border border-white/10 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
                      >
                        <Upload className="h-3 w-3" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 border border-white/10 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
                      >
                        <Camera className="h-3 w-3" /> Retake
                      </button>
                    </div>
                  )}

                  {/* Upload progress */}
                  {isUploading && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <ImageIcon className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>Compressing &amp; uploading… {uploadProgress ?? 0}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1">
                        <div
                          className="h-1 bg-primary transition-all duration-200"
                          style={{ width: `${uploadProgress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Validation: require image on submit */}
                  <input type="text" value={form.image} required readOnly className="sr-only" tabIndex={-1} />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Product description visible on the storefront..."
                    value={form.description ?? ''}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder:text-zinc-700 resize-none"
                    disabled={isSaving}
                  />
                </div>
                {/* Variants tag input */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">
                    Variants <span className="normal-case tracking-normal font-normal text-zinc-600">(sizes, colors, options)</span>
                  </label>
                  <div className="flex gap-2">
                    <AutocompleteInput
                      value={variantInput}
                      onChange={setVariantInput}
                      onEnter={() => addVariant(variantInput)}
                      suggestions={variantSuggestions}
                      placeholder="e.g. S, M, L, Black, White…"
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => addVariant(variantInput)}
                      disabled={isSaving || !variantInput.trim()}
                      className="shrink-0 px-3 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                  {(form.variants ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(form.variants ?? []).map((v) => (
                        <span key={v} className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-xs text-zinc-300 font-semibold uppercase tracking-wider">
                          {v}
                          <button
                            type="button"
                            onClick={() => removeVariant(v)}
                            className="text-zinc-600 hover:text-red-400 transition-colors ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category — select with custom option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Category</label>
                  <select
                    value={DEFAULT_CATEGORIES.includes(form.category) ? form.category : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCustomCategoryInput('');
                        setForm(prev => ({ ...prev, category: '' }));
                      } else {
                        setCustomCategoryInput('');
                        setForm(prev => ({ ...prev, category: e.target.value }));
                      }
                    }}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
                    disabled={isSaving}
                  >
                    {DEFAULT_CATEGORIES.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value="__custom__">Custom...</option>
                  </select>
                  {!DEFAULT_CATEGORIES.includes(form.category) && (
                    <input
                      type="text"
                      placeholder="Enter category name"
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setForm(prev => ({ ...prev, category: e.target.value.toUpperCase() }));
                      }}
                      className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-primary text-white mt-1.5"
                      required
                      disabled={isSaving}
                      autoFocus
                    />
                  )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest text-zinc-500 uppercase font-semibold">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as InventoryFormData['status'] }))}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary focus:text-white"
                    disabled={isSaving}
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                {/* Featured toggle */}
                <div className="col-span-2 pt-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        checked={form.isFeatured ?? false}
                        onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="sr-only peer"
                        disabled={isSaving}
                      />
                      <div className="w-9 h-5 bg-white/10 peer-checked:bg-primary rounded-full transition-colors duration-200" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-500 peer-checked:bg-black rounded-full transition-transform duration-200 peer-checked:translate-x-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors flex items-center gap-1.5">
                        <Star className="h-3 w-3 text-primary" /> Featured Product
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Highlighted in featured sections on the storefront</p>
                    </div>
                  </label>
                </div>

              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold tracking-wider uppercase hover:border-white/30 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-primary text-black text-xs font-semibold tracking-[0.15em] uppercase hover:bg-opacity-90 transition-all disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass border border-white/10 max-w-sm w-full p-6 space-y-5 animate-fadeIn">
            <h3 className="font-['Montserrat'] text-sm font-semibold tracking-wider text-white">Confirm Removal</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{inventory.find(i => i.id === deleteId)?.productName}</strong> from inventory? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 border border-white/10 text-zinc-400 text-xs font-semibold uppercase hover:border-white/30 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-semibold uppercase hover:bg-red-700 transition-all disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
