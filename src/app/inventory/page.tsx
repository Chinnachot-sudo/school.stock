'use client';

import { useState, useEffect, useMemo } from 'react';
import { Item, Category, Department } from '@/types/inventory';
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
  Filter
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
    unit: 'ชิ้น',
    location: '',
    price: 0,
    cost: 0,
    isForSale: false,
    note: '',
    isBorrowable: false
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      setFormError('กรุณากรอกข้อมูลที่จำเป็น (รหัส, ชื่อสินค้า, หน่วยนับ)');
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
        throw new Error(data.error || 'ไม่สามารถเพิ่มสินค้าได้');
      }

      setItems(prev => [data.item, ...prev]);
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        currentStock: 10,
        minStock: 5,
        unit: 'ชิ้น',
        location: '',
        price: 0,
        cost: 0,
        isForSale: false,
        note: '',
        isBorrowable: false
      });
      showToast(`✅ เพิ่มพัสดุ "${data.item.name}" เรียบร้อยแล้ว`);
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
        throw new Error(data.error || 'ไม่สามารถแก้ไขสินค้าได้');
      }

      setItems(prev => prev.map(i => (i.id === data.item.id ? data.item : i)));
      setEditingItem(null);
      showToast(`✅ อัปเดตข้อมูล "${data.item.name}" สำเร็จ`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพัสดุ "${name}" ออกจากระบบ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถลบสินค้าได้');
      }

      setItems(prev => prev.filter(i => i.id !== id));
      showToast(`🗑️ ลบพัสดุ "${name}" เรียบร้อยแล้ว`);
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

      {/* Header Bar (Modern Linear / shadcn/ui Neutral Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
              INVENTORY MANAGEMENT
            </span>
            <span className="text-[10px] text-zinc-400">•</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {items.length} TOTAL ITEMS
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-2 tracking-tight">
            <Boxes className="w-5 h-5 text-zinc-700" />
            <span>คลังพัสดุและอุปกรณ์ (Inventory Table)</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            ตรวจเช็คสต็อก จัดการรายการพัสดุ เพิ่มสินค้าใหม่ และกำหนดจุดเตือนของใกล้หมด
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canPrintQr && (
            <Link
              href="/print-qr"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-zinc-500" />
              <span>พิมพ์ป้าย QR</span>
            </Link>
          )}

          {canManageItems && (
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition shadow-2xs"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>จัดการหมวดหมู่</span>
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-2xs transition active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มพัสดุใหม่</span>
            </button>
          )}

          <button
            onClick={fetchItems}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อพัสดุ, รหัส SKU, จุดจัดเก็บ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Categories & Filter Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">หมวดหมู่ทั้งหมด ({items.length})</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 whitespace-nowrap ${
              lowStockOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>ใกล้หมด ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* HIGH DENSITY ENTERPRISE DATA TABLE */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px] tracking-wide uppercase">
              <tr>
                <th className="py-2 px-3 w-28">รหัส SKU</th>
                <th className="py-2 px-3 min-w-[200px]">รายการพัสดุ</th>
                <th className="py-2 px-3 hidden sm:table-cell w-36">หมวดหมู่</th>
                <th className="py-2 px-3 hidden md:table-cell w-36">จุดจัดเก็บ</th>
                <th className="py-2 px-3 hidden lg:table-cell w-24 text-right">ราคา</th>
                <th className="py-2 px-3 w-32">สถานะสต็อก</th>
                <th className="py-2 px-3 w-28 text-right">คงเหลือ</th>
                <th className="py-2 px-3 w-40 text-right">ดำเนินการ</th>
              </tr>
            </thead>

            {/* SKELETON LOADING STATE */}
            {loading ? (
              <tbody className="divide-y divide-zinc-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-2 px-3"><div className="h-3.5 w-16 bg-zinc-200 rounded"></div></td>
                    <td className="py-2 px-3"><div className="h-3.5 w-44 bg-zinc-200 rounded"></div></td>
                    <td className="py-2 px-3 hidden sm:table-cell"><div className="h-3.5 w-24 bg-zinc-100 rounded"></div></td>
                    <td className="py-2 px-3 hidden md:table-cell"><div className="h-3.5 w-20 bg-zinc-100 rounded"></div></td>
                    <td className="py-2 px-3 hidden lg:table-cell text-right"><div className="h-3.5 w-12 bg-zinc-100 rounded ml-auto"></div></td>
                    <td className="py-2 px-3"><div className="h-4 w-16 bg-zinc-100 rounded"></div></td>
                    <td className="py-2 px-3 text-right"><div className="h-3.5 w-10 bg-zinc-200 rounded ml-auto"></div></td>
                    <td className="py-2 px-3 text-right"><div className="h-6 w-24 bg-zinc-100 rounded ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            ) : filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-400">
                    <Boxes className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                    <p className="font-semibold text-zinc-700 text-xs">ไม่พบรายการพัสดุ</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">ลองปรับคำค้นหา หรือรีเซ็ตหมวดหมู่</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(item => {
                  const isLow = item.currentStock <= item.minStock;
                  const isOut = item.currentStock <= 0;
                  const cat = categories.find(c => c.id === item.categoryId);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition group">
                      
                      {/* SKU (font-mono) */}
                      <td className="py-2 px-3 font-mono text-xs text-zinc-600 whitespace-nowrap">
                        {item.code}
                      </td>

                      {/* Item Name & Details */}
                      <td className="py-2 px-3">
                        <div className="font-medium text-zinc-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                          {item.isForSale && (
                            <span className="text-zinc-600 font-mono">[POS Sale]</span>
                          )}
                          {item.isBorrowable && (
                            <span className="text-purple-700 font-medium">ยืม-คืน</span>
                          )}
                          {item.note && (
                            <span className="truncate max-w-xs">• {item.note}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 hidden sm:table-cell text-zinc-600 whitespace-nowrap text-[11px]">
                        <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                          {cat?.icon} {cat?.name ? cat.name.split(' ')[0] : 'ทั่วไป'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-2 px-3 hidden md:table-cell text-zinc-500 whitespace-nowrap text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{item.location || 'คลังกลาง'}</span>
                        </span>
                      </td>

                      {/* Price / Cost (font-mono) */}
                      <td className="py-2 px-3 hidden lg:table-cell text-right whitespace-nowrap font-mono text-xs text-zinc-700">
                        {item.price ? `฿${item.price.toFixed(2)}` : '-'}
                      </td>

                      {/* Muted Status Badge with thin border & dot */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>หมดสต็อก</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>ใกล้หมด (≤{item.minStock})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>ปกติ</span>
                          </span>
                        )}
                      </td>

                      {/* Current Stock (font-mono) */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <span className={`font-mono text-xs font-bold ${isLow ? 'text-rose-600' : 'text-zinc-900'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-sans ml-1">
                          {item.unit}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canRestock && (
                            <button
                              onClick={() => setSelectedItemForRestock(item)}
                              className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[10px] font-medium border border-zinc-200 transition"
                              title="รับเข้าสต็อก"
                            >
                              +รับเข้า
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedItemForDeduct(item)}
                            disabled={isOut}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded text-[10px] font-medium shadow-2xs transition"
                            title="ตัดสต็อกเบิก"
                          >
                            เบิก
                          </button>

                          {canManageItems && (
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                              title="แก้ไข"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDeleteItems && (
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="ลบ"
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
        <div className="p-2.5 bg-zinc-50/50 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>แสดง {filtered.length} จากทั้งหมด {items.length} รายการ</span>
          <span className="font-mono text-zinc-400">High-Density Enterprise Table</span>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-zinc-400" />
                <span>เพิ่มพัสดุ / อุปกรณ์ใหม่</span>
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
                    รหัสสินค้า / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น A4-DOUBLE หรือ 8850029..."
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:ring-1 focus:ring-zinc-400"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    * ใช้สร้างเป็น Barcode / QR Code
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-zinc-700">
                      หมวดหมู่ *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-zinc-600 hover:text-zinc-900 font-medium underline"
                    >
                      + จัดการหมวดหมู่
                    </button>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-medium focus:ring-1 focus:ring-zinc-400"
                  >
                    {categories.length === 0 ? (
                      <option value="">-- ยังไม่มีหมวดหมู่ --</option>
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
                  ชื่อสินค้า / รายการพัสดุ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กระดาษ A4 Double A 80 แกรม"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    สต็อกแรกเริ่ม
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
                    เกณฑ์เตือนใกล้หมด
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
                    หน่วยนับ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น รีม, กล่อง"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  จุดจัดเก็บ / ชั้นวาง
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตู้พัสดุ A ชั้น 2, ห้องพักครูวิทย์"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2"
                />
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
                    เปิดจำหน่ายที่ร้านสหกรณ์โรงเรียน (POS)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                      ราคาจำหน่าย (บาท)
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
                      ราคาทุน (บาท)
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
                  เป็นอุปกรณ์ยืม-คืน (เช่น โปรเจคเตอร์, สายสัญญาณ, กุญแจ)
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white shadow-2xs"
                >
                  บันทึกสินค้าใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-zinc-400" />
                <span>แก้ไขข้อมูล: {editingItem.name}</span>
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">รหัสสินค้า / SKU</label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">หมวดหมู่</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">ชื่อสินค้า / รายการ</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">สต็อกคงเหลือ</label>
                  <input
                    type="number"
                    value={editingItem.currentStock}
                    onChange={(e) => setEditingItem({ ...editingItem, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">เกณฑ์เตือนใกล้หมด</label>
                  <input
                    type="number"
                    value={editingItem.minStock}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">จุดจัดเก็บ / ชั้นวาง</label>
                <input
                  type="text"
                  value={editingItem.location || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2"
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsForSale"
                    checked={Boolean(editingItem.isForSale)}
                    onChange={e => setEditingItem({ ...editingItem, isForSale: e.target.checked })}
                    className="rounded text-zinc-900 focus:ring-zinc-500"
                  />
                  <label htmlFor="editIsForSale" className="font-medium text-zinc-800">
                    เปิดจำหน่ายที่ร้านค้าสหกรณ์ (POS)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                      ราคาจำหน่าย (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="0.00"
                      value={editingItem.price || ''}
                      onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })}
                      className="w-full font-mono bg-white border border-zinc-200 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                      ราคาทุน (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="0.00"
                      value={editingItem.cost || ''}
                      onChange={e => setEditingItem({ ...editingItem, cost: Number(e.target.value) || 0 })}
                      className="w-full font-mono bg-white border border-zinc-200 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white shadow-2xs"
                >
                  บันทึกการแก้ไข
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
          showToast(`✅ ตัดสต็อก "${updated.name}" เรียบร้อย`);
        }}
      />

      <QuickRestockModal
        item={selectedItemForRestock}
        departments={departments}
        isOpen={Boolean(selectedItemForRestock)}
        onClose={() => setSelectedItemForRestock(null)}
        onSuccess={(updated, qty) => {
          setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
          showToast(`📦 รับเข้า "${updated.name}" (+${qty}) เรียบร้อย`);
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
