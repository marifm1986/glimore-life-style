'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, X } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// Modal Component
function ItemModal({
  isOpen,
  mode,
  item,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  mode: 'create' | 'edit';
  item?: InventoryItem;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}) {
  const [formData, setFormData] = useState<InventoryItem>(
    item || {
      id: Date.now().toString(),
      productName: '',
      sku: '',
      category: '',
      stock: 0,
      price: 0,
      status: 'in-stock',
      image: '',
      material: '',
      gemstone: '',
      collection: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'price' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Piece' : 'Edit Piece'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              >
                <option value="">Select Category</option>
                <option value="NECKLACES">Necklaces</option>
                <option value="RINGS">Rings</option>
                <option value="EARRINGS">Earrings</option>
                <option value="BRACELETS">Bracelets</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Material</label>
              <select
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              >
                <option value="">Select Material</option>
                <option value="Yellow Gold">Yellow Gold</option>
                <option value="White Gold">White Gold</option>
                <option value="Rose Gold">Rose Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gemstone</label>
              <select
                name="gemstone"
                value={formData.gemstone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              >
                <option value="">Select Gemstone</option>
                <option value="Diamond">Diamond</option>
                <option value="Sapphire">Sapphire</option>
                <option value="Pearl">Pearl</option>
                <option value="Emerald">Emerald</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Collection</label>
              <input
                type="text"
                name="collection"
                value={formData.collection}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-900"
            >
              {mode === 'create' ? 'Add Piece' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
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
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    productName: 'Eternal Bloom Necklace',
    sku: 'GL-77295-FB',
    category: 'NECKLACES',
    stock: 12,
    price: 12450.00,
    status: 'in-stock',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=150',
    material: 'Yellow Gold',
    gemstone: 'Diamond',
    collection: 'Eternal Collection',
  },
  {
    id: '2',
    productName: 'Midnight Sun Ring',
    sku: 'GL-21343-MS',
    category: 'RINGS',
    stock: 3,
    price: 8200.00,
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1515377905703-c28e0bac3dbb?q=80&w=150',
    material: 'Platinum',
    gemstone: 'Sapphire',
    collection: 'Celestial',
  },
  {
    id: '3',
    productName: 'Solitaire Lamina Studs',
    sku: 'GL-08203-SL',
    category: 'EARRINGS',
    stock: 0,
    price: 4500.00,
    status: 'out-of-stock',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=150',
    material: 'White Gold',
    gemstone: 'Diamond',
    collection: 'Solitaire',
  },
  {
    id: '4',
    productName: 'Golden Horizon Cuff',
    sku: 'GL-99381-GH',
    category: 'BRACELETS',
    stock: 8,
    price: 9800.00,
    status: 'in-stock',
    image: 'https://images.unsplash.com/photo-1515562141207-6811bcb33ce7?q=80&w=150',
    material: 'Rose Gold',
    gemstone: 'Emerald',
    collection: 'Horizon',
  },
  {
    id: '5',
    productName: 'Vintage Pearl Drop',
    sku: 'GL-45672-VPD',
    category: 'NECKLACES',
    stock: 5,
    price: 6750.00,
    status: 'in-stock',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=150',
    material: 'White Gold',
    gemstone: 'Pearl',
    collection: 'Vintage',
  },
  {
    id: '6',
    productName: 'Infinity Band',
    sku: 'GL-56789-IB',
    category: 'RINGS',
    stock: 1,
    price: 5900.00,
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1515562141207-6811bcb33ce7?q=80&w=150',
    material: 'Platinum',
    gemstone: 'Diamond',
    collection: 'Modern',
  },
];

const ITEMS_PER_PAGE = 4;

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState('All Materials');
  const [selectedGemstone, setSelectedGemstone] = useState('All Gems');
  const [selectedCollection, setSelectedCollection] = useState('All Collections');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: '', itemName: '' });

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">Admin access required</p>
          <p className="text-gray-600 text-sm">Please sign in with an admin account.</p>
        </div>
      </div>
    );
  }

  // CRUD Operations
  const handleCreate = () => {
    setSelectedItem(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = (item: InventoryItem) => {
    if (modalMode === 'create') {
      setInventory([...inventory, item]);
    } else {
      setInventory(inventory.map(i => (i.id === item.id ? item : i)));
    }
    setIsModalOpen(false);
    setCurrentPage(1);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setDeleteModal({ isOpen: true, itemId: item.id, itemName: item.productName });
  };

  const handleDeleteConfirm = () => {
    setInventory(inventory.filter(i => i.id !== deleteModal.itemId));
    setDeleteModal({ isOpen: false, itemId: '', itemName: '' });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">Admin access required</p>
          <p className="text-gray-600 text-sm">Please sign in with an admin account.</p>
        </div>
      </div>
    );
  }

  // Filter items
  let filteredItems = inventory;
  if (selectedMaterial !== 'All Materials') {
    filteredItems = filteredItems.filter(item => item.material === selectedMaterial);
  }
  if (selectedGemstone !== 'All Gems') {
    filteredItems = filteredItems.filter(item => item.gemstone === selectedGemstone);
  }
  if (selectedCollection !== 'All Collections') {
    filteredItems = filteredItems.filter(item => item.collection === selectedCollection);
  }

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);
  const totalListings = inventory.reduce((sum, item) => sum + item.stock, 0);

  const getStatusBadge = (status: string) => {
    const styles = {
      'in-stock': 'bg-green-100 text-green-800',
      'low-stock': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800',
    };
    const labels = {
      'in-stock': 'In Stock',
      'low-stock': 'Low Stock',
      'out-of-stock': 'Out of Stock',
    };
    return { styles: styles[status as keyof typeof styles], label: labels[status as keyof typeof labels] };
  };

  const materials = ['All Materials', ...new Set(inventory.map(item => item.material))];
  const gemstones = ['All Gems', ...new Set(inventory.map(item => item.gemstone))];
  const collections = ['All Collections', ...new Set(inventory.map(item => item.collection))];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <AdminHeader />

        {/* Content */}
        <div className="px-8 py-6">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-light tracking-tight text-gray-900">
              Jewelry Inventory
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Manage and track your high-jewelry collection. Monitor stock levels and update piece availability in real-time.
            </p>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <p className="text-xs text-gray-600 mb-2 font-medium tracking-wider">TOTAL INVENTORY VALUE</p>
              <p className="text-2xl font-light text-gray-900">
                ৳{(totalInventoryValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <p className="text-xs text-gray-600 mb-2 font-medium tracking-wider">ACTIVE LISTINGS</p>
              <p className="text-2xl font-light text-gray-900">{totalListings} Items</p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreate}
                className="w-full py-3 bg-black text-white text-sm font-semibold tracking-wider hover:bg-gray-900 transition-colors rounded-lg flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                ADD NEW PIECE
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div>
              <label className="text-xs text-gray-600 font-medium block mb-2">MATERIAL</label>
              <select
                value={selectedMaterial}
                onChange={(e) => {
                  setSelectedMaterial(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900"
              >
                {materials.map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium block mb-2">GEMSTONE</label>
              <select
                value={selectedGemstone}
                onChange={(e) => {
                  setSelectedGemstone(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900"
              >
                {gemstones.map(gem => (
                  <option key={gem} value={gem}>{gem}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium block mb-2">COLLECTION</label>
              <select
                value={selectedCollection}
                onChange={(e) => {
                  setSelectedCollection(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900"
              >
                {collections.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 tracking-wider">PRODUCT</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 tracking-wider">CATEGORY</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 tracking-wider">STOCK</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 tracking-wider">PRICE</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 tracking-wider">STATUS</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const badgeInfo = getStatusBadge(item.status);
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.collection}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 uppercase tracking-wide">{item.category}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">{item.stock}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        ৳{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${badgeInfo.styles}`}>
                          {badgeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                            title="Edit item"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
                            title="Delete item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-xs text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} items
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm ${
                      currentPage === page
                        ? 'bg-black text-white'
                        : 'border border-gray-300 hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ItemModal
        isOpen={isModalOpen}
        mode={modalMode}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.itemName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: '', itemName: '' })}
      />
    </div>
  );
}
