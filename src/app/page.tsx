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
  Filter,
  FileSpreadsheet,
  TrendingUp,
  PackageCheck,
  PackageMinus
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
        fetch('/api/transactions?limit=30'),
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

  // Listen to search query params: ?code=, ?scan=, ?action=
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const codeParam = params.get('code') || params.get('scan');

      if (action === 'scan') {
        setIsScannerOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (action === 'deduct') {
        if (items.length > 0) {
          setSelectedItemForDeduct(items[0]);
        }
        window.history.replaceState({}, '', window.location.pathname);
      } else if (action === 'restock') {
        if (items.length > 0) {
          const target = items.find(i => i.currentStock <= i.minStock) || items[0];
          setSelectedItemForRestock(target);
        }
        window.history.replaceState({}, '', window.location.pathname);
      } else if (codeParam && items.length > 0) {
        const found = items.find(
          i => i.code.toLowerCase() === codeParam.trim().toLowerCase() || i.id === codeParam.trim()
        );
        if (found) {
          setSelectedItemForDeduct(found);
          showToast(`Found item: ${found.name}`);
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
    showToast(`Deducted "${updatedItem.name}" (-${qty} ${updatedItem.unit}) successfully`);
    fetch('/api/transactions?limit=30')
      .then(res => res.json())
      .then(data => setRecentTransactions(data.transactions || []))
      .catch(console.error);
  };

  const handleRestockSuccess = (updatedItem: Item, qty: number) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    showToast(`Restocked "${updatedItem.name}" (+${qty} ${updatedItem.unit}) successfully`);
    fetch('/api/transactions?limit=30')
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

  // Last 7 days movement data for Donezo-style chart
  const last7DaysTrends = useMemo(() => {
    const days: { day: string; fullDate: string; inQty: number; outQty: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const inQty = recentTransactions
        .filter(tx => tx.type === 'IN' && tx.createdAt.slice(0, 10) === dateStr)
        .reduce((sum, tx) => sum + tx.quantity, 0);

      const outQty = recentTransactions
        .filter(tx => (tx.type === 'OUT' || tx.type === 'SALE') && tx.createdAt.slice(0, 10) === dateStr)
        .reduce((sum, tx) => sum + tx.quantity, 0);

      days.push({ day: dayLabel, fullDate: dateStr, inQty, outQty });
    }
    return days;
  }, [recentTransactions]);

  const maxTrendQty = useMemo(() => {
    let max = 10;
    last7DaysTrends.forEach(d => {
      if (d.inQty > max) max = d.inQty;
      if (d.outQty > max) max = d.outQty;
    });
    return max;
  }, [last7DaysTrends]);

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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-4 py-2.5 rounded-xl border border-[#E5E7EB]/20 flex items-center gap-2.5 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP DASHBOARD HEADER & ACTIONS (Donezo Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Daily inventory movements and warehouse overview • Roong Aroon Int. School
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {canRestock && (
            <Link
              href="/operations/restock"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Receive Stock</span>
            </Link>
          )}

          <Link
            href="/operations/deduct"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#111827] bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] active:scale-98 transition shadow-2xs"
          >
            <Scissors className="w-3.5 h-3.5 text-[#0B6B4F]" />
            <span>Issue Stock</span>
          </Link>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#111827] bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] active:scale-98 transition shadow-2xs"
          >
            <ScanLine className="w-3.5 h-3.5 text-[#0B6B4F]" />
            <span>Scan</span>
          </button>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. 4 DONEZO KPI CARDS (Card 1: Solid Green #0B6B4F, Cards 2-4: Surface White) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Highlight Card (Solid Green #0B6B4F with White Text) */}
        <div className="bg-[#0B6B4F] text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/85">Low Stock Alert</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#34D399]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono tracking-tight block">
              {loading ? '-' : lowStockItems.length}
            </span>
            <span className="text-[11px] text-white/80 block mt-1">
              {lowStockItems.length > 0
                ? 'Items need restock or reordering soon'
                : 'All inventory within safety stock levels'}
            </span>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px]">
            <span className="text-white/75">Safety Threshold</span>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="text-[#34D399] font-semibold hover:underline"
            >
              {lowStockOnly ? 'Show All' : 'Filter Low Stock'}
            </button>
          </div>
        </div>

        {/* KPI 2: Requisitions Today (White Card) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Dispatched Today</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#B54708]">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-[#111827] tracking-tight">
                {loading ? '-' : todayRequisitions.totalQty}
              </span>
              <span className="text-xs text-[#6B7280]">units</span>
            </div>
            <span className="text-[11px] text-[#6B7280] block mt-1">
              From {todayRequisitions.count} transactions (Deduct & POS)
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Warehouse Outflow</span>
            <Link href="/history?type=OUT" className="text-[#0B6B4F] font-medium hover:underline">
              View History
            </Link>
          </div>
        </div>

        {/* KPI 3: Restocks Today (White Card) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Received Today</span>
            <div className="w-7 h-7 rounded-lg bg-[#E6F5EF] flex items-center justify-center text-[#027A48]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-[#027A48] tracking-tight">
                {loading ? '-' : todayRestocks.totalQty}
              </span>
              <span className="text-xs text-[#6B7280]">units</span>
            </div>
            <span className="text-[11px] text-[#6B7280] block mt-1">
              From {todayRestocks.count} receiving batches
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Inward Inflow</span>
            <span className="text-[#027A48] font-medium font-mono text-[10px]">
              +{todayRestocks.totalQty} units
            </span>
          </div>
        </div>

        {/* KPI 4: Total Items in System (White Card) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7280]">Total Registered Items</span>
            <div className="w-7 h-7 rounded-lg bg-[#E6F5EF] flex items-center justify-center text-[#0B6B4F]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-[#111827] tracking-tight">
                {loading ? '-' : items.length}
              </span>
              <span className="text-xs text-[#6B7280]">items</span>
            </div>
            <span className="text-[11px] text-[#6B7280] block mt-1">
              Across {categories.length} school categories
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Roong Aroon Inventory</span>
            <Link href="/inventory" className="text-[#0B6B4F] font-medium hover:underline">
              Manage Stock
            </Link>
          </div>
        </div>
      </div>

      {/* 3. STOCK MOVEMENT TREND CHART (Donezo Style Weekly Visual) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">
                Stock Movement Trends (Last 7 Days)
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Daily comparison of inward receipts (+IN) and outward dispatches (-OUT)
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#0B6B4F]"></span>
              <span className="text-[#6B7280]">Received (+IN)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#34D399]"></span>
              <span className="text-[#6B7280]">Dispatched (-OUT)</span>
            </div>
          </div>
        </div>

        {/* Bar Visual */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 h-36 items-end border-b border-[#E5E7EB] pb-2">
            {last7DaysTrends.map((d, i) => {
              const inHeight = Math.max(8, (d.inQty / maxTrendQty) * 100);
              const outHeight = Math.max(8, (d.outQty / maxTrendQty) * 100);

              return (
                <div key={i} className="flex flex-col items-center justify-end h-full gap-1 group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                    {/* IN Bar */}
                    <div
                      style={{ height: `${inHeight}%` }}
                      className="w-3 sm:w-5 bg-[#0B6B4F] rounded-t-md transition-all duration-300 hover:opacity-90 relative"
                      title={`Received: ${d.inQty} units`}
                    ></div>
                    {/* OUT Bar */}
                    <div
                      style={{ height: `${outHeight}%` }}
                      className="w-3 sm:w-5 bg-[#34D399] rounded-t-md transition-all duration-300 hover:opacity-90 relative"
                      title={`Dispatched: ${d.outQty} units`}
                    ></div>
                  </div>
                  <span className="text-[11px] font-medium text-[#6B7280] group-hover:text-[#111827] mt-1">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. URGENT LOW STOCK SECTION (if any) */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B54708]" />
              <h2 className="text-sm font-bold text-[#111827]">
                Low Stock Warning ({lowStockItems.length} items)
              </h2>
            </div>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="text-xs text-[#6B7280] hover:text-[#111827] underline underline-offset-2"
            >
              {lowStockOnly ? 'Show all in table below' : 'Filter in table below'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {lowStockItems.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] border-l-4 border-l-[#B54708] rounded-xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#6B7280]">{item.code}</span>
                    <span className="text-xs font-semibold text-[#111827] truncate">{item.name}</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.location || 'Main Storage'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-bold text-[#B54708]">
                    {item.currentStock}
                  </span>
                  <span className="text-[10px] text-[#6B7280] ml-1">{item.unit}</span>
                  <span className="text-[10px] text-[#6B7280] block">(Threshold: {item.minStock})</span>

                  {canRestock && (
                    <button
                      onClick={() => setSelectedItemForRestock(item)}
                      className="mt-1 px-2 py-0.5 bg-[#E6F5EF] hover:bg-[#d4efe3] text-[#0B6B4F] text-[10px] font-semibold rounded transition"
                    >
                      + Restock
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. HIGH DENSITY INVENTORY TABLE & LIVE STREAM (Donezo 2-column or full layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table (2 Columns on Large Desktop) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          {/* Table Header / Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#0B6B4F]" />
              <h3 className="text-sm font-bold text-[#111827]">
                Warehouse Inventory ({filteredItems.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0B6B4F]"
              >
                <option value="ALL">All Categories ({items.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <Link
                href="/inventory"
                className="px-3 py-1.5 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Table Body (High Density) */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5 w-28">SKU Code</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Item Description</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell w-28">Category</th>
                  <th className="py-2.5 px-3 w-24">Status</th>
                  <th className="py-2.5 px-3.5 w-24 text-right">Stock</th>
                  <th className="py-2.5 px-3.5 w-24 text-right">Actions</th>
                </tr>
              </thead>

              {loading ? (
                <tbody className="divide-y divide-[#E5E7EB]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-2.5 px-3.5"><div className="h-3 w-16 bg-[#E5E7EB] rounded"></div></td>
                      <td className="py-2.5 px-3"><div className="h-3 w-32 bg-[#E5E7EB] rounded"></div></td>
                      <td className="py-2.5 px-3 hidden sm:table-cell"><div className="h-3 w-20 bg-[#E5E7EB]/60 rounded"></div></td>
                      <td className="py-2.5 px-3"><div className="h-4 w-14 bg-[#E5E7EB]/60 rounded"></div></td>
                      <td className="py-2.5 px-3.5 text-right"><div className="h-3 w-8 bg-[#E5E7EB] rounded ml-auto"></div></td>
                      <td className="py-2.5 px-3.5 text-right"><div className="h-4 w-12 bg-[#E5E7EB] rounded ml-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              ) : filteredItems.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#6B7280]">
                      <p className="text-xs font-medium">No items found</p>
                      <p className="text-[11px] mt-0.5">Try adjusting your filters or search keywords</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredItems.slice(0, 10).map(item => {
                    const isLow = item.currentStock <= item.minStock;
                    const isOut = item.currentStock <= 0;
                    const cat = categories.find(c => c.id === item.categoryId);

                    return (
                      <tr key={item.id} className="hover:bg-[#F9FAFB] transition">
                        {/* SKU (font-mono) */}
                        <td className="py-2.5 px-3.5 font-mono text-xs text-[#6B7280] whitespace-nowrap">
                          {item.code}
                        </td>

                        {/* Name */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#111827] leading-tight">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-[#6B7280] mt-0.5 sm:hidden">
                            {cat?.name}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 hidden sm:table-cell text-[#6B7280] text-[11px] whitespace-nowrap">
                          {cat?.name || 'General'}
                        </td>

                        {/* Muted Status Badge with Thin Border */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#FEE4E2] text-[#B42318] border border-[#B42318]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B42318]"></span>
                              <span>Out</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#FEF0C7] text-[#B54708] border border-[#B54708]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]"></span>
                              <span>Low</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#E6F5EF] text-[#0B6B4F] border border-[#0B6B4F]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#027A48]"></span>
                              <span>In Stock</span>
                            </span>
                          )}
                        </td>

                        {/* Stock (font-mono) */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <span className={`font-mono text-xs font-bold ${isLow ? 'text-[#B54708]' : 'text-[#111827]'}`}>
                            {item.currentStock}
                          </span>
                          <span className="text-[10px] text-[#6B7280] ml-1">
                            {item.unit}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canRestock && (
                              <button
                                onClick={() => setSelectedItemForRestock(item)}
                                className="px-2 py-0.5 bg-[#E6F5EF] hover:bg-[#d6f0e4] text-[#0B6B4F] rounded text-[10px] font-medium transition"
                                title="Receive Stock"
                              >
                                +In
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedItemForDeduct(item)}
                              disabled={isOut}
                              className="px-2 py-0.5 bg-[#0B6B4F] hover:bg-[#0F3D2E] disabled:opacity-40 text-white rounded text-[10px] font-medium transition"
                              title="Deduct Stock"
                            >
                              Deduct
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
          <div className="p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] text-[11px] text-[#6B7280] flex items-center justify-between">
            <span>Showing {filteredItems.slice(0, 10).length} of {filteredItems.length} items</span>
            <Link href="/inventory" className="text-[#0B6B4F] font-semibold hover:underline flex items-center gap-1">
              <span>View All Inventory</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Activity Stream (1 Column on Large Desktop) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0B6B4F]" />
              <h3 className="text-sm font-bold text-[#111827]">
                Recent Activity Stream
              </h3>
            </div>
            <Link href="/history" className="text-xs text-[#0B6B4F] font-medium hover:underline">
              View All
            </Link>
          </div>

          {/* Activity List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-[#6B7280] text-center py-6">
                No recent activity recorded yet
              </p>
            ) : (
              recentTransactions.slice(0, 8).map(tx => {
                const isOut = tx.type === 'OUT' || tx.type === 'SALE';
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#111827] truncate">
                          {tx.itemName}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                        <span>{tx.requesterName || tx.userName || tx.department || 'Staff'}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isOut
                          ? 'bg-[#FEE4E2] text-[#B42318]'
                          : 'bg-[#E6F5EF] text-[#027A48]'
                      }`}
                    >
                      {isOut ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Quick Deduct Modal */}
      {selectedItemForDeduct && (
        <QuickDeductModal
          isOpen={!!selectedItemForDeduct}
          item={selectedItemForDeduct}
          departments={departments}
          onClose={() => setSelectedItemForDeduct(null)}
          onSuccess={handleDeductSuccess}
        />
      )}

      {/* 2. Quick Restock Modal */}
      {selectedItemForRestock && (
        <QuickRestockModal
          isOpen={!!selectedItemForRestock}
          item={selectedItemForRestock}
          departments={departments}
          onClose={() => setSelectedItemForRestock(null)}
          onSuccess={handleRestockSuccess}
        />
      )}

      {/* 3. Scanner Modal */}
      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={code => {
            setIsScannerOpen(false);
            const found = items.find(
              i => i.code.toLowerCase() === code.trim().toLowerCase() || i.id === code.trim()
            );
            if (found) {
              setSelectedItemForDeduct(found);
              showToast(`Item found: ${found.name}`);
            } else {
              showToast(`Item not found for code: ${code}`);
            }
          }}
        />
      )}
    </div>
  );
}
