'use client';

import { useState, useEffect, useMemo } from 'react';
import { Item, Category, Department, Transaction, Receipt, IB_PROGRAMMES, IBProgramme } from '@/types/inventory';
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
  RefreshCw,
  TrendingUp,
  DollarSign,
  Store,
  Boxes,
  ShieldCheck,
  Activity,
  Layers,
  BarChart3,
  FileText,
  Users,
  ChevronRight,
  School
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
        fetch('/api/transactions?limit=8'),
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
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [items]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null), 3500;
    });
  };

  const extractCodeFromText = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('code=')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        return url.searchParams.get('code') || trimmed;
      } catch (e) {
        const match = trimmed.match(/[?&]code=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    }
    return trimmed;
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    const cleaned = extractCodeFromText(decodedText);
    const found = items.find(
      i => i.code.toLowerCase() === cleaned.toLowerCase() || i.id === cleaned
    );

    if (found) {
      setSelectedItemForDeduct(found);
      showToast(`🎯 สแกนพบ: ${found.name}`);
    } else {
      alert(`ไม่พบพัสดุรหัส "${cleaned}" ในระบบ`);
    }
  };

  const handleDeductSuccess = (updatedItem: Item, qty: number) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`✅ เบิกตัดสต็อก "${updatedItem.name}" จำนวน ${qty} ${updatedItem.unit} เรียบร้อย`);
    fetch('/api/transactions?limit=8')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  const handleRestockSuccess = (updatedItem: Item, qty: number) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`📦 รับเข้า "${updatedItem.name}" จำนวน +${qty} ${updatedItem.unit} เรียบร้อย`);
    fetch('/api/transactions?limit=8')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  // --- Executive Analytics Calculations (Shopeers-inspired) ---
  const lowStockItems = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minStock);
  }, [items]);

  const totalInventoryValuation = useMemo(() => {
    return items.reduce((sum, i) => {
      const unitValue = i.cost || i.price || 50; // fallback standard estimate
      return sum + i.currentStock * unitValue;
    }, 0);
  }, [items]);

  const todaySales = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeToday = receipts.filter(
      r => r.status === 'COMPLETED' && r.createdAt.slice(0, 10) === todayStr
    );
    const total = activeToday.reduce((sum, r) => sum + r.totalAmount, 0);
    const cash = activeToday.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.totalAmount, 0);
    const promptPay = activeToday.filter(r => r.paymentMethod === 'PROMPTPAY').reduce((sum, r) => sum + r.totalAmount, 0);
    return { total, cash, promptPay, count: activeToday.length };
  }, [receipts]);

  const todayRequisitions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const outTxs = recentTransactions.filter(
      tx => tx.type === 'OUT' && tx.createdAt.slice(0, 10) === todayStr
    );
    const totalQty = outTxs.reduce((sum, tx) => sum + tx.quantity, 0);
    return { count: outTxs.length, totalQty };
  }, [recentTransactions]);

  const stockHealthScore = useMemo(() => {
    if (items.length === 0) return 100;
    const healthyCount = items.filter(i => i.currentStock > i.minStock).length;
    return Math.round((healthyCount / items.length) * 100);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const formattedDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. EXECUTIVE OPERATIONAL HEADER (Shopeers B2B Analytics Style) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>IB World School ERP</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {formattedDate}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Roong Aroon International School
            </h1>
            <p className="text-xs sm:text-sm text-blue-700 font-bold mt-0.5">
              โรงเรียนนานาชาติรุ่งอรุณ • ระบบจัดการคลังพัสดุและวิเคราะห์ทรัพยากรการศึกษา
            </p>
          </div>

          {/* Quick Action Command Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-2 text-xs transition"
            >
              <Scan className="w-4 h-4" />
              <span>เปิดกล้องสแกนทันที</span>
            </button>

            <Link
              href="/pos"
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold px-3.5 py-2.5 rounded-2xl shadow-sm flex items-center gap-1.5 text-xs transition"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>ขายของ POS</span>
            </Link>

            {isInventoryManager && (
              <Link
                href="/finance"
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl shadow-xs flex items-center gap-1.5 text-xs transition"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>ใบแจ้งชำระ/การเงิน</span>
              </Link>
            )}

            <button
              onClick={fetchData}
              title="รีเฟรชข้อมูล"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS (Shopeers-inspired 4-Card Analytics Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Inventory Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">มูลค่าคลังพัสดุรวม</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            ฿{totalInventoryValuation.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">พัสดุในระบบ</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {items.length} รายการ
            </span>
          </div>
        </div>

        {/* Card 2: Today's Store Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">ยอดจำหน่ายวันนี้</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 tracking-tight">
            ฿{todaySales.total.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">
              สด: ฿{todaySales.cash.toFixed(0)} | QR: ฿{todaySales.promptPay.toFixed(0)}
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {todaySales.count} บิล
            </span>
          </div>
        </div>

        {/* Card 3: Daily Requisitions */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700">การเบิกพัสดุวันนี้</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-2 tracking-tight">
            {todayRequisitions.totalQty}{' '}
            <span className="text-sm font-semibold text-slate-400">ชิ้น</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">รายการเบิกทั้งหมด</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {todayRequisitions.count} ครั้ง
            </span>
          </div>
        </div>

        {/* Card 4: Stock Health & Critical Alerts */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">สถานะความพร้อมสต็อก</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight flex items-baseline gap-1.5">
            <span>{stockHealthScore}%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Optimal
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">พัสดุใกล้หมด</span>
            {lowStockItems.length > 0 ? (
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                ⚠️ {lowStockItems.length} รายการ
              </span>
            ) : (
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                ครบถ้วน
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SHOPEERS AI STOCK INTELLIGENCE & ADVISOR WIDGET */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-full bg-blue-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                <span>AI Stock Intelligence & Advisor</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Predictive Analytics Engine
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black tracking-tight">
              คำแนะนำอัจฉริยะสำหรับคลังพัสดุโรงเรียนนานาชาติรุ่งอรุณ
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
              {lowStockItems.length > 0
                ? `💡 ระบบตรวจพบวัสดุใกล้หมด ${lowStockItems.length} รายการ (เช่น ${lowStockItems.slice(0, 2).map(i => i.name).join(', ')}) แนะนำกดรับเข้าเพื่อสำรองสำหรับการเรียนการสอน IB`
                : '💡 คลังพัสดุอยู่ในสถานะสมบูรณ์พร้อมสำหรับทุกหลักสูตร PYP, MYP, DP และ CP ทั้งอุปกรณ์วิทยาศาสตร์ เครื่องเขียน และสื่อการสอน'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/inventory"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/15 transition flex items-center gap-1.5"
            >
              <span>จัดการคลังพัสดุ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. IB CURRICULUM DISTRIBUTION MATRIX & LOW STOCK MONITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* IB Programmes Quick Hub */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                การกระจายพัสดุตามกลุ่มหลักสูตร IB Curriculum
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Roong Aroon International School
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* PYP */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-800 block">🌱 PYP</span>
              <h3 className="text-xs font-black text-slate-800 mt-0.5">Primary Years</h3>
              <p className="text-[10px] text-slate-500 mt-1">อนุบาล - ประถม (EY1-G5)</p>
            </div>

            {/* MYP */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-800 block">📘 MYP</span>
              <h3 className="text-xs font-black text-slate-800 mt-0.5">Middle Years</h3>
              <p className="text-[10px] text-slate-500 mt-1">มัธยมต้น (Grade 6-10)</p>
            </div>

            {/* DP */}
            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-800 block">🎓 DP</span>
              <h3 className="text-xs font-black text-slate-800 mt-0.5">Diploma Prog.</h3>
              <p className="text-[10px] text-slate-500 mt-1">มัธยมปลาย Diploma</p>
            </div>

            {/* CP */}
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-800 block">💼 CP</span>
              <h3 className="text-xs font-black text-slate-800 mt-0.5">Career Prog.</h3>
              <p className="text-[10px] text-slate-500 mt-1">มัธยมปลาย อาชีพ/ทักษะ</p>
            </div>
          </div>
        </div>

        {/* Urgent Low Stock Alerts Monitor */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>พัสดุต้องสั่งเพิ่มด่วน</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {lowStockItems.length} รายการ
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-80" />
                <p className="text-xs font-semibold text-slate-600">สต็อกพัสดุพร้อมทุกรายการ</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {lowStockItems.slice(0, 4).map(item => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-red-600 font-medium">
                        เหลือ {item.currentStock} {item.unit} (เกณฑ์ {item.minStock})
                      </p>
                    </div>

                    {canRestock && (
                      <button
                        onClick={() => setSelectedItemForRestock(item)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] shrink-0"
                      >
                        +รับเข้า
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/inventory"
            className="pt-2 mt-2 border-t border-slate-100 text-xs text-blue-600 font-bold flex items-center justify-between hover:underline"
          >
            <span>ดูรายการคลังทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* 5. SEARCH & CATALOG WITH DEDUCT / RESTOCK ACTIONS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพัสดุ, รหัสบาร์โค้ด หรือตำแหน่ง..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Item Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Boxes className="w-8 h-8 mx-auto mb-1 opacity-30" />
            <p className="text-xs font-semibold">ไม่พบรายการพัสดุที่ตรงกับคำค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {filteredItems.slice(0, 9).map(item => {
              const isLow = item.currentStock <= item.minStock;
              const isOut = item.currentStock <= 0;

              return (
                <div
                  key={item.id}
                  className="border border-slate-200/80 rounded-2xl p-3.5 bg-slate-50/40 hover:bg-white hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.code}
                      </span>
                      {isOut ? (
                        <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                          หมดสต็อก
                        </span>
                      ) : isLow ? (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                          ใกล้หมด
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                          พร้อมเบิก
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.location || 'คลังกลาง'}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block leading-none">คงเหลือ</span>
                      <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-blue-700'}`}>
                        {item.currentStock}{' '}
                        <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {canRestock && (
                        <button
                          onClick={() => setSelectedItemForRestock(item)}
                          className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition"
                          title="รับเข้าสต็อก"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedItemForDeduct(item)}
                        disabled={isOut}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>เบิก</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. REAL-TIME ACTIVITY STREAM (Shopeers-inspired Live Feed) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              บันทึกธุรกรรมความเคลื่อนไหวล่าสุด (Live Activity Stream)
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีประวัติการทำรายการ</p>
          ) : (
            recentTransactions.map(tx => {
              const isOut = tx.type === 'OUT';
              const isSale = tx.type === 'SALE';
              const isIn = tx.type === 'IN';
              const timeStr = new Date(tx.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              }) + ' น.';

              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                        isSale
                          ? 'bg-emerald-100 text-emerald-800'
                          : isOut
                          ? 'bg-red-100 text-red-800'
                          : isIn
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isSale ? 'จำหน่าย POS' : isOut ? 'เบิกใช้งาน' : isIn ? 'รับเข้า' : 'ปรับยอด'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{tx.itemName}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {tx.department} {tx.requesterName ? `• ${tx.requesterName}` : ''} • {timeStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-sm block ${
                        isOut || isSale ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {isOut || isSale ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                    <span className="text-[9px] text-slate-400">
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
