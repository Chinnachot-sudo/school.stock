'use client';

import { useState, useEffect } from 'react';
import { Item, Category, Department, Transaction } from '@/types/inventory';
import ScannerModal from '@/components/ScannerModal';
import QuickDeductModal from '@/components/QuickDeductModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import {
  Scan,
  Search,
  AlertTriangle,
  Scissors,
  PackagePlus,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { canRestock } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItemForDeduct, setSelectedItemForDeduct] = useState<Item | null>(null);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?limit=6')
      ]);

      const itemsData = await itemsRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      setCategories(itemsData.categories || []);
      setDepartments(itemsData.departments || []);
      setRecentTransactions(txData.transactions || []);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto open deduct modal if ?code= or ?scan= in URL (e.g. when scanned by native iPhone Camera)
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
          showToast(`🎯 สแกนพบ: ${found.name}`);
          // Clear query param from URL bar without reload
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

  // Helper to extract code if scanned text is a URL
  const extractCodeFromText = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('code=')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        return url.searchParams.get('code') || trimmed;
      } catch (e) {
        // Fallback regex
        const match = trimmed.match(/[?&]code=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    }
    return trimmed;
  };

  // Handle scanned barcode / QR text
  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    const cleaned = extractCodeFromText(decodedText);
    
    // Find matching item by code or ID
    const found = items.find(
      i => i.code.toLowerCase() === cleaned.toLowerCase() || i.id === cleaned
    );

    if (found) {
      // Open Quick Deduct Modal directly
      setSelectedItemForDeduct(found);
      showToast(`🎯 สแกนพบ: ${found.name}`);
    } else {
      alert(`ไม่พบสินค้าที่มีรหัส "${cleaned}" ในระบบ\nท่านสามารถเพิ่มสินค้าใหม่ได้ที่เมนู "คลังพัสดุ"`);
    }
  };

  const handleDeductSuccess = (updatedItem: Item, qty: number) => {
    // Update local state
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`✅ ตัดสต็อก "${updatedItem.name}" จำนวน ${qty} ${updatedItem.unit} เรียบร้อย`);
    // Refresh transactions
    fetch('/api/transactions?limit=6')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  const handleRestockSuccess = (updatedItem: Item, qty: number) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`📦 รับเข้า "${updatedItem.name}" จำนวน +${qty} ${updatedItem.unit} เรียบร้อย`);
    fetch('/api/transactions?limit=6')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  // Low stock warning list
  const lowStockItems = items.filter(i => i.currentStock <= i.minStock);

  // Filtered items by search query
  const filteredItems = searchQuery
    ? items.filter(
        i =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-4">
      
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO SECTION: Giant Camera Scanner Button (Designed for Mobile Thumb) */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute left-10 -top-10 w-24 h-24 bg-blue-400/20 rounded-full blur-lg pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/40 text-blue-100 text-xs font-semibold mb-2 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              โหมดมือถือใช้งานง่าย
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              สแกน QR Code เพื่อตัดสต็อก
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-sm">
              ใช้กล้องมือถือส่องป้าย QR Code หน้าตู้หรือกล่องพัสดุ แล้วกดตัดสต็อกได้ใน 3 วินาที
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-blue-700 active:scale-95 font-extrabold px-6 py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-base transition-all duration-150"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Scan className="w-5 h-5" />
            </div>
            <span>เปิดกล้องสแกนทันที</span>
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาชื่อสินค้า, รหัสบาร์โค้ด หรือชั้นจัดเก็บ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-600 font-semibold p-1"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* Low Stock Warning Banner (Only shows when there are items needing restock) */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-200/70 text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold leading-tight flex items-center gap-2">
              <span>แจ้งเตือน: สินค้าใกล้หมดสต็อก ({lowStockItems.length} รายการ)</span>
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {lowStockItems.map(item => (
                canRestock ? (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemForRestock(item)}
                    className="inline-flex items-center gap-1.5 text-xs bg-white border border-amber-200 hover:border-amber-400 px-2.5 py-1 rounded-lg font-medium text-slate-700 shadow-xs"
                  >
                    <span className="truncate max-w-[150px]">{item.name}</span>
                    <span className="text-red-600 font-bold">({item.currentStock} {item.unit})</span>
                    <span className="text-[10px] text-blue-600 font-bold">+รับเข้า</span>
                  </button>
                ) : (
                  <div
                    key={item.id}
                    className="inline-flex items-center gap-1.5 text-xs bg-white border border-amber-200 px-2.5 py-1 rounded-lg font-medium text-slate-700 shadow-xs"
                  >
                    <span className="truncate max-w-[150px]">{item.name}</span>
                    <span className="text-red-600 font-bold">({item.currentStock} {item.unit})</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ITEMS CATALOG SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              {searchQuery ? `ผลการค้นหา (${filteredItems.length})` : 'พัสดุ / อุปกรณ์ในโรงเรียน'}
            </h2>
            <button
              onClick={fetchData}
              title="รีเฟรชข้อมูล"
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-sm font-semibold text-slate-600">ไม่พบรายการที่ตรงกับการค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">ลองค้นหาด้วยคำอื่น หรือกดปุ่ม &quot;สแกน QR Code&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.slice(0, 9).map(item => {
              const isLow = item.currentStock <= item.minStock;
              const isOut = item.currentStock <= 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between hover:shadow-md transition duration-150"
                >
                  <div>
                    {/* Badge & Code */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.code}
                      </span>
                      {isOut ? (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                          หมดสต็อก
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                          ใกล้หมด
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                          พร้อมเบิก
                        </span>
                      )}
                    </div>

                    {/* Item Name */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>

                  {/* Stock count & Action Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-none">คงเหลือ</span>
                      <span className={`text-lg font-black leading-tight ${isLow ? 'text-red-600' : 'text-blue-700'}`}>
                        {item.currentStock}{' '}
                        <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {canRestock && (
                        <button
                          onClick={() => setSelectedItemForRestock(item)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition"
                          title="รับของเข้า"
                        >
                          <PackagePlus className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedItemForDeduct(item)}
                        disabled={isOut}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>เบิกของ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENT TRANSACTIONS LOG FEED */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">
              รายการเบิก-รับ ล่าสุดวันนี้
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีประวัติการทำรายการ</p>
          ) : (
            recentTransactions.map(tx => {
              const isOut = tx.type === 'OUT';
              const dateObj = new Date(tx.createdAt);
              const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{tx.itemName}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {tx.department} {tx.requesterName ? `• ${tx.requesterName}` : ''} • {timeStr}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-sm block ${
                        isOut ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {isOut ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      คงเหลือ {tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODALS */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
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
