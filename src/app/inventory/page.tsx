'use client';

import { useState, useEffect } from 'react';
import { Item, Category, Department } from '@/types/inventory';
import QuickDeductModal from '@/components/QuickDeductModal';
import QuickRestockModal from '@/components/QuickRestockModal';
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
  QrCode
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
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
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItemForDeduct, setSelectedItemForDeduct] = useState<Item | null>(null);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Item | null>(null);

  // New Item Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: 'cat-stationery',
    currentStock: 10,
    minStock: 5,
    unit: 'ชิ้น',
    location: '',
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
      setItems(data.items || []);
      setCategories(data.categories || []);
      setDepartments(data.departments || []);
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
      setFormError('กรุณากรอกรหัสสินค้า, ชื่อสินค้า และหน่วยนับ');
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเพิ่มสินค้าได้');

      setItems(prev => [...prev, data.item]);
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        name: '',
        categoryId: 'cat-stationery',
        currentStock: 10,
        minStock: 5,
        unit: 'ชิ้น',
        location: '',
        note: '',
        isBorrowable: false
      });
      showToast(`✅ เพิ่มสินค้า "${data.item.name}" สำเร็จ`);
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
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถแก้ไขสินค้าได้');

      setItems(prev => prev.map(i => (i.id === data.item.id ? data.item : i)));
      setEditingItem(null);
      showToast(`✅ อัปเดตข้อมูล "${data.item.name}" เรียบร้อย`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}" ออกจากระบบ?`)) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('ไม่สามารถลบสินค้าได้');

      setItems(prev => prev.filter(i => i.id !== id));
      showToast(`🗑️ ลบ "${name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter items
  const filtered = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesLowStock = !lowStockOnly || item.currentStock <= item.minStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            คลังพัสดุและอุปกรณ์ทั้งหมด ({items.length} รายการ)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการรายการพัสดุ, เพิ่มสินค้าใหม่, กำหนดจุดเตือนของใกล้หมด
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/print-qr"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ป้าย QR</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มพัสดุใหม่</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-3">
        {/* Search box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า, รหัส, จุดจัดเก็บ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({items.length})
          </button>

          {categories.map(cat => {
            const count = items.filter(i => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1 ml-auto ${
              lowStockOnly
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>เฉพาะใกล้หมด</span>
          </button>
        </div>
      </div>

      {/* Item List / Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">ไม่พบรายการพัสดุ</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือหมวดหมู่</p>
          </div>
        ) : (
          filtered.map(item => {
            const isLow = item.currentStock <= item.minStock;
            const isOut = item.currentStock <= 0;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition shadow-xs"
              >
                {/* Left info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.code}
                    </span>
                    {isOut ? (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                        หมดสต็อก
                      </span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                        ใกล้หมด (เตือนที่ ≤ {item.minStock})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                        ปกติ
                      </span>
                    )}
                    {item.isBorrowable && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                        ยืม-คืนได้
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    {item.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location || 'ไม่ระบุจุดจัดเก็บ'}
                    </span>
                    {item.note && (
                      <span className="text-slate-400 text-[11px] truncate max-w-xs">
                        • {item.note}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Stock counter */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">ยอดคงเหลือ</span>
                    <span className={`text-xl font-black ${isLow ? 'text-red-600' : 'text-blue-700'}`}>
                      {item.currentStock}{' '}
                      <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedItemForRestock(item)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition"
                      title="รับเข้าสต็อก"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span className="hidden sm:inline">รับเข้า</span>
                    </button>

                    <button
                      onClick={() => setSelectedItemForDeduct(item)}
                      disabled={isOut}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-700 text-xs font-bold flex items-center gap-1 transition"
                      title="ตัดสต็อก (เบิก)"
                    >
                      <Scissors className="w-4 h-4" />
                      <span className="hidden sm:inline">เบิก</span>
                    </button>

                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title="แก้ไขข้อมูล"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                เพิ่มพัสดุ / อุปกรณ์ใหม่
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="p-5 overflow-y-auto space-y-3.5">
              {formError && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสสินค้า / บาร์โค้ด *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น A4-DOUBLE หรือ 8850029..."
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    * รหัสนี้จะถูกใช้สร้างเป็น QR Code สำหรับพิมพ์ติดกล่อง
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อสินค้า / รายการพัสดุ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กระดาษ A4 Double A 80 แกรม"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ยอดเริ่มต้น
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เตือนเมื่อต่ำกว่า
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หน่วยนับ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="รีม, ด้าม, ชิ้น"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จุดจัดเก็บในโรงเรียน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตู้พัสดุ A ชั้น 2, ห้องกลุ่มสาระฯ วิทย์"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติม
                </label>
                <input
                  type="text"
                  placeholder="เช่น สำหรับใช้กับเครื่องปริ้นเตอร์ห้องวิชาการ"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isBorrowable"
                  checked={formData.isBorrowable}
                  onChange={(e) => setFormData({ ...formData, isBorrowable: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isBorrowable" className="text-xs text-slate-700 font-medium">
                  เป็นอุปกรณ์ยืม-คืน (เช่น โปรเจคเตอร์, สายสัญญาณ, กุญแจ)
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-400" />
                แก้ไขข้อมูล: {editingItem.name}
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-5 overflow-y-auto space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสสินค้า</label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เตือนเมื่อต่ำกว่า (Min Stock)</label>
                  <input
                    type="number"
                    value={editingItem.minStock}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จุดจัดเก็บ</label>
                <input
                  type="text"
                  value={editingItem.location}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={editingItem.note || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md"
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

    </div>
  );
}
