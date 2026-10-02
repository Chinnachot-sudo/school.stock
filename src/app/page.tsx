'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  Bell,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  ShieldAlert,
  CalendarDays,
  Truck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { features } from '@/config/navigation.config';

function HomeContent() {
  const { user, can, role, appUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Role-aware Stock Overview visibility
  const isWarehouseOrFinanceOrAdmin = useMemo(() => {
    const userRole = (role || appUser?.role || user?.role || '').toUpperCase();
    const allowed = ['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_STAFF', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'LEGACY_ADMIN'];
    return allowed.includes(userRole) || can('inventory:item:create') || can('inventory:stock:issue');
  }, [role, appUser, user, can]);

  // Stock Overview Metrics
  const stockValuation = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.currentStock * (it.price || 0)), 0);
  }, [items]);

  const healthyStockCount = useMemo(() => {
    return items.filter(it => it.currentStock > it.minStock).length;
  }, [items]);

  const outOfStockCount = useMemo(() => {
    return items.filter(it => it.currentStock <= 0).length;
  }, [items]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItemForDeduct, setSelectedItemForDeduct] = useState<Item | null>(null);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SearchParams Tab Resolution
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'overview').toLowerCase();

  // Approvals State
  const [approvals, setApprovals] = useState([
    {
      id: 'APP-101',
      requester: 'Ms. Sarah (Grade 4)',
      dept: 'Primary Years (PYP)',
      item: 'A4 Copier Paper (Double A 80gsm)',
      qty: 5,
      unit: 'Ream',
      date: '24 Sep 2026, 08:30',
      purpose: 'Term Examination Preparation and Worksheets',
      status: 'PENDING'
    },
    {
      id: 'APP-102',
      requester: 'Mr. David (Science Lab)',
      dept: 'Middle Years (MYP)',
      item: 'Nitrile Disposable Gloves (Size M)',
      qty: 2,
      unit: 'Box',
      date: '24 Sep 2026, 09:15',
      purpose: 'Grade 8 Chemistry Laboratory Experiment',
      status: 'PENDING'
    },
    {
      id: 'APP-103',
      requester: 'Kru Sompong (Thai Dept)',
      dept: 'Diploma Programme (DP)',
      item: 'Whiteboard Bullet Markers (Black)',
      qty: 6,
      unit: 'Piece',
      date: '23 Sep 2026, 15:40',
      purpose: 'IB Language & Literature Classrooms',
      status: 'PENDING'
    },
    {
      id: 'APP-104',
      requester: 'Ms. Jenny (Art Dept)',
      dept: 'Primary Years (PYP)',
      item: 'Acrylic Color Set (12 Colors 75ml)',
      qty: 4,
      unit: 'Set',
      date: '22 Sep 2026, 11:20',
      purpose: 'IB Visual Arts Exhibition',
      status: 'APPROVED'
    }
  ]);
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    showToast(`Request ${id} has been approved.`);
  };

  const handleReject = (id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
    showToast(`Request ${id} has been rejected.`);
  };

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
            Daily inventory movements and warehouse overview • Roong Aroon International School
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {can('inventory:stock:restock') && (
            <Link
              href="/operations/restock"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Receive Stock</span>
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
            onClick={fetchData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION (Overview, Approvals, Notifications, Calendar) */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-[#E5E7EB] shadow-2xs">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#E6F5EF] text-[#0B6B4F] shadow-2xs'
              : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Overview</span>
        </Link>

        <Link
          href="/?tab=approvals"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-[#E6F5EF] text-[#0B6B4F] shadow-2xs'
              : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Approvals</span>
          {approvals.filter(a => a.status === 'PENDING').length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {approvals.filter(a => a.status === 'PENDING').length}
            </span>
          )}
        </Link>

        <Link
          href="/?tab=inbox"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'inbox' || activeTab === 'notifications'
              ? 'bg-[#E6F5EF] text-[#0B6B4F] shadow-2xs'
              : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Inbox</span>
          {lowStockItems.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {lowStockItems.length}
            </span>
          )}
        </Link>

        {features.calendar && (
          <Link
            href="/?tab=calendar"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#E6F5EF] text-[#0B6B4F] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </Link>
        )}
      </div>

      {/* VIEW: APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#0B6B4F]" />
                <span>Pending Approvals Hub</span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                Review and approve supply requests across academic departments and grade levels.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setApprovalFilter(status)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    approvalFilter === status
                      ? 'bg-white text-[#0B6B4F] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals
              .filter(a => approvalFilter === 'ALL' || a.status === approvalFilter)
              .map(app => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0B6B4F]/40 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0B6B4F]">{app.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        app.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{app.item}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quantity: <span className="font-bold text-slate-800 font-mono">{app.qty} {app.unit}</span> • Department: {app.dept}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Purpose: {app.purpose}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Requester: <strong className="text-slate-700">{app.requester}</strong> ({app.date})</span>
                    {app.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReject(app.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(app.id)}
                          className="px-3 py-1 rounded-lg text-white bg-[#0B6B4F] hover:bg-[#084D39] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW: INBOX & NOTIFICATIONS */}
      {(activeTab === 'inbox' || activeTab === 'notifications') && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-600" />
                <span>Inbox & System Alerts</span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                Security alerts, critical stock warnings, and system status updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('All notifications marked as read')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-3">
            {lowStockItems.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-900">Low Stock Alert</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-200/80 text-rose-800 rounded font-bold">CRITICAL</span>
                    </div>
                    <p className="text-xs text-rose-800 mt-0.5">
                      {item.name} [{item.code}] only has <strong className="font-mono">{item.currentStock} {item.unit}</strong> left (Minimum: {item.minStock} {item.unit})
                    </p>
                    <span className="text-[10px] text-rose-600 mt-1 block">Location: {item.location}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItemForRestock(item)}
                  className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  + Restock
                </button>
              </div>
            ))}

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-900">PBAC Security & HMAC Session Active</span>
                <p className="text-xs text-blue-800 mt-0.5">
                  All API endpoints protected with signed session cookies and granular role permissions.
                </p>
                <span className="text-[10px] text-blue-600 mt-1 block">Security Log • Today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CALENDAR */}
      {features.calendar && activeTab === 'calendar' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#0B6B4F]" />
                <span>Operations & Delivery Calendar</span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                Scheduled supplier deliveries, cycle counts, and equipment returns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 font-mono">September 2026</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                date: '25 Sep 2026 (Tomorrow)',
                title: 'Supplier Goods Delivery',
                desc: 'Double A Paper Co. delivers 50 reams A4 copy paper',
                icon: Truck,
                tag: 'RECEIPT',
                color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
              },
              {
                date: '28 Sep 2026 (Monday)',
                title: 'Weekly Physical Stock Count',
                desc: 'Physical cycle count for science lab and chemicals (MYP building)',
                icon: ClipboardCheck,
                tag: 'STOCK AUDIT',
                color: 'bg-blue-50 border-blue-200 text-blue-800'
              },
              {
                date: '30 Sep 2026 (End of Month)',
                title: 'Monthly Inventory Cutoff & Report',
                desc: 'Month-end requisition audit reconciliation and store cutoff',
                icon: Clock,
                tag: 'FINANCE CUTOFF',
                color: 'bg-purple-50 border-purple-200 text-purple-800'
              }
            ].map((event, idx) => {
              const Icon = event.icon;
              return (
                <div key={idx} className={`p-4 rounded-xl border ${event.color} space-y-2`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="font-mono">{event.date}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-mono">{event.tag}</span>
                  </div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{event.title}</span>
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed">{event.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: OVERVIEW (Existing Main Content) */}
      {activeTab === 'overview' && (
        <>
          {/* 3. 4 DONEZO KPI CARDS (Card 1: Solid Green #0B6B4F, Cards 2-4: Surface White) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Low Stock Alert (Warning Color) */}
        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden cursor-pointer transition border ${
            lowStockItems.length > 0
              ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] hover:border-[#F59E0B]'
              : 'bg-white text-[#111827] border-[#E5E7EB]'
          }`}
          title="Click to filter low stock items in table below"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#92400E]">Low Stock Alert</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              lowStockItems.length > 0 ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono tracking-tight block text-[#B45309]">
              {loading ? '-' : lowStockItems.length}
            </span>
            <span className="text-[11px] text-[#92400E]/80 block mt-1">
              {lowStockItems.length > 0
                ? 'Items need restock or reordering soon'
                : 'All inventory within safety stock levels'}
            </span>
          </div>

          <div className="pt-2 border-t border-[#FDE68A] flex items-center justify-between text-[11px]">
            <span className="text-[#92400E]/70 font-medium">Safety Threshold</span>
            <span className="text-[#B45309] font-bold">
              {lowStockOnly ? '✓ Filtering Low Stock' : 'Click to Filter Table'}
            </span>
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

      {/* ROLE-AWARE STOCK OVERVIEW (Merged from Inventory > Dashboard) */}
      {isWarehouseOrFinanceOrAdmin && (
        <div className="bg-gradient-to-r from-emerald-950 via-[#0B6B4F] to-emerald-900 rounded-2xl p-5 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white">Stock Overview & Operational Health</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Warehouse Staff • Accountant • Admin
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">
                  Comprehensive live catalog valuation, inventory health indicators, and warehouse fast actions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/inventory?tab=receipt"
                className="px-3 py-1.5 rounded-xl bg-white text-[#0B6B4F] hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Goods Receipt</span>
              </Link>
              <Link
                href="/inventory?tab=issue"
                className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 border border-emerald-700/60"
              >
                <PackageMinus className="w-3.5 h-3.5" />
                <span>Issue Goods</span>
              </Link>
              <Link
                href="/inventory?tab=stock-count"
                className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 border border-emerald-700/60"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Stock Count</span>
              </Link>
              <Link
                href="/inventory"
                className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 border border-emerald-700/60"
              >
                <span>Item Master</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] text-emerald-200/80 font-medium">Estimated Catalog Valuation</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ฿{stockValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-300/80 mt-1 block">Based on registered unit costs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] text-emerald-200/80 font-medium">Healthy Stock Items</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                {healthyStockCount} <span className="text-xs font-normal text-emerald-100">SKUs</span>
              </div>
              <span className="text-[10px] text-emerald-300/80 mt-1 block">Stock level above minimum safety threshold</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] text-amber-200/80 font-medium">Low Stock Warning</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                {lowStockItems.length} <span className="text-xs font-normal text-emerald-100">SKUs</span>
              </div>
              <span className="text-[10px] text-amber-300/80 mt-1 block">Reorder point reached or approaching</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] text-rose-200/80 font-medium">Out of Stock</span>
              <div className="text-xl font-bold font-mono text-rose-300 mt-1">
                {outOfStockCount} <span className="text-xs font-normal text-emerald-100">SKUs</span>
              </div>
              <span className="text-[10px] text-rose-300/80 mt-1 block">Critical zero inventory requiring PO</span>
            </div>
          </div>
        </div>
      )}

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

        {/* Chart with Y-axis markers & gridlines */}
        <div className="pt-2 flex gap-3">
          {/* Y-Axis scale */}
          <div className="flex flex-col justify-between h-36 text-[10px] font-mono text-[#9CA3AF] pb-6 shrink-0 select-none text-right w-7">
            <span>{maxTrendQty}</span>
            <span>{Math.round(maxTrendQty * 0.66)}</span>
            <span>{Math.round(maxTrendQty * 0.33)}</span>
            <span>0</span>
          </div>

          {/* Bar Visual with subtle gridlines */}
          <div className="flex-1 relative">
            {/* Horizontal gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
              <div className="w-full border-b border-[#F3F4F6]" />
              <div className="w-full border-b border-[#F3F4F6]" />
              <div className="w-full border-b border-[#F3F4F6]" />
              <div className="w-full border-b border-[#E5E7EB]" />
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 h-36 items-end pb-2 relative z-10">
              {last7DaysTrends.map((d, i) => {
                const inHeight = d.inQty > 0 ? Math.max(6, (d.inQty / maxTrendQty) * 100) : 0;
                const outHeight = d.outQty > 0 ? Math.max(6, (d.outQty / maxTrendQty) * 100) : 0;

                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full gap-1 group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* IN Bar */}
                      <div
                        style={{ height: `${inHeight}%` }}
                        className={`w-3 sm:w-5 bg-[#0B6B4F] transition-all duration-300 hover:opacity-90 relative ${
                          inHeight > 0 ? 'rounded-t-md' : 'h-0'
                        }`}
                        title={`Received: ${d.inQty} units`}
                      ></div>
                      {/* OUT Bar */}
                      <div
                        style={{ height: `${outHeight}%` }}
                        className={`w-3 sm:w-5 bg-[#34D399] transition-all duration-300 hover:opacity-90 relative ${
                          outHeight > 0 ? 'rounded-t-md' : 'h-0'
                        }`}
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
      </div>

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
                            {can('inventory:stock:restock') && (
                              <button
                                onClick={() => setSelectedItemForRestock(item)}
                                className="px-2 py-0.5 bg-[#E6F5EF] hover:bg-[#d6f0e4] text-[#0B6B4F] rounded text-[10px] font-medium transition"
                                title="Receive Stock"
                              >
                                +In
                              </button>
                            )}

                            {can('inventory:stock:issue') && (
                              <button
                                onClick={() => setSelectedItemForDeduct(item)}
                                disabled={isOut}
                                className="px-2 py-0.5 bg-[#0B6B4F] hover:bg-[#0F3D2E] disabled:opacity-40 text-white rounded text-[10px] font-medium transition"
                                title="Deduct Stock"
                              >
                                Deduct
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
      </>
      )}

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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-sans">Loading Dashboard...</div>}>
      <HomeContent />
    </Suspense>
  );
}

