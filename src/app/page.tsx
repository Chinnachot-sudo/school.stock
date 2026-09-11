'use client';

import { useState, useEffect, useMemo } from 'react';
import { Item, Category, Department, Transaction, Receipt } from '@/types/inventory';
import ScannerModal from '@/components/ScannerModal';
import QuickDeductModal from '@/components/QuickDeductModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import {
  ScanLine,
  Search,
  AlertCircle,
  Scissors,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Boxes,
  ChevronRight,
  User,
  ArrowDownRight,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, canRestock, isInventoryManager } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItemForDeduct, setSelectedItemForDeduct] = useState<Item | null>(null);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, txRes, receiptsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?limit=10'),
        fetch('/api/receipts').catch(() => null)
      ]);

      const itemsData = await itemsRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      setCategories(itemsData.categories || []);
      setDepartments(itemsData.departments || []);
      setRecentTransactions(txData.transactions || []);

      if (receiptsRes && receiptsRes.ok) {
        const rcData = await receiptsRes.json();
        setReceipts(rcData.receipts || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto open deduct modal if ?code= or ?scan= in URL
  useEffect(() => {
    if (items.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('scan');
      if (codeParam) {
        const found = items.find(
          i => i.code.toLowerCase() === codeParam.trim().toLowerCase() || i.id === codeParam.trim()
        );
        if (found) {
          setSelectedItemForDeduct(found);
          showToast(`พบพัสดุ: ${found.name}`);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [items]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDeductSuccess = (updatedItem: Item, qty: number) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`ตัดสต็อก "${updatedItem.name}" จำนวน -${qty} ${updatedItem.unit} เรียบร้อย`);
    fetch('/api/transactions?limit=10')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  const handleRestockSuccess = (updatedItem: Item, qty: number) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`รับเข้า "${updatedItem.name}" จำนวน +${qty} ${updatedItem.unit} เรียบร้อย`);
    fetch('/api/transactions?limit=10')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  // Calculations
  const lowStockItems = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minStock);
  }, [items]);

  const todayRequisitions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const outTxs = recentTransactions.filter(
      tx => (tx.type === 'OUT' || tx.type === 'SALE') && tx.createdAt.slice(0, 10) === todayStr
    );
    const totalQty = outTxs.reduce((sum, tx) => sum + tx.quantity, 0);
    return { count: outTxs.length, totalQty };
  }, [recentTransactions]);

  const todayRestocks = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const inTxs = recentTransactions.filter(
      tx => tx.type === 'IN' && tx.createdAt.slice(0, 10) === todayStr
    );
    const totalQty = inTxs.reduce((sum, tx) => sum + tx.quantity, 0);
    return { count: inTxs.length, totalQty };
  }, [recentTransactions]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchLowStock = !lowStockOnly || item.currentStock <= item.minStock;
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchLowStock && matchSearch;
    });
  }, [items, selectedCategory, lowStockOnly, searchQuery]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'เจ้าหน้าที่';

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white px-3.5 py-2 rounded-lg border border-[#E5E0D8]/20 flex items-center gap-2 text-xs font-medium shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#027A48] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. GREETING BAR (ลำดับ 1: แถบทักทาย: 'สวัสดี, [ชื่อผู้ใช้]' และไอคอนสถานะ) */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight">
            สวัสดี, {userName}
          </h1>
          <p className="text-xs text-[#6B6560]">
            คลังพัสดุโรงเรียนนานาชาติรุ่งอรุณ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-lg bg-white border border-[#E5E0D8] text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR WITH SCAN TRIGGER (ลำดับ 2: 'ค้นหาสินค้า / รหัส หรือสแกน') */}
      <div className="relative">
        <input
          type="text"
          placeholder="ค้นหาสินค้า / รหัส หรือสแกน"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-3.5 pr-11 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] placeholder:text-[#6B6560] focus:outline-none focus:border-[#1F4D3A] transition"
        />
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="absolute right-1.5 top-1.5 p-1.5 rounded-md text-[#1F4D3A] hover:bg-[#E8F0EB] transition"
          title="เปิดกล้องสแกน"
        >
          <ScanLine className="w-4 h-4" />
        </button>
      </div>

      {/* 3. HERO ACTIONS (ลำดับ 3: ปุ่มใหญ่ซ้าย 'ตัดสต็อก' สีส้มอิฐ #C45C26 + ขวา 'รับเข้า' ปุ่มขอบเส้น) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: Focal Action Button (Single Primary Accent per Screen) */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="min-h-[48px] bg-[#C45C26] hover:bg-[#A84B1E] active:scale-98 text-white font-medium px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition"
        >
          <Scissors className="w-4 h-4" />
          <span>ตัดสต็อก</span>
        </button>

        {/* Right: Secondary Action (Outline) */}
        <button
          onClick={() => {
            if (lowStockItems.length > 0) {
              setSelectedItemForRestock(lowStockItems[0]);
            } else {
              setIsScannerOpen(true);
            }
          }}
          className="min-h-[48px] bg-white hover:bg-[#E8F0EB] active:scale-98 text-[#1F4D3A] border border-[#1F4D3A] font-medium px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>รับเข้า</span>
        </button>
      </div>

      {/* 4. LOW STOCK SECTION (ลำดับ 4: แถวรายการที่มีแถบสีส้มด้านซ้าย border-l-4 border-[#B54708], ไม่ใช้กล่องแดงทั้งบล็อก) */}
      {lowStockItems.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#B54708] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>พัสดุใกล้หมดเกณฑ์สำรอง ({lowStockItems.length})</span>
            </h2>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="text-[11px] text-[#6B6560] hover:text-[#1A1A1A] underline underline-offset-2"
            >
              {lowStockOnly ? 'แสดงทั้งหมด' : 'กรองเฉพาะรายการนี้'}
            </button>
          </div>

          <div className="space-y-1.5">
            {lowStockItems.slice(0, 4).map(item => (
              <div
                key={item.id}
                className="bg-white border border-[#E5E0D8] border-l-4 border-l-[#B54708] rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#6B6560]">
                      {item.code}
                    </span>
                    <span className="text-xs font-medium text-[#1A1A1A] truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6B6560] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0 text-[#6B6560]" />
                    <span className="truncate">{item.location || 'คลังกลาง'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-[#B54708]">
                      {item.currentStock}
                    </span>
                    <span className="text-[10px] text-[#6B6560] ml-1">
                      {item.unit}
                    </span>
                    <span className="text-[10px] text-[#6B6560] block">
                      (เกณฑ์ {item.minStock})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {canRestock && (
                      <button
                        onClick={() => setSelectedItemForRestock(item)}
                        className="px-2 py-1 bg-[#E8F0EB] hover:bg-[#d5e7db] text-[#1F4D3A] rounded text-[11px] font-medium transition"
                      >
                        +รับเข้า
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedItemForDeduct(item)}
                      className="px-2 py-1 bg-[#FDF1EB] hover:bg-[#f6dfd2] text-[#C45C26] rounded text-[11px] font-medium transition"
                    >
                      ตัด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 3 SUMMARY CARDS (ลำดับ 5: บัตรสรุปสั้น 3 ใบ: ใกล้หมด, ตัดวันนี้, รับเข้าวันนี้ - ตัวเลขใหญ่ font-mono) */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map(n => (
            <div key={n} className="rounded-lg border border-[#E5E0D8] bg-white p-3 h-20 animate-pulse flex flex-col justify-between">
              <div className="h-2.5 w-16 bg-[#E5E0D8] rounded"></div>
              <div className="h-6 w-12 bg-[#E5E0D8] rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: ใกล้หมด */}
          <div className="rounded-lg border border-[#E5E0D8] bg-white p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[#6B6560] font-medium">ใกล้หมด</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono ${lowStockItems.length > 0 ? 'text-[#B54708]' : 'text-[#1A1A1A]'}`}>
                {lowStockItems.length}
              </span>
              <span className="text-[10px] text-[#6B6560]">รายการ</span>
            </div>
          </div>

          {/* Card 2: ตัดวันนี้ */}
          <div className="rounded-lg border border-[#E5E0D8] bg-white p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[#6B6560] font-medium">ตัดวันนี้</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-[#1A1A1A]">
                {todayRequisitions.totalQty}
              </span>
              <span className="text-[10px] text-[#6B6560]">ชิ้น</span>
            </div>
          </div>

          {/* Card 3: รับเข้าวันนี้ */}
          <div className="rounded-lg border border-[#E5E0D8] bg-white p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[#6B6560] font-medium">รับเข้าวันนี้</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-[#027A48]">
                {todayRestocks.totalQty}
              </span>
              <span className="text-[10px] text-[#6B6560]">ชิ้น</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. HIGH DENSITY STOCK TABLE (ลำดับ 6: ตารางพัสดุ High Density, font-mono SKU และยอดคงเหลือ) */}
      <div className="rounded-lg border border-[#E5E0D8] bg-white overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-3 border-b border-[#E5E0D8] bg-[#F7F4EF]/60 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Boxes className="w-4 h-4 text-[#6B6560] shrink-0" />
            <span className="text-xs font-semibold text-[#1A1A1A]">
              รายการพัสดุในระบบ ({filteredItems.length})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E0D8] rounded-md text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            >
              <option value="ALL">ทุกหมวดหมู่ ({items.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <Link
              href="/inventory"
              className="px-2.5 py-1.5 bg-white hover:bg-[#F7F4EF] border border-[#E5E0D8] rounded-md text-xs font-medium text-[#6B6560] hover:text-[#1A1A1A] flex items-center gap-1 transition whitespace-nowrap"
            >
              <span>จัดการคลัง</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* High Density Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F4EF] border-b border-[#E5E0D8] text-[#6B6560] font-medium text-[11px]">
              <tr>
                <th className="py-2 px-3 w-28">รหัส SKU</th>
                <th className="py-2 px-3 min-w-[180px]">รายการพัสดุ</th>
                <th className="py-2 px-3 hidden sm:table-cell w-32">หมวดหมู่</th>
                <th className="py-2 px-3 hidden md:table-cell w-32">จุดจัดเก็บ</th>
                <th className="py-2 px-3 w-28">สถานะ</th>
                <th className="py-2 px-3 w-24 text-right">คงเหลือ</th>
                <th className="py-2 px-3 w-28 text-right">การกระทำ</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody className="divide-y divide-[#E5E0D8]">
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2 px-3"><div className="h-3 w-16 bg-[#E5E0D8] rounded"></div></td>
                    <td className="py-2 px-3"><div className="h-3 w-36 bg-[#E5E0D8] rounded"></div></td>
                    <td className="py-2 px-3 hidden sm:table-cell"><div className="h-3 w-20 bg-[#E5E0D8]/60 rounded"></div></td>
                    <td className="py-2 px-3 hidden md:table-cell"><div className="h-3 w-20 bg-[#E5E0D8]/60 rounded"></div></td>
                    <td className="py-2 px-3"><div className="h-3.5 w-14 bg-[#E5E0D8]/60 rounded"></div></td>
                    <td className="py-2 px-3 text-right"><div className="h-3 w-8 bg-[#E5E0D8] rounded ml-auto"></div></td>
                    <td className="py-2 px-3 text-right"><div className="h-5 w-12 bg-[#E5E0D8] rounded ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            ) : filteredItems.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#6B6560]">
                    <p className="text-xs font-medium">ไม่พบรายการพัสดุ</p>
                    <p className="text-[11px] mt-0.5">ลองปรับคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#E5E0D8]/70">
                {filteredItems.slice(0, 10).map(item => {
                  const isLow = item.currentStock <= item.minStock;
                  const isOut = item.currentStock <= 0;
                  const cat = categories.find(c => c.id === item.categoryId);

                  return (
                    <tr key={item.id} className="hover:bg-[#F7F4EF]/70 transition">
                      {/* SKU (font-mono) */}
                      <td className="py-2 px-3 font-mono text-xs text-[#6B6560] whitespace-nowrap">
                        {item.code}
                      </td>

                      {/* Name */}
                      <td className="py-2 px-3">
                        <div className="font-medium text-[#1A1A1A] leading-tight">
                          {item.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 hidden sm:table-cell text-[#6B6560] whitespace-nowrap text-[11px]">
                        {cat?.name || 'ทั่วไป'}
                      </td>

                      {/* Location */}
                      <td className="py-2 px-3 hidden md:table-cell text-[#6B6560] whitespace-nowrap text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#6B6560] shrink-0" />
                          <span className="truncate">{item.location || 'คลังกลาง'}</span>
                        </span>
                      </td>

                      {/* Muted Status Badge with thin border & dot indicator */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEE4E2] text-[#B42318] border border-[#B42318]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B42318]"></span>
                            <span>หมด</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF0C7] text-[#B54708] border border-[#B54708]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]"></span>
                            <span>ใกล้หมด</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#E8F0EB] text-[#1F4D3A] border border-[#1F4D3A]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#027A48]"></span>
                            <span>ปกติ</span>
                          </span>
                        )}
                      </td>

                      {/* Stock Quantity (font-mono) */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <span className={`font-mono text-xs font-bold ${isLow ? 'text-[#B54708]' : 'text-[#1A1A1A]'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-[10px] text-[#6B6560] ml-1">
                          {item.unit}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canRestock && (
                            <button
                              onClick={() => setSelectedItemForRestock(item)}
                              className="px-2 py-0.5 bg-white hover:bg-[#F7F4EF] text-[#1F4D3A] border border-[#E5E0D8] rounded text-[10px] font-medium transition"
                              title="รับเข้าสต็อก"
                            >
                              +รับ
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedItemForDeduct(item)}
                            disabled={isOut}
                            className="px-2 py-0.5 bg-[#C45C26] hover:bg-[#A84B1E] disabled:opacity-40 text-white rounded text-[10px] font-medium transition"
                            title="ตัดสต็อก"
                          >
                            ตัด
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-2.5 bg-[#F7F4EF] border-t border-[#E5E0D8] text-[11px] text-[#6B6560] flex items-center justify-between">
          <span>แสดง {filteredItems.slice(0, 10).length} จาก {filteredItems.length} รายการ</span>
          <Link href="/inventory" className="text-[#1F4D3A] font-medium hover:underline flex items-center gap-1">
            <span>ดูพัสดุทั้งหมด</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 7. LIVE ACTIVITY STREAM (High Density, Calm Neutral Styling) */}
      <div className="rounded-lg border border-[#E5E0D8] bg-white p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#6B6560]" />
            <h2 className="text-xs font-semibold text-[#1A1A1A]">
              ประวัติการทำรายการล่าสุด
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs text-[#6B6560] hover:text-[#1A1A1A] flex items-center gap-0.5"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-8 bg-[#F7F4EF] animate-pulse rounded"></div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <p className="text-xs text-[#6B6560] py-4 text-center">ยังไม่มีประวัติการทำรายการ</p>
        ) : (
          <div className="divide-y divide-[#E5E0D8]/60">
            {recentTransactions.map(tx => {
              const isOut = tx.type === 'OUT';
              const isSale = tx.type === 'SALE';
              const isIn = tx.type === 'IN';
              const timeStr = new Date(tx.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              }) + ' น.';

              return (
                <div key={tx.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                        isSale
                          ? 'bg-[#E8F0EB] text-[#1F4D3A] border-[#1F4D3A]/20'
                          : isOut
                          ? 'bg-[#FDF1EB] text-[#C45C26] border-[#C45C26]/20'
                          : isIn
                          ? 'bg-[#D1FADF] text-[#027A48] border-[#027A48]/20'
                          : 'bg-[#F7F4EF] text-[#6B6560] border-[#E5E0D8]'
                      }`}
                    >
                      {isSale ? 'POS' : isOut ? 'ตัด' : isIn ? 'รับ' : 'ปรับ'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A1A1A] truncate leading-tight">{tx.itemName}</p>
                      <p className="text-[10px] text-[#6B6560] truncate mt-0.5">
                        {tx.department} {tx.requesterName ? `• ${tx.requesterName}` : ''} • {timeStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-xs font-semibold block ${
                        isOut || isSale ? 'text-[#C45C26]' : 'text-[#027A48]'
                      }`}
                    >
                      {isOut || isSale ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                    <span className="font-mono text-[10px] text-[#6B6560]">
                      เหลือ {tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        onDeduct={(item) => setSelectedItemForDeduct(item)}
        onRestock={(item) => setSelectedItemForRestock(item)}
      />

      <QuickDeductModal
        item={selectedItemForDeduct}
        departments={departments}
        isOpen={Boolean(selectedItemForDeduct)}
        onClose={() => setSelectedItemForDeduct(null)}
        onSuccess={handleDeductSuccess}
      />

      <QuickRestockModal
        item={selectedItemForRestock}
        departments={departments}
        isOpen={Boolean(selectedItemForRestock)}
        onClose={() => setSelectedItemForRestock(null)}
        onSuccess={handleRestockSuccess}
      />

    </div>
  );
}
