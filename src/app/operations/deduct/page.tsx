'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Department, Transaction } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import ScannerModal from '@/components/ScannerModal';
import {
  Scissors,
  Search,
  ScanLine,
  Building2,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  History,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Wallet,
  ShieldAlert,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  item: Item;
  quantity: number;
  unitCost: number;
}

const DEDUCT_REASONS = [
  'Classroom & Teaching Material',
  'School Event & Activity',
  'Office & Administration',
  'Maintenance & Facility',
  'Damaged / Written-off',
  'Other'
];

export default function StockDeductPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentOutLogs, setRecentOutLogs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Cart state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [requesterName, setRequesterName] = useState<string>('');
  const [reason, setReason] = useState<string>(DEDUCT_REASONS[0]);
  const [note, setNote] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideBudget, setOverrideBudget] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Modals & Feedback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    itemCount: number;
    totalUnits: number;
    totalCost: number;
    department: string;
    remainingBudget?: number;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, deptRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/departments'),
        fetch('/api/transactions?type=OUT&limit=6')
      ]);

      const itemsData = await itemsRes.json();
      const deptData = await deptRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      const depts: Department[] = deptData.departments || itemsData.departments || [];
      setDepartments(depts);
      setRecentOutLogs(txData.transactions || []);

      if (depts.length > 0 && !selectedDeptId) {
        setSelectedDeptId(depts[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill requester name from user session
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setRequesterName(name);
    }
  }, [user]);

  // Selected Department details
  const currentDepartment = useMemo(() => {
    return departments.find(d => d.id === selectedDeptId) || departments[0] || null;
  }, [departments, selectedDeptId]);

  // Budget calculations
  const allocatedBudget = currentDepartment?.allocatedBudget ?? 0;
  const spentBudget = currentDepartment?.spentBudget ?? 0;
  const currentRemainingBudget = allocatedBudget - spentBudget;

  // Cart summary calculations
  const totalCartCost = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity * ci.unitCost, 0);
  }, [cart]);

  const totalCartUnits = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cart]);

  const projectedRemainingBudget = currentRemainingBudget - totalCartCost;
  const isBudgetExceeded = projectedRemainingBudget < 0;

  // Filter items for search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Add item to cart
  const handleAddToCart = (item: Item) => {
    if (item.currentStock <= 0) return;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(ci => ci.item.id === item.id);
      if (existingIndex !== -1) {
        const existing = prevCart[existingIndex];
        if (existing.quantity >= item.currentStock) {
          setErrorMessage(`Cannot exceed available stock of ${item.currentStock} ${item.unit}.`);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1
        };
        return updated;
      } else {
        const cost = item.cost !== undefined && item.cost > 0 ? item.cost : (item.price ?? 0);
        return [...prevCart, { item, quantity: 1, unitCost: cost }];
      }
    });
    setErrorMessage(null);
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    setCart(prevCart => {
      return prevCart
        .map(ci => {
          if (ci.item.id === itemId) {
            const max = ci.item.currentStock;
            const validQty = Math.max(1, Math.min(max, newQty));
            return { ...ci, quantity: validQty };
          }
          return ci;
        })
        .filter(ci => ci.quantity > 0);
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(ci => ci.item.id !== itemId));
  };

  // Scanner handler
  const handleScanSuccess = (scannedCode: string) => {
    setIsScannerOpen(false);
    const cleanCode = scannedCode.trim();
    const found = items.find(
      i => i.code.toLowerCase() === cleanCode.toLowerCase() || i.id === cleanCode
    );

    if (found) {
      if (found.currentStock <= 0) {
        setErrorMessage(`Item "${found.name}" (${found.code}) is out of stock!`);
      } else {
        handleAddToCart(found);
        setSearchQuery('');
        setErrorMessage(null);
      }
    } else {
      setSearchQuery(cleanCode);
      setErrorMessage(`No item found matching barcode/code "${cleanCode}".`);
    }
  };

  // Submit batch requisition
  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage('Please add at least one item to the issue requisition.');
      return;
    }

    if (isBudgetExceeded && !overrideBudget) {
      setErrorMessage(
        `Department budget exceeded by ฿${Math.abs(projectedRemainingBudget).toLocaleString('th-TH', { minimumFractionDigits: 2 })}. Check "Admin Budget Override" to proceed.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        type: 'OUT',
        items: cart.map(ci => ({
          itemId: ci.item.id,
          quantity: ci.quantity,
          unitCost: ci.unitCost
        })),
        departmentId: currentDepartment?.id,
        department: currentDepartment?.name,
        requesterName: requesterName.trim() || 'School Staff',
        issuedToName: requesterName.trim() || 'School Staff',
        note: [
          `Reason: ${reason}`,
          note.trim() ? `Note: ${note.trim()}` : '',
          overrideBudget ? `[ADMIN OVERRIDE: ${overrideReason.trim() || 'Approved by Admin'}]` : ''
        ].filter(Boolean).join(' | '),
        overrideBudget
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process issue requisition');
      }

      // Success
      setSuccessInfo({
        itemCount: cart.length,
        totalUnits: totalCartUnits,
        totalCost: totalCartCost,
        department: currentDepartment?.name || '',
        remainingBudget: data.remainingBudget
      });

      // Reset cart and fields
      setCart([]);
      setNote('');
      setOverrideBudget(false);
      setOverrideReason('');

      // Refresh data
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while submitting requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <Link href="/" className="hover:text-[#0B6B4F] transition">Dashboard</Link>
            <span>/</span>
            <span className="text-[#111827] font-medium">Operations</span>
            <span>/</span>
            <span className="text-[#0B6B4F] font-semibold">Issue Stock</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
            <Scissors className="w-6 h-6 text-[#0B6B4F]" />
            <span>Stock Issue & Department Requisition</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Multi-item batch issuance with real-time department budget tracking and validation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/history?type=OUT"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F9FAFB] transition shadow-2xs"
          >
            <History className="w-4 h-4" />
            <span>Outgoing Logs</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="p-4 bg-[#E6F5EF] border border-[#0B6B4F]/30 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0B6B4F] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#0B6B4F] block">
                Issue Requisition Recorded Successfully!
              </span>
              <p className="text-xs text-[#111827] mt-0.5">
                Successfully issued <strong className="font-semibold">{successInfo.itemCount} items</strong> ({successInfo.totalUnits} units) totaling <strong className="font-semibold text-[#0B6B4F]">฿{successInfo.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> for <strong className="font-semibold">{successInfo.department}</strong>.
              </p>
              {successInfo.remainingBudget !== undefined && (
                <span className="text-[11px] text-[#6B7280] block mt-1">
                  Updated remaining department budget: <strong className="text-[#0B6B4F] font-semibold">฿{successInfo.remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessInfo(null)}
            className="text-xs text-[#6B7280] hover:text-[#111827] px-2 py-1 rounded-lg hover:bg-white/50 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-[#FEE4E2] border border-[#B42318]/30 rounded-2xl flex items-start gap-3 text-left animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" />
          <div className="text-xs text-[#B42318]">
            <span className="font-bold block">Requisition Alert</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Requisition Cart & Item Picker (Left 2 Cols) + Logs & Overview (Right Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* STEP 1: Department & Real-Time Budget Overview */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Department & Budget Allocation</span>
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor="dept-select" className="text-xs font-medium text-[#6B7280]">
                  Department:
                </label>
                <select
                  id="dept-select"
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(e.target.value)}
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] px-3 py-1.5 outline-none focus:border-[#0B6B4F]"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department Budget Real-Time Card */}
            {currentDepartment && (
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#0B6B4F]" />
                    <span className="text-xs font-bold text-[#111827]">
                      {currentDepartment.name} • Fiscal Year {currentDepartment.fiscalYear || '2026'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280]">
                    Used: {allocatedBudget > 0 ? ((spentBudget / allocatedBudget) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                {/* Budget Stat Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Allocated</span>
                    <span className="font-mono font-bold text-sm text-[#111827]">
                      ฿{allocatedBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Spent</span>
                    <span className="font-mono font-bold text-sm text-[#B45309]">
                      ฿{spentBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Remaining</span>
                    <span className="font-mono font-bold text-sm text-[#0B6B4F]">
                      ฿{currentRemainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    isBudgetExceeded ? 'bg-red-50 border-red-200' : 'bg-white border-[#E5E7EB]'
                  }`}>
                    <span className="text-[10px] text-[#6B7280] block">Projected</span>
                    <span className={`font-mono font-bold text-sm ${
                      isBudgetExceeded ? 'text-[#B42318]' : 'text-[#0B6B4F]'
                    }`}>
                      ฿{projectedRemainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, allocatedBudget > 0 ? (spentBudget / allocatedBudget) * 100 : 0)}%`
                    }}
                    className={`h-full transition-all duration-300 ${
                      spentBudget >= allocatedBudget ? 'bg-red-500' : 'bg-[#0B6B4F]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Requester & Reason Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  Requester Name *
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={e => setRequesterName(e.target.value)}
                  placeholder="e.g. Teacher John, Science Lab Tech..."
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  Requisition Purpose *
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                >
                  {DEDUCT_REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: Item Search & Picker */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Search & Add Items to Requisition Cart</span>
            </span>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items by name, SKU barcode, or storage location..."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#0B6B4F] focus:bg-white text-xs text-[#111827] placeholder:text-[#9CA3AF] pl-9 pr-24 py-2.5 rounded-xl transition outline-none"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-medium text-[#0B6B4F] bg-[#E6F5EF] hover:bg-[#d6f0e4] rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>
            </div>

            {/* Items Picker List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B7280] bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
                  {searchQuery.trim() ? `No items matched "${searchQuery}".` : 'No inventory items found.'}
                </div>
              ) : (
                filteredItems.map(item => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLow = item.currentStock <= item.minStock;
                  const cost = item.cost !== undefined && item.cost > 0 ? item.cost : (item.price ?? 0);
                  const inCartItem = cart.find(ci => ci.item.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isOutOfStock
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : inCartItem
                          ? 'bg-[#E6F5EF]/40 border-[#0B6B4F]/40'
                          : 'bg-white border-[#E5E7EB] hover:border-[#0B6B4F] hover:shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#111827]">{item.code}</span>
                          {isOutOfStock ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Low Stock
                            </span>
                          ) : null}
                          {item.location && (
                            <span className="text-[10px] text-[#6B7280] flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {item.location}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#111827] block truncate mt-0.5">
                          {item.name}
                        </span>
                        <div className="text-[11px] text-[#6B7280] flex items-center gap-3 mt-0.5">
                          <span>Unit Cost: <strong className="font-mono font-medium text-[#111827]">฿{cost.toFixed(2)}</strong></span>
                          <span>In Stock: <strong className={`font-mono ${isOutOfStock ? 'text-red-600' : 'text-[#0B6B4F]'}`}>{item.currentStock} {item.unit}</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isOutOfStock ? (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          >
                            Out of Stock
                          </button>
                        ) : inCartItem ? (
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-[#0B6B4F]">
                            <span className="text-[11px] font-semibold text-[#0B6B4F]">
                              In Cart ({inCartItem.quantity})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              disabled={inCartItem.quantity >= item.currentStock}
                              className="w-5 h-5 rounded bg-[#0B6B4F] text-white flex items-center justify-center text-xs font-bold disabled:opacity-40"
                              title="Add one more"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0B6B4F] hover:bg-[#0F3D2E] transition shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 3: Requisition Cart & Final Confirmation */}
          <form onSubmit={handleSubmitRequisition} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#0B6B4F]" />
                <span>Requisition Cart ({cart.length} items)</span>
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Cart</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#6B7280] bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB] space-y-1">
                <ShoppingCart className="w-8 h-8 mx-auto text-[#6B7280]/40 mb-1" />
                <p className="font-medium text-[#111827]">Requisition Cart is empty</p>
                <p className="text-[11px]">Select items from the search list above to add them to this requisition.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map(ci => {
                  const lineTotal = ci.quantity * ci.unitCost;
                  const maxQty = ci.item.currentStock;

                  return (
                    <div
                      key={ci.item.id}
                      className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#111827]">{ci.item.code}</span>
                          <span className="text-xs font-semibold text-[#111827] truncate">{ci.item.name}</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                          <span>Rate: ฿{ci.unitCost.toFixed(2)} / {ci.item.unit}</span>
                          <span>•</span>
                          <span>Max available: {maxQty}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#E5E7EB] rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(ci.item.id, ci.quantity - 1)}
                            className="px-2.5 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition text-xs font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={ci.quantity}
                            onChange={e => handleUpdateQuantity(ci.item.id, parseInt(e.target.value, 10) || 1)}
                            className="w-14 text-center font-bold font-mono text-xs text-[#111827] py-1 outline-none border-x border-[#E5E7EB]"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(ci.item.id, ci.quantity + 1)}
                            disabled={ci.quantity >= maxQty}
                            className="px-2.5 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition text-xs font-bold disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="w-24 text-right">
                          <span className="font-mono font-bold text-xs text-[#111827] block">
                            ฿{lineTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(ci.item.id)}
                          className="p-1.5 text-[#6B7280] hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Remove from requisition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Cart Totals Summary */}
                <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">
                    Total Requisition Value ({totalCartUnits} units in {cart.length} items):
                  </span>
                  <span className="text-base font-extrabold font-mono text-[#0B6B4F]">
                    ฿{totalCartCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Note Input */}
            <div>
              <label className="text-xs font-semibold text-[#111827] block mb-1">
                Additional Reference / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Science Fair 2026, Midterm exam preparation..."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
              />
            </div>

            {/* Budget Overflow Warning & Admin Override */}
            {isBudgetExceeded && cart.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      Warning: Department Budget Exceeded
                    </span>
                    <p className="mt-0.5 text-[11px]">
                      This requisition of <strong>฿{totalCartCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> exceeds the remaining budget of <strong>฿{currentRemainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> by <strong>฿{Math.abs(projectedRemainingBudget).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-950">
                    <input
                      type="checkbox"
                      checked={overrideBudget}
                      onChange={e => setOverrideBudget(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0B6B4F] focus:ring-[#0B6B4F]"
                    />
                    <span>Admin Budget Override</span>
                  </label>

                  {overrideBudget && (
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      placeholder="Justification note..."
                      className="bg-white border border-amber-300 rounded-lg text-xs p-1.5 text-amber-950 placeholder:text-amber-400 outline-none flex-1 max-w-sm"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  cart.length === 0 ||
                  (isBudgetExceeded && !overrideBudget)
                }
                className="w-full sm:w-auto min-w-[220px] bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Processing Issue Requisition...'
                    : `Confirm Issue Requisition (${totalCartUnits} units)`}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Recent Outgoing Logs */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0B6B4F]" />
                <span>Recent Outgoing Dispatches</span>
              </span>
              <Link href="/history?type=OUT" className="text-[11px] text-[#0B6B4F] hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentOutLogs.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  No stock issues recorded yet today.
                </p>
              ) : (
                recentOutLogs.slice(0, 6).map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111827] truncate">
                        {log.itemName}
                      </span>
                      <span className="font-bold text-[#B42318] shrink-0 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        -{log.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-0.5">
                      <span className="truncate">{log.department || 'General Academic'}</span>
                      <span className="shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {log.requesterName && (
                      <div className="text-[10px] text-[#6B7280] truncate">
                        Requester: {log.requesterName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Barcode Scanner Modal */}
      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
}
