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
  School,
  ArrowUpRight
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
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto open deduct modal if ?code= or ?scan= in URL (e.g. when scanned by native camera)
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
      setToastMessage(null);
    }, 3500);
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

  // --- Executive Analytics Calculations ---
  const lowStockItems = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minStock);
  }, [items]);

  const totalInventoryValuation = useMemo(() => {
    return items.reduce((sum, i) => {
      const unitValue = i.cost || i.price || 50;
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
      const matchLowStock = !lowStockOnly || item.currentStock <= item.minStock;
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchLowStock && matchSearch;
    });
  }, [items, selectedCategory, lowStockOnly, searchQuery]);

  const formattedDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. EXECUTIVE OPERATIONAL HEADER (Linear / shadcn/ui Neutral Style) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>IB World School ERP</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                {formattedDate}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Roong Aroon International School
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              โรงเรียนนานาชาติรุ่งอรุณ • ระบบจัดการคลังพัสดุและวิเคราะห์ทรัพยากรการศึกษา
            </p>
          </div>

          {/* Action Command Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white font-medium px-3.5 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 text-xs transition"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>เปิดกล้องสแกน</span>
            </button>

            <Link
              href="/pos"
              className="bg-white hover:bg-zinc-50 active:scale-98 text-zinc-700 font-medium px-3.5 py-2 rounded-lg border border-zinc-200 shadow-2xs flex items-center gap-1.5 text-xs transition"
            >
              <Store className="w-3.5 h-3.5 text-zinc-500" />
              <span>ขายของ (POS)</span>
            </Link>

            {isInventoryManager && (
              <Link
                href="/finance"
                className="bg-white hover:bg-zinc-50 active:scale-98 text-zinc-700 font-medium px-3.5 py-2 rounded-lg border border-zinc-200 shadow-2xs flex items-center gap-1.5 text-xs transition"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>การเงิน/ใบเสร็จ</span>
              </Link>
            )}

            <button
              onClick={fetchData}
              title="รีเฟรชข้อมูล"
              className="p-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 EXECUTIVE KPI CARDS (With Skeleton Loading State) */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="rounded-xl border border-zinc-200 bg-white p-4 h-28 animate-pulse flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-zinc-200 rounded"></div>
                <div className="h-4 w-4 bg-zinc-200 rounded"></div>
              </div>
              <div className="h-7 w-32 bg-zinc-200 rounded my-1"></div>
              <div className="h-2.5 w-40 bg-zinc-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Valuation */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs hover:border-zinc-300 transition">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium">มูลค่าคลังพัสดุรวม</span>
              <Boxes className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
              ฿{totalInventoryValuation.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>พัสดุทั้งหมด</span>
              <span className="font-mono text-zinc-700">{items.length} รายการ</span>
            </div>
          </div>

          {/* Card 2: Today's Store Sales */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs hover:border-zinc-300 transition">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium">ยอดจำหน่ายวันนี้</span>
              <DollarSign className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
              ฿{todaySales.total.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>สด ฿{todaySales.cash.toFixed(0)} • QR ฿{todaySales.promptPay.toFixed(0)}</span>
              <span className="font-mono text-zinc-700">{todaySales.count} บิล</span>
            </div>
          </div>

          {/* Card 3: Daily Requisitions */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs hover:border-zinc-300 transition">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium">การเบิกพัสดุวันนี้</span>
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
              {todayRequisitions.totalQty}{' '}
              <span className="text-xs font-normal text-zinc-500 font-sans">ชิ้น</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>บันทึกการเบิก</span>
              <span className="font-mono text-zinc-700">{todayRequisitions.count} รายการ</span>
            </div>
          </div>

          {/* Card 4: Stock Health & Alerts */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs hover:border-zinc-300 transition">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium">สถานะความพร้อมสต็อก</span>
              <ShieldCheck className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
              {stockHealthScore}%
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">พัสดุใกล้หมด</span>
              {lowStockItems.length > 0 ? (
                <span className="font-mono font-medium text-amber-700">
                  {lowStockItems.length} รายการ
                </span>
              ) : (
                <span className="font-medium text-emerald-700">ครบถ้วน 100%</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. AI ADVISOR & IB PROGRAMME OVERVIEW (Neutral Minimalist Container) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/80">
              <Sparkles className="w-3 h-3 text-zinc-500" />
              <span>AI Stock Intelligence</span>
            </span>
            <p className="text-xs text-zinc-600">
              {lowStockItems.length > 0
                ? `ระบบตรวจพบพัสดุใกล้หมดเกณฑ์สำรอง ${lowStockItems.length} รายการ (เช่น ${lowStockItems.slice(0, 2).map(i => i.name).join(', ')}) แนะนำกดรับเข้าสต็อก`
                : 'คลังพัสดุอยู่ในสถานะสมบูรณ์พร้อมสำหรับทุกหลักสูตร PYP, MYP, DP และ CP ทั้งอุปกรณ์วิทยาศาสตร์และสื่อการสอน'}
            </p>
          </div>

          <Link
            href="/inventory"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 shrink-0 transition"
          >
            <span>เปิดหน้าคลังพัสดุ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* IB Curriculum Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50">
            <span className="font-mono text-[10px] text-zinc-500 block">IB-PYP</span>
            <span className="font-medium text-zinc-900 text-xs">Primary Years</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Early Years - Grade 5</p>
          </div>
          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50">
            <span className="font-mono text-[10px] text-zinc-500 block">IB-MYP</span>
            <span className="font-medium text-zinc-900 text-xs">Middle Years</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Grade 6 - Grade 10</p>
          </div>
          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50">
            <span className="font-mono text-[10px] text-zinc-500 block">IB-DP</span>
            <span className="font-medium text-zinc-900 text-xs">Diploma Programme</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Grade 11 - Grade 12</p>
          </div>
          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50">
            <span className="font-mono text-[10px] text-zinc-500 block">IB-CP</span>
            <span className="font-medium text-zinc-900 text-xs">Career-related</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Grade 11 - Grade 12</p>
          </div>
        </div>
      </div>

      {/* 4. HIGH DENSITY ENTERPRISE STOCK TABLE */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-3 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาตามรหัส SKU, ชื่อพัสดุ, จุดจัดเก็บ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {/* Category Dropdown Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none"
            >
              <option value="ALL">หมวดหมู่ทั้งหมด ({items.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Low stock filter toggle */}
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1 ${
                lowStockOnly
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>เฉพาะใกล้หมด ({lowStockItems.length})</span>
            </button>

            <Link
              href="/inventory"
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 flex items-center gap-1 transition"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>

        {/* High Density Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px] tracking-wide uppercase">
              <tr>
                <th className="py-2 px-3 w-28">รหัส SKU</th>
                <th className="py-2 px-3 min-w-[200px]">รายการพัสดุ</th>
                <th className="py-2 px-3 hidden sm:table-cell w-36">หมวดหมู่</th>
                <th className="py-2 px-3 hidden md:table-cell w-36">จุดจัดเก็บ</th>
                <th className="py-2 px-3 w-28">สถานะสต็อก</th>
                <th className="py-2 px-3 w-28 text-right">คงเหลือ</th>
                <th className="py-2 px-3 w-28 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody className="divide-y divide-zinc-100">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2 px-3"><div className="h-3.5 w-16 bg-zinc-200 rounded"></div></td>
                    <td className="py-2 px-3"><div className="h-3.5 w-44 bg-zinc-200 rounded"></div></td>
                    <td className="py-2 px-3 hidden sm:table-cell"><div className="h-3.5 w-24 bg-zinc-100 rounded"></div></td>
                    <td className="py-2 px-3 hidden md:table-cell"><div className="h-3.5 w-20 bg-zinc-100 rounded"></div></td>
                    <td className="py-2 px-3"><div className="h-4 w-16 bg-zinc-100 rounded"></div></td>
                    <td className="py-2 px-3 text-right"><div className="h-3.5 w-10 bg-zinc-200 rounded ml-auto"></div></td>
                    <td className="py-2 px-3 text-right"><div className="h-6 w-14 bg-zinc-100 rounded ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            ) : filteredItems.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Boxes className="w-8 h-8 mx-auto mb-1 opacity-40 text-zinc-400" />
                    <p className="text-xs font-medium text-zinc-600">ไม่พบรายการพัสดุที่ค้นหา</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">ลองปรับคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.slice(0, 10).map(item => {
                  const isLow = item.currentStock <= item.minStock;
                  const isOut = item.currentStock <= 0;
                  const cat = categories.find(c => c.id === item.categoryId);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition group">
                      {/* SKU (font-mono) */}
                      <td className="py-2 px-3 font-mono text-xs text-zinc-600 whitespace-nowrap">
                        {item.code}
                      </td>

                      {/* Name & Notes */}
                      <td className="py-2 px-3">
                        <div className="font-medium text-zinc-900 leading-tight">
                          {item.name}
                        </div>
                        {item.note && (
                          <div className="text-[10px] text-zinc-400 truncate max-w-xs mt-0.5">
                            {item.note}
                          </div>
                        )}
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

                      {/* Muted Status Badge with thin border */}
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

                      {/* Stock Quantity (font-mono) */}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-2.5 bg-zinc-50/50 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>แสดง {filteredItems.slice(0, 10).length} จาก {filteredItems.length} รายการ</span>
          <Link href="/inventory" className="text-zinc-700 font-medium hover:underline flex items-center gap-1">
            <span>ดูพัสดุทั้งหมดในระบบ</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 5. LIVE ACTIVITY STREAM (High Density Linear Style) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900">
              ประวัติการทำรายการล่าสุด (Live Activity Stream)
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-9 bg-zinc-100 animate-pulse rounded"></div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">ยังไม่มีประวัติการทำรายการ</p>
        ) : (
          <div className="divide-y divide-zinc-100">
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
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded border shrink-0 ${
                        isSale
                          ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          : isOut
                          ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                          : isIn
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {isSale ? 'POS' : isOut ? 'OUT' : isIn ? 'IN' : 'ADJ'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 truncate leading-tight">{tx.itemName}</p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {tx.department} {tx.requesterName ? `• ${tx.requesterName}` : ''} • {timeStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-xs font-semibold block ${
                        isOut || isSale ? 'text-zinc-900' : 'text-emerald-600'
                      }`}
                    >
                      {isOut || isSale ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      คงเหลือ {tx.balanceAfter}
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
