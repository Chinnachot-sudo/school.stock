'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Item, Department, Transaction } from '@/types/inventory';
import ScannerModal from '@/components/ScannerModal';
import QuickDeductModal from '@/components/QuickDeductModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import {
  ScanLine,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  ClipboardCheck,
  Bell,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  ShieldAlert,
  CalendarDays,
  AlertTriangle,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { features } from '@/config/navigation.config';

function HomeContent() {
  const { user, can, role, appUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currentRole = String(role || appUser?.role || user?.role || 'teacher').toUpperCase();
  const isWarehouseOrAdmin = useMemo(() => (
    ['ADMIN', 'SUPER_ADMIN', 'LEGACY_ADMIN', 'WAREHOUSE', 'INVENTORY_MANAGER'].includes(currentRole) ||
    can('inventory:stock:restock') || can('inventory:stock:adjust')
  ), [currentRole, can]);

  const outOfStockCount = useMemo(() => {
    return items.filter(it => it.currentStock <= 0).length;
  }, [items]);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItemForDeduct, setSelectedItemForDeduct] = useState<Item | null>(null);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SearchParams Tab Resolution
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'overview').toLowerCase();

  interface ApprovalItem {
    id: string;
    requester: string;
    dept: string;
    item: string;
    qty: number;
    unit: string;
    date: string;
    purpose: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }

  // Approvals State
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
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
      const [itemsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?limit=30')
      ]);

      const itemsData = await itemsRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      setDepartments(itemsData.departments || []);
      setRecentTransactions(txData.transactions || []);
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
    const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();
    const outTxs = recentTransactions.filter(
      tx => (tx.type === 'OUT' || tx.type === 'SALE') && isToday(tx.createdAt)
    );
    const totalQty = outTxs.reduce((sum, tx) => sum + tx.quantity, 0);
    return { count: outTxs.length, totalQty };
  }, [recentTransactions]);

  const todayRestocks = useMemo(() => {
    const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();
    const inTxs = recentTransactions.filter(
      tx => tx.type === 'IN' && isToday(tx.createdAt)
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-4 py-2.5 rounded-xl border border-[#E5E7EB]/20 flex items-center gap-2.5 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dashboard header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Roong Aroon International School
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Inventory & School Store Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            title="Quick Scan"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#0B6B4F] hover:bg-[#F3F4F6] transition shadow-2xs text-xs font-medium"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quick Scan</span>
          </button>
          <button
            type="button"
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
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

          {approvals.filter(a => approvalFilter === 'ALL' || a.status === approvalFilter).length === 0 ? (
            <div className="py-14 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">Approval data is not connected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This screen does not load approval requests from Supabase. No approval status is being changed here.
              </p>
            </div>
          ) : (
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
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/inventory?filter=low" className="bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Low / Out of Stock</span>
                <AlertCircle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="my-3">
                <span className="text-3xl font-extrabold font-mono text-amber-900">{loading ? '-' : lowStockItems.length}</span>
                <p className="text-[11px] text-amber-800 mt-1">{outOfStockCount} out of stock · {Math.max(0, lowStockItems.length - outOfStockCount)} below minimum</p>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">View critical items</span>
            </Link>

            <Link href="/my-space?tab=my-requests" className="bg-white border border-[#E5E7EB] hover:border-[#0B6B4F]/40 rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B7280]">Pending Requests</span>
                <ClipboardCheck className="w-4 h-4 text-[#0B6B4F]" />
              </div>
              <div className="my-3">
                <span className="text-3xl font-bold font-mono text-[#111827]">—</span>
                <p className="text-[11px] text-[#6B7280] mt-1">Request tracking is not connected yet</p>
              </div>
              <span className="text-[11px] text-[#0B6B4F] font-medium">View my requests</span>
            </Link>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B7280]">Received Today</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="my-3">
                <div className="flex items-baseline gap-1.5"><span className="text-3xl font-bold font-mono text-emerald-700">{loading ? '-' : todayRestocks.totalQty}</span><span className="text-xs text-[#6B7280]">units</span></div>
                <p className="text-[11px] text-[#6B7280] mt-1">{todayRestocks.count} receiving transactions</p>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Stock in</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B7280]">Dispatched Today</span>
                <ArrowDownRight className="w-4 h-4 text-rose-700" />
              </div>
              <div className="my-3">
                <div className="flex items-baseline gap-1.5"><span className="text-3xl font-bold font-mono text-[#111827]">{loading ? '-' : todayRequisitions.totalQty}</span><span className="text-xs text-[#6B7280]">units</span></div>
                <p className="text-[11px] text-[#6B7280] mt-1">{todayRequisitions.count} issue and POS transactions</p>
              </div>
              <Link href="/history?type=OUT" className="text-[11px] text-[#0B6B4F] font-medium hover:underline">View stock history</Link>
            </div>
          </div>

      {isWarehouseOrAdmin && (
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
      )}

      {isWarehouseOrAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div>
                <h2 className="text-sm font-bold text-[#111827]">Action Required: Critical Low Stock</h2>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Items at or below their minimum stock level</p>
              </div>
              <Link href="/inventory?filter=low" className="text-xs text-[#0B6B4F] font-semibold hover:underline">View all</Link>
            </div>
            {loading ? (
              <p className="p-6 text-center text-xs text-[#6B7280]">Loading stock status…</p>
            ) : lowStockItems.length === 0 ? (
              <p className="p-6 text-center text-xs text-[#6B7280]">No critical stock items.</p>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {lowStockItems.slice(0, 8).map(item => (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111827] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">{item.code}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-800 shrink-0">
                      {item.currentStock} / {item.minStock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0B6B4F]" />
                <h2 className="text-sm font-bold text-[#111827]">Recent Activity Stream</h2>
              </div>
              <Link href="/history" className="text-xs text-[#0B6B4F] font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">No recent activity recorded yet</p>
              ) : recentTransactions.slice(0, 8).map(tx => {
                const isOut = tx.type === 'OUT' || tx.type === 'SALE';
                return (
                  <div key={tx.id} className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#111827] truncate">{tx.itemName}</p>
                      <p className="text-[10px] text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                        <span>{tx.requesterName || tx.userName || tx.department || 'Staff'}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${isOut ? 'bg-[#FEE4E2] text-[#B42318]' : 'bg-[#E6F5EF] text-[#027A48]'}`}>
                      {isOut ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <section className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB]">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">My Recent Requisitions</h2>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Track request status and pickup readiness</p>
            </div>
            <Link href="/my-space?tab=new-request" className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-[#0F3D2E] text-white text-xs font-semibold transition">
              <span>+ Request Items</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white border-b border-[#E5E7EB] text-[#6B7280] text-[11px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pickup</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-[#6B7280]">
                    Request history is unavailable because requisitions are not stored by the system yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
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

