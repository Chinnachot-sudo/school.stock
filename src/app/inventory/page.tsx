'use client';

import { useState, useEffect, useMemo } from 'react';
import { Item, Category, Department, STANDARD_UNITS } from '@/types/inventory';
import QuickDeductModal from '@/components/QuickDeductModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import CategoryManageModal from '@/components/CategoryManageModal';
import {
  Search,
  Plus,
  Boxes,
  AlertTriangle,
  Scissors,
  PackagePlus,
  Pencil,
  Trash2,
  X,
  MapPin,
  CheckCircle2,
  QrCode,
  Tag,
  RefreshCw,
  ChevronRight,
  Filter,
  Upload,
  ImageIcon,
  Sparkles,
  Camera,
  Palette,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function InventoryPage() {
  const { canManageItems, canRestock, canDeleteItems, canPrintQr } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItemForDeduct, setSelectedItemForDeduct] = useState<Item | null>(null);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Item | null>(null);

  // New Item Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    currentStock: 10,
    minStock: 5,
    unit: 'Pcs',
    location: '',
    price: 0,
    cost: 0,
    imageUrl: '',
    isForSale: false,
    note: '',
    isBorrowable: false
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Image Creation Hub states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);

  // Generate Photo using AI (Pollinations AI)
  const handleGenerateAiImage = async (isEdit: boolean) => {
    const targetName = isEdit ? editingItem?.name : formData.name;
    const targetCatId = isEdit ? editingItem?.categoryId : formData.categoryId;
    const cat = categories.find(c => c.id === targetCatId);

    if (!targetName?.trim() && !customPrompt.trim()) {
      alert('กรุณาระบุชื่อสินค้า (Item Name) ก่อนสร้างรูปภาพด้วย AI');
      return;
    }

    try {
      setIsGeneratingAi(true);
      const res = await fetch('/api/items/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: targetName || '',
          category: cat?.name || '',
          customPrompt: customPrompt.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (isEdit) {
        setEditingItem(prev => prev ? { ...prev, imageUrl: data.imageUrl } : null);
      } else {
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      }
      showToast('✨ สร้างรูปภาพสินค้าด้วย AI สำเร็จ!');
      setCustomPrompt('');
      setShowPromptDrawer(false);
    } catch (err: any) {
      console.error('Error generating AI image:', err);
      alert('ไม่สามารถสร้างรูปภาพ AI ได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Generate Graphic Badge using HTML5 Canvas
  const handleGenerateGraphicBadge = (isEdit: boolean) => {
    const targetName = isEdit ? editingItem?.name : formData.name;
    const targetCode = isEdit ? editingItem?.code : formData.code;
    const targetCatId = isEdit ? editingItem?.categoryId : formData.categoryId;
    const cat = categories.find(c => c.id === targetCatId);

    const displayName = (targetName?.trim() || 'PRODUCT ITEM').toUpperCase();
    const displayCode = targetCode?.trim() || 'SKU-001';
    const displayCat = (cat?.name || 'STORE ITEM').toUpperCase();

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Deep Forest Emerald -> Rich Pine)
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#0B3B2B');
    gradient.addColorStop(0.5, '#134E39');
    gradient.addColorStop(1, '#0B6B4F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Decorative geometric accents
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(430, 80, 160, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(80, 440, 120, 0, Math.PI * 2);
    ctx.fill();

    // Inner card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 464, 464);

    // Category Pill
    ctx.fillStyle = '#EAB308';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(40, 48, 160, 36, 18);
      ctx.fill();
    } else {
      ctx.fillRect(40, 48, 160, 36);
    }

    ctx.fillStyle = '#18181B';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(displayCat.slice(0, 18), 120, 72);

    // Center emblem circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(256, 210, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    const initialLetter = displayName.charAt(0) || 'P';
    ctx.fillText(initialLetter, 256, 235);

    // Item Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    const truncatedTitle = displayName.length > 22 ? displayName.slice(0, 20) + '...' : displayName;
    ctx.fillText(truncatedTitle, 256, 335);

    // SKU Barcode simulation pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(100, 375, 312, 54, 12);
      ctx.fill();
    } else {
      ctx.fillRect(100, 375, 312, 54);
    }

    ctx.fillStyle = '#A7F3D0';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`[ ${displayCode} ]`, 256, 408);

    // School footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '13px sans-serif';
    ctx.fillText('Roong Aroon International School', 256, 462);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (isEdit) {
      setEditingItem(prev => prev ? { ...prev, imageUrl: dataUrl } : null);
    } else {
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
    }
    showToast('🎨 สร้างป้ายสินค้าสำเร็จ!');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (isEdit) {
          setEditingItem(prev => prev ? { ...prev, imageUrl: dataUrl } : null);
        } else {
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      const data = await res.json();
      const loadedItems = data.items || [];
      const loadedCats = data.categories || [];
      setItems(loadedItems);
      setCategories(loadedCats);
      setDepartments(data.departments || []);

      if (loadedCats.length > 0) {
        setFormData(prev => ({
          ...prev,
          categoryId: prev.categoryId && loadedCats.some((c: Category) => c.id === prev.categoryId) ? prev.categoryId : loadedCats[0].id
        }));
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.code.trim() || !formData.name.trim() || !formData.unit.trim()) {
      setFormError('Please fill in required fields (Code, Item Name, Unit)');
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add item');
      }

      setItems(prev => [data.item, ...prev]);
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        currentStock: 10,
        minStock: 5,
        unit: 'Pcs',
        location: '',
        price: 0,
        cost: 0,
        imageUrl: '',
        isForSale: false,
        note: '',
        isBorrowable: false
      });
      showToast(`Added item "${data.item.name}" successfully`);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update item');
      }

      setItems(prev => prev.map(i => (i.id === data.item.id ? data.item : i)));
      setEditingItem(null);
      showToast(`Updated "${data.item.name}" successfully`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete item "${name}" from the system?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete item');
      }

      setItems(prev => prev.filter(i => i.id !== id));
      showToast(`Item "${name}" deleted successfully`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesLowStock = !lowStockOnly || item.currentStock <= item.minStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [items, searchQuery, selectedCategory, lowStockOnly]);

  const lowStockCount = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minStock).length;
  }, [items]);

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#1F4D3A]" />
            <span>Inventory & Stock</span>
          </h1>
          <p className="text-xs text-[#6B6560] mt-0.5">
            Track inventory balances, manage items, storage locations, and low stock thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canPrintQr && (
            <Link
              href="/print-qr"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] text-[#1A1A1A] text-xs font-medium transition"
            >
              <QrCode className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Print QR Labels</span>
            </Link>
          )}

          {canManageItems && (
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] text-[#1A1A1A] text-xs font-medium transition"
            >
              <Tag className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Manage Categories</span>
            </button>
          )}

          {canManageItems && (
            <button
              onClick={() => {
                if (categories.length > 0 && !formData.categoryId) {
                  setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
                }
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-white text-xs font-medium transition active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Item</span>
            </button>
          )}

          <button
            onClick={fetchItems}
            title="Refresh Data"
            className="p-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] text-[#6B6560] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-[#E5E0D8] flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B6560]" />
          <input
            type="text"
            placeholder="Search items, SKU, storage location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6560] focus:outline-none focus:border-[#1F4D3A]"
          />
        </div>

        {/* Categories, Filter Controls & View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
          >
            <option value="ALL">All Categories ({items.length})</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 whitespace-nowrap ${
              lowStockOnly
                ? 'bg-[#FEF0C7] text-[#B54708] border-[#B54708]/30'
                : 'bg-white text-[#6B6560] border-[#E5E0D8] hover:bg-[#F7F4EF]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#B54708]" />
            <span>Low Stock ({lowStockCount})</span>
          </button>

        </div>
      </div>

      {/* ENTERPRISE DATA TABLE */}
        <div className="rounded-lg border border-[#E5E0D8] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F4EF] border-b border-[#E5E0D8] text-[#6B6560] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-40">Photo & SKU</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Item Description</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell w-36">Category</th>
                  <th className="py-2.5 px-3 hidden md:table-cell w-36">Location</th>
                  <th className="py-2.5 px-3 hidden lg:table-cell w-24 text-right">Price</th>
                  <th className="py-2.5 px-3 w-32">Status</th>
                  <th className="py-2.5 px-3 w-28 text-right">In Stock</th>
                  <th className="py-2.5 px-3 w-40 text-right">Actions</th>
                </tr>
              </thead>

              {/* SKELETON LOADING STATE */}
              {loading ? (
                <tbody className="divide-y divide-[#E5E0D8]">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <tr key={n} className="animate-pulse">
                      <td className="py-2.5 px-3"><div className="h-[80px] w-28 bg-[#E5E0D8] rounded-xl"></div></td>
                      <td className="py-2.5 px-3"><div className="h-3.5 w-44 bg-[#E5E0D8] rounded"></div></td>
                      <td className="py-2.5 px-3 hidden sm:table-cell"><div className="h-3.5 w-24 bg-[#E5E0D8]/60 rounded"></div></td>
                      <td className="py-2.5 px-3 hidden md:table-cell"><div className="h-3.5 w-20 bg-[#E5E0D8]/60 rounded"></div></td>
                      <td className="py-2.5 px-3 hidden lg:table-cell text-right"><div className="h-3.5 w-12 bg-[#E5E0D8] rounded ml-auto"></div></td>
                      <td className="py-2.5 px-3"><div className="h-4 w-16 bg-[#E5E0D8] rounded"></div></td>
                      <td className="py-2.5 px-3 text-right"><div className="h-3.5 w-10 bg-[#E5E0D8] rounded ml-auto"></div></td>
                      <td className="py-2.5 px-3 text-right"><div className="h-6 w-24 bg-[#E5E0D8] rounded ml-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              ) : filtered.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-[#6B6560]">
                      <Boxes className="w-8 h-8 mx-auto text-[#6B6560]/40 mb-2" />
                      <p className="font-medium text-[#1A1A1A] text-xs">No inventory items found</p>
                      <p className="text-[11px] text-[#6B6560] mt-0.5">Try adjusting your search query or reset category filter</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-[#E5E0D8]/70">
                  {filtered.map(item => {
                    const isLow = item.currentStock <= item.minStock;
                    const isOut = item.currentStock <= 0;
                    const cat = categories.find(c => c.id === item.categoryId);

                    return (
                      <tr key={item.id} className="hover:bg-[#F7F4EF]/70 transition">
                        
                        {/* SKU & 80x80px Photo Thumbnail */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <div className="w-[80px] h-[80px] rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-2xs">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-[80px] h-[80px] object-contain rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="w-[80px] h-[80px] rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex flex-col items-center justify-center shrink-0">
                                <Boxes className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-[9px] font-mono text-slate-400 font-medium">No Image</span>
                              </div>
                            )}
                            <span className="font-mono text-xs font-bold text-[#111827]">{item.code}</span>
                          </div>
                        </td>

                        {/* Item Name & Details */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-sm text-[#1A1A1A] leading-tight">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#6B6560] mt-1">
                            {item.isForSale && (
                              <span className="text-[#0B6B4F] font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-[#0B6B4F]/20">[POS Sale]</span>
                            )}
                            {item.isBorrowable && (
                              <span className="text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Borrowable</span>
                            )}
                            {item.note && (
                              <span className="truncate max-w-xs">• {item.note}</span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 hidden sm:table-cell text-[#6B6560] whitespace-nowrap text-[11px]">
                          {cat?.name || 'General'}
                        </td>

                        {/* Location */}
                        <td className="py-2.5 px-3 hidden md:table-cell text-[#6B6560] whitespace-nowrap text-[11px]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#6B6560] shrink-0" />
                            <span className="truncate">{item.location || 'Main Storage'}</span>
                          </span>
                        </td>

                        {/* Price / Cost (font-mono) */}
                        <td className="py-2.5 px-3 hidden lg:table-cell text-right whitespace-nowrap font-mono text-xs text-[#1A1A1A]">
                          {item.price ? `฿${item.price.toFixed(2)}` : '-'}
                        </td>

                        {/* Muted Status Badge with thin border & dot */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEE4E2] text-[#B42318] border border-[#B42318]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B42318]"></span>
                              <span>Out of Stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF0C7] text-[#B54708] border border-[#B54708]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]"></span>
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#E8F0EB] text-[#1F4D3A] border border-[#1F4D3A]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#027A48]"></span>
                              <span>In Stock</span>
                            </span>
                          )}
                        </td>

                        {/* Current Stock (font-mono) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className={`font-mono text-xs font-bold ${isLow ? 'text-[#B54708]' : 'text-[#1A1A1A]'}`}>
                            {item.currentStock}
                          </span>
                          <span className="text-[10px] text-[#6B6560] ml-1">
                            {item.unit}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canRestock && (
                              <button
                                onClick={() => setSelectedItemForRestock(item)}
                                className="px-2 py-1 bg-white hover:bg-[#F7F4EF] text-[#1F4D3A] rounded text-[10px] font-medium border border-[#E5E0D8] transition"
                                title="Receive Stock"
                              >
                                +In
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedItemForDeduct(item)}
                              disabled={isOut}
                              className="px-2 py-1 bg-[#C45C26] hover:bg-[#A84B1E] disabled:opacity-40 text-white rounded text-[10px] font-medium transition"
                              title="Issue Stock"
                            >
                              Issue
                            </button>

                            {canManageItems && (
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1 rounded text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF] transition"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {canDeleteItems && (
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1 rounded text-[#6B6560] hover:text-[#B42318] hover:bg-[#FEE4E2] transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {/* Footer info */}
          <div className="p-2.5 bg-[#F7F4EF] border-t border-[#E5E0D8] text-[11px] text-[#6B6560] flex items-center justify-between">
            <span>Showing {filtered.length} of {items.length} items</span>
            <span className="font-mono text-[#6B6560]">School Inventory ERP</span>
          </div>
        </div>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#1F4D3A] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-white/80" />
                <span>Add New Item / Equipment</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg text-xs border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Item Code / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A4-DOUBLE or 8850029..."
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:ring-1 focus:ring-zinc-400"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    * Used for Barcode / QR Code generation
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-zinc-700">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-zinc-600 hover:text-zinc-900 font-medium underline"
                    >
                      + Manage Categories
                    </button>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-medium focus:ring-1 focus:ring-zinc-400"
                  >
                    {categories.length === 0 ? (
                      <option value="">-- No categories available --</option>
                    ) : (
                      categories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Item Name / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Double A A4 Paper 80gsm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={(STANDARD_UNITS as readonly string[]).includes(formData.unit) ? formData.unit : 'Other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, unit: val === 'Other' ? '' : val });
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center font-medium focus:ring-1 focus:ring-zinc-400"
                  >
                    {STANDARD_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="Other">Other (Custom)...</option>
                  </select>
                  {!(STANDARD_UNITS as readonly string[]).includes(formData.unit) && (
                    <input
                      type="text"
                      placeholder="Enter custom unit..."
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full mt-1.5 bg-white border border-zinc-300 rounded-lg p-1.5 text-center text-xs"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Storage Location / Shelf
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cabinet A Floor 2, Science Lab"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2"
                />
              </div>

              {/* Item Photo / Equipment Image Creation Hub */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-zinc-700">
                    รูปภาพสินค้า / Item Photo
                  </label>
                  {formData.imageUrl && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แนบรูปภาพแล้ว
                    </span>
                  )}
                </div>

                {formData.imageUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="w-[80px] h-[80px] rounded-xl bg-white border border-zinc-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-[80px] h-[80px] object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      <p className="font-bold text-zinc-900">รูปภาพขนาด 80×80px (พร้อมใช้งาน)</p>
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateAiImage(false)}
                          disabled={isGeneratingAi}
                          className="px-2.5 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          {isGeneratingAi ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>วาดใหม่ด้วย AI</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                          className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบรูป</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 4 Photo Creation Options Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* 1. AI Image Generator */}
                      <button
                        type="button"
                        onClick={() => handleGenerateAiImage(false)}
                        disabled={isGeneratingAi}
                        className="p-2.5 bg-violet-50/70 hover:bg-violet-50 text-violet-800 border border-violet-200 hover:border-violet-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98 disabled:opacity-60"
                        title="สร้างรูปสินค้าด้วยระบบ AI จากชื่อสินค้า"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-violet-600 group-hover:scale-110 transition" />
                        )}
                        <span className="font-bold text-[11px]">สร้างรูปด้วย AI</span>
                        <span className="text-[9.5px] text-violet-500/80">Flux Model</span>
                      </button>

                      {/* 2. Direct Camera Snap */}
                      <label className="p-2.5 bg-sky-50/70 hover:bg-sky-50 text-sky-800 border border-sky-200 hover:border-sky-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98">
                        <Camera className="w-5 h-5 text-sky-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-[11px]">ถ่ายรูปสด</span>
                        <span className="text-[9.5px] text-sky-500/80">เปิดกล้องถ่าย</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, false)}
                        />
                      </label>

                      {/* 3. Graphic Badge Generator */}
                      <button
                        type="button"
                        onClick={() => handleGenerateGraphicBadge(false)}
                        className="p-2.5 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98"
                        title="สร้างป้ายกราฟิกสินค้าอัตโนมัติพร้อมชื่อและรหัส"
                      >
                        <Palette className="w-5 h-5 text-[#0B6B4F] group-hover:scale-110 transition" />
                        <span className="font-bold text-[11px]">ป้ายกราฟิก</span>
                        <span className="text-[9.5px] text-emerald-600/80">Auto Badge</span>
                      </button>

                      {/* 4. File Upload */}
                      <label className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98">
                        <Upload className="w-5 h-5 text-slate-500 group-hover:scale-110 transition" />
                        <span className="font-bold text-[11px]">เลือกไฟล์รูป</span>
                        <span className="text-[9.5px] text-slate-400">จากอุปกรณ์</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, false)}
                        />
                      </label>
                    </div>

                    {/* AI Prompt Customizer Toggle */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowPromptDrawer(!showPromptDrawer)}
                        className="text-[10.5px] text-violet-600 hover:text-violet-800 font-medium underline flex items-center gap-1"
                      >
                        <span>{showPromptDrawer ? '− ซ่อนคำสั่ง AI Prompt' : '+ กำหนดคำสั่งรูป AI เอง (Custom Prompt)'}</span>
                      </button>

                      {showPromptDrawer && (
                        <div className="mt-1.5 p-2 bg-violet-50/50 border border-violet-100 rounded-lg space-y-1.5 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="ระบุลักษณะรูปสินค้า เช่น กล่องสีเขียวพร้อมดินสอ 12 แท่ง..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="w-full bg-white border border-violet-200 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:border-violet-500"
                          />
                          <p className="text-[9.5px] text-zinc-500">
                            * หากไม่ระบุ ระบบจะใช้ชื่อสินค้า ({formData.name || '...'}) มาสร้างรูปให้อัตโนมัติ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isForSale"
                    checked={formData.isForSale}
                    onChange={e => setFormData({ ...formData, isForSale: e.target.checked })}
                    className="rounded text-zinc-900 focus:ring-zinc-500"
                  />
                  <label htmlFor="isForSale" className="font-medium text-zinc-800">
                    Available for School Store (POS)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                      Selling Price (THB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="0.00"
                      value={formData.price || ''}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                      className="w-full font-mono bg-white border border-zinc-200 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                      Cost Price (THB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="0.00"
                      value={formData.cost || ''}
                      onChange={e => setFormData({ ...formData, cost: Number(e.target.value) || 0 })}
                      className="w-full font-mono bg-white border border-zinc-200 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isBorrowable"
                  checked={formData.isBorrowable}
                  onChange={(e) => setFormData({ ...formData, isBorrowable: e.target.checked })}
                  className="rounded text-zinc-900 focus:ring-zinc-500"
                />
                <label htmlFor="isBorrowable" className="text-zinc-700 font-medium">
                  Borrowable Equipment (e.g. Projector, HDMI Cable, Key)
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-[#E5E0D8] text-xs font-medium text-[#6B6560] hover:bg-[#F7F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-xs font-medium text-white"
                >
                  Save New Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#1F4D3A] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-white/80" />
                <span>Edit Item: {editingItem.name}</span>
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Category</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 font-medium text-[#1A1A1A]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">Item Name / Description</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={editingItem.currentStock}
                    onChange={(e) => setEditingItem({ ...editingItem, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-center text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    value={editingItem.minStock}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-center text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Unit</label>
                  <select
                    value={(STANDARD_UNITS as readonly string[]).includes(editingItem.unit) ? editingItem.unit : 'Other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem({ ...editingItem, unit: val === 'Other' ? '' : val });
                    }}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-center font-medium text-[#1A1A1A]"
                  >
                    {STANDARD_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="Other">Other (Custom)...</option>
                  </select>
                  {!(STANDARD_UNITS as readonly string[]).includes(editingItem.unit) && (
                    <input
                      type="text"
                      placeholder="Enter custom unit..."
                      value={editingItem.unit}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      className="w-full mt-1.5 bg-white border border-[#E5E0D8] rounded-lg p-1.5 text-center text-xs text-[#1A1A1A]"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">Storage Location / Shelf</label>
                <input
                  type="text"
                  value={editingItem.location || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              {/* Item Photo / Equipment Image Creation Hub */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-[#1A1A1A]">
                    รูปภาพสินค้า / Item Photo
                  </label>
                  {editingItem.imageUrl && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แนบรูปภาพแล้ว
                    </span>
                  )}
                </div>

                {editingItem.imageUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-[#F7F4EF] border border-[#E5E0D8] rounded-xl">
                    <div className="w-[80px] h-[80px] rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={editingItem.imageUrl}
                        alt="Preview"
                        className="w-[80px] h-[80px] object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      <p className="font-bold text-[#1A1A1A]">รูปภาพขนาด 80×80px (พร้อมใช้งาน)</p>
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateAiImage(true)}
                          disabled={isGeneratingAi}
                          className="px-2.5 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          {isGeneratingAi ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>วาดใหม่ด้วย AI</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(prev => prev ? { ...prev, imageUrl: '' } : null)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบรูป</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 4 Photo Creation Options Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* 1. AI Image Generator */}
                      <button
                        type="button"
                        onClick={() => handleGenerateAiImage(true)}
                        disabled={isGeneratingAi}
                        className="p-2.5 bg-violet-50/70 hover:bg-violet-50 text-violet-800 border border-violet-200 hover:border-violet-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98 disabled:opacity-60"
                        title="สร้างรูปสินค้าด้วยระบบ AI จากชื่อสินค้า"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-violet-600 group-hover:scale-110 transition" />
                        )}
                        <span className="font-bold text-[11px]">สร้างรูปด้วย AI</span>
                        <span className="text-[9.5px] text-violet-500/80">Flux Model</span>
                      </button>

                      {/* 2. Direct Camera Snap */}
                      <label className="p-2.5 bg-sky-50/70 hover:bg-sky-50 text-sky-800 border border-sky-200 hover:border-sky-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98">
                        <Camera className="w-5 h-5 text-sky-600 group-hover:scale-110 transition" />
                        <span className="font-bold text-[11px]">ถ่ายรูปสด</span>
                        <span className="text-[9.5px] text-sky-500/80">เปิดกล้องถ่าย</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, true)}
                        />
                      </label>

                      {/* 3. Graphic Badge Generator */}
                      <button
                        type="button"
                        onClick={() => handleGenerateGraphicBadge(true)}
                        className="p-2.5 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98"
                        title="สร้างป้ายกราฟิกสินค้าอัตโนมัติพร้อมชื่อและรหัส"
                      >
                        <Palette className="w-5 h-5 text-[#0B6B4F] group-hover:scale-110 transition" />
                        <span className="font-bold text-[11px]">ป้ายกราฟิก</span>
                        <span className="text-[9.5px] text-emerald-600/80">Auto Badge</span>
                      </button>

                      {/* 4. File Upload */}
                      <label className="p-2.5 bg-white hover:bg-[#F7F4EF] text-slate-700 border border-[#E5E0D8] hover:border-[#0B6B4F]/30 rounded-xl flex flex-col items-center justify-center gap-1 transition group cursor-pointer shadow-2xs active:scale-98">
                        <Upload className="w-5 h-5 text-slate-500 group-hover:scale-110 transition" />
                        <span className="font-bold text-[11px]">เลือกไฟล์รูป</span>
                        <span className="text-[9.5px] text-slate-400">จากอุปกรณ์</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(e, true)}
                        />
                      </label>
                    </div>

                    {/* AI Prompt Customizer Toggle */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowPromptDrawer(!showPromptDrawer)}
                        className="text-[10.5px] text-violet-600 hover:text-violet-800 font-medium underline flex items-center gap-1"
                      >
                        <span>{showPromptDrawer ? '− ซ่อนคำสั่ง AI Prompt' : '+ กำหนดคำสั่งรูป AI เอง (Custom Prompt)'}</span>
                      </button>

                      {showPromptDrawer && (
                        <div className="mt-1.5 p-2 bg-violet-50/50 border border-violet-100 rounded-lg space-y-1.5 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="ระบุลักษณะรูปสินค้า เช่น กล่องสีเขียวพร้อมดินสอ 12 แท่ง..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="w-full bg-white border border-violet-200 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:border-violet-500"
                          />
                          <p className="text-[9.5px] text-zinc-500">
                            * หากไม่ระบุ ระบบจะใช้ชื่อสินค้า ({editingItem.name || '...'}) มาสร้างรูปให้อัตโนมัติ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#F7F4EF] rounded-lg border border-[#E5E0D8] space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsForSale"
                    checked={Boolean(editingItem.isForSale)}
                    onChange={e => setEditingItem({ ...editingItem, isForSale: e.target.checked })}
                    className="rounded text-[#1F4D3A] focus:ring-[#1F4D3A]"
                  />
                  <label htmlFor="editIsForSale" className="font-medium text-[#1A1A1A]">
                    Available for School Store (POS)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-[#6B6560] mb-0.5">
                      Selling Price (THB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="0.00"
                      value={editingItem.price || ''}
                      onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })}
                      className="w-full font-mono bg-white border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6B6560] mb-0.5">
                      Cost Price (THB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="0.00"
                      value={editingItem.cost || ''}
                      onChange={e => setEditingItem({ ...editingItem, cost: Number(e.target.value) || 0 })}
                      className="w-full font-mono bg-white border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-lg border border-[#E5E0D8] text-xs font-medium text-[#6B6560] hover:bg-[#F7F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-xs font-medium text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      <QuickDeductModal
        item={selectedItemForDeduct}
        departments={departments}
        isOpen={Boolean(selectedItemForDeduct)}
        onClose={() => setSelectedItemForDeduct(null)}
        onSuccess={(updated) => {
          setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
          showToast(`Issued "${updated.name}" successfully`);
        }}
      />

      <QuickRestockModal
        item={selectedItemForRestock}
        departments={departments}
        isOpen={Boolean(selectedItemForRestock)}
        onClose={() => setSelectedItemForRestock(null)}
        onSuccess={(updated, qty) => {
          setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
          showToast(`Received "${updated.name}" (+${qty}) successfully`);
        }}
      />

      <CategoryManageModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onUpdated={() => fetchItems()}
      />

    </div>
  );
}
