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
  ArrowRight,
  Clock,
  MapPin,
  Layers,
  History,
  HelpCircle,
  Boxes,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

const DEDUCT_REASONS = [
  'Classroom Use',
  'School Event / Activity',
  'Maintenance / Facility',
  'Damaged / Written-off',
  'Other'
];

export default function StockDeductPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentOutLogs, setRecentOutLogs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection & Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>(DEDUCT_REASONS[0]);
  const [department, setDepartment] = useState<string>('');
  const [requesterName, setRequesterName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Modals & Feedback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    itemName: string;
    itemCode: string;
    deductedQty: number;
    remaining: number;
    unit: string;
    department: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?type=OUT&limit=10')
      ]);

      const itemsData = await itemsRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      setDepartments(itemsData.departments || []);
      setRecentOutLogs(txData.transactions || []);

      if (itemsData.departments?.length > 0 && !department) {
        setDepartment(itemsData.departments[0].name);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
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

  // Filter items based on search query
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

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setQuantity(1);
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  const handleScanSuccess = (scannedCode: string) => {
    setIsScannerOpen(false);
    const cleanCode = scannedCode.trim();
    const found = items.find(
      i => i.code.toLowerCase() === cleanCode.toLowerCase() || i.id === cleanCode
    );

    if (found) {
      handleSelectItem(found);
      setSearchQuery('');
    } else {
      setSearchQuery(cleanCode);
      setErrorMessage(`No item found with barcode/code "${cleanCode}".`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setErrorMessage('Please select an item first.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than 0.');
      return;
    }

    if (quantity > selectedItem.currentStock) {
      setErrorMessage(
        `Insufficient stock! Only ${selectedItem.currentStock} ${selectedItem.unit} available.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          type: 'OUT',
          quantity,
          department: department || 'General School',
          requesterName: requesterName.trim() || 'Staff',
          note: `${reason}${note.trim() ? ` - ${note.trim()}` : ''}`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record stock deduction');
      }

      // Record success
      const newRemaining = selectedItem.currentStock - quantity;
      setSuccessInfo({
        itemName: selectedItem.name,
        itemCode: selectedItem.code,
        deductedQty: quantity,
        remaining: newRemaining,
        unit: selectedItem.unit,
        department: department || 'General School'
      });

      // Update local item stock
      setItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id ? { ...item, currentStock: newRemaining } : item
        )
      );

      // Refresh recent logs
      fetch('/api/transactions?type=OUT&limit=10')
        .then(r => r.json())
        .then(d => setRecentOutLogs(d.transactions || []))
        .catch(() => {});

      // Reset form
      setQuantity(1);
      setNote('');
      setSelectedItem(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
            <span>Stock Issue & Quick Deduct</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Record outgoing inventory items for classroom use, school events, or department distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/history?type=OUT"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F9FAFB] transition shadow-xs"
          >
            <History className="w-4 h-4" />
            <span>Out Logs</span>
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
                Stock Deduction Recorded Successfully!
              </span>
              <p className="text-xs text-[#111827] mt-0.5">
                Deducted <strong className="font-semibold">{successInfo.deductedQty} {successInfo.unit}</strong> of{' '}
                <strong className="font-semibold">{successInfo.itemName}</strong> ({successInfo.itemCode}) for{' '}
                <strong className="font-semibold">{successInfo.department}</strong>.
              </p>
              <span className="text-[11px] text-[#6B7280] block mt-1">
                Updated available stock: <strong className="text-[#0B6B4F] font-semibold">{successInfo.remaining} {successInfo.unit}</strong>
              </span>
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
        <div className="p-4 bg-[#FEE4E2] border border-[#B42318]/30 rounded-2xl flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" />
          <div className="text-xs text-[#B42318]">
            <span className="font-bold block">Attention</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Form (Left) & Recent Outgoing Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Item Selection & Deduct Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Step 1: Select Item */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Select Item to Issue</span>
              </span>
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-[11px] text-[#B42318] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Change Item</span>
                </button>
              )}
            </div>

            {!selectedItem ? (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by item name, SKU barcode, or storage location..."
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#0B6B4F] focus:bg-white text-xs text-[#111827] placeholder:text-[#9CA3AF] pl-9 pr-24 py-2.5 rounded-xl transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-medium text-[#0B6B4F] bg-[#E6F5EF] hover:bg-[#d6f0e4] rounded-lg flex items-center gap-1 transition"
                  >
                    <ScanLine className="w-3 h-3" />
                    <span>Scan</span>
                  </button>
                </div>

                {/* Filtered Items List */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {filteredItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6B7280] bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
                      No items matched your search "{searchQuery}".
                    </div>
                  ) : (
                    filteredItems.map(item => {
                      const isLow = item.currentStock <= item.minStock;
                      const isOutOfStock = item.currentStock <= 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleSelectItem(item)}
                          className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                            isOutOfStock
                              ? 'bg-[#F9FAFB] border-[#E5E7EB] opacity-60 cursor-not-allowed'
                              : 'bg-white border-[#E5E7EB] hover:border-[#0B6B4F] hover:shadow-xs'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#111827] block truncate">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6B7280] font-mono">
                              <span>SKU: {item.code}</span>
                              {item.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {item.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-bold block ${
                                isOutOfStock
                                  ? 'text-[#B42318]'
                                  : isLow
                                  ? 'text-[#B54708]'
                                  : 'text-[#0B6B4F]'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                            <span className="text-[10px] text-[#6B7280] block">
                              {isOutOfStock ? 'Out of stock' : isLow ? 'Low stock' : 'Available'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Selected Item Summary Card */
              <div className="p-4 bg-[#F9FAFB] border border-[#0B6B4F]/30 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-white border border-[#E5E7EB] text-[#111827]">
                      {selectedItem.code}
                    </span>
                    {selectedItem.currentStock <= selectedItem.minStock && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#FEF0C7] text-[#B54708]">
                        Low Stock Alert
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] mt-1 truncate">
                    {selectedItem.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                    {selectedItem.location && <span>Storage: {selectedItem.location}</span>}
                    <span>•</span>
                    <span>Min Threshold: {selectedItem.minStock} {selectedItem.unit}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-white px-4 py-2 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#6B7280] uppercase block">Current Stock</span>
                  <span className="text-base font-extrabold text-[#0B6B4F]">
                    {selectedItem.currentStock} <span className="text-xs font-normal text-[#6B7280]">{selectedItem.unit}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Deduction Details Form */}
          {selectedItem && (
            <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Issue & Deduction Details</span>
              </span>

              {/* Quantity Counter */}
              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1.5">
                  Deduct Quantity ({selectedItem.unit}) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[#E5E7EB] rounded-xl bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition text-sm font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedItem.currentStock}
                      value={quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setQuantity(val);
                      }}
                      className="w-20 text-center font-bold text-sm text-[#111827] py-2 outline-none border-x border-[#E5E7EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(selectedItem.currentStock, prev + 1))}
                      className="px-3 py-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Quantity Buttons */}
                  <div className="flex items-center gap-1.5">
                    {[1, 5, 10].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuantity(Math.min(selectedItem.currentStock, amt))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          quantity === amt
                            ? 'bg-[#0B6B4F] text-white shadow-2xs'
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQuantity(selectedItem.currentStock)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition"
                    >
                      Max ({selectedItem.currentStock})
                    </button>
                  </div>
                </div>

                {/* Stock Live Preview */}
                <div className="mt-2 text-xs text-[#6B7280] flex items-center gap-2">
                  <span>Remaining after issue:</span>
                  <span className={`font-bold ${selectedItem.currentStock - quantity <= selectedItem.minStock ? 'text-[#B54708]' : 'text-[#0B6B4F]'}`}>
                    {selectedItem.currentStock - quantity} {selectedItem.unit}
                  </span>
                </div>
              </div>

              {/* Department & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Issuing Department *
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="General School / Administration">General School / Administration</option>
                    <option value="Elementary (PYP)">Elementary (PYP)</option>
                    <option value="Secondary (MYP/DP)">Secondary (MYP/DP)</option>
                    <option value="Facilities & Maintenance">Facilities & Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Purpose / Reason *
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

              {/* Requester & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Requester Name
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    placeholder="e.g. Teacher John, IT Staff..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Additional Reference / Note
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Grade 5 Science Fair..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || quantity <= 0 || quantity > selectedItem.currentStock}
                  className="w-full sm:w-auto min-w-[200px] bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Deduction...' : `Confirm Deduct (${quantity} ${selectedItem.unit})`}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Col: Recent Stock Deductions Log */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0B6B4F]" />
                <span>Recent Outgoing Logs</span>
              </span>
              <Link href="/history?type=OUT" className="text-[11px] text-[#0B6B4F] hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentOutLogs.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  No recent stock issues recorded yet.
                </p>
              ) : (
                recentOutLogs.slice(0, 6).map(log => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#111827] block truncate">
                        {log.itemName}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-0.5">
                        <span>{log.department || 'General'}</span>
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="font-bold text-[#B42318] shrink-0 font-mono bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                      -{log.quantity}
                    </span>
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
