'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Transaction } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import ScannerModal from '@/components/ScannerModal';
import {
  Plus,
  Search,
  ScanLine,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  History,
  RotateCcw,
  Boxes,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function StockRestockPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [recentInLogs, setRecentInLogs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection & Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Modals & Feedback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    itemName: string;
    itemCode: string;
    receivedQty: number;
    newStock: number;
    unit: string;
    supplier?: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?type=IN&limit=10')
      ]);

      const itemsData = await itemsRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      setRecentInLogs(txData.transactions || []);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    setQuantity(10);
    setUnitCost(item.cost ? String(item.cost) : '');
    setLocation(item.location || '');
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
      setErrorMessage('Please select an item to restock.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Received quantity must be at least 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const receiverName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Warehouse Staff';
      const refNoteParts = [];
      if (supplier.trim()) refNoteParts.push(`Vendor: ${supplier.trim()}`);
      if (poNumber.trim()) refNoteParts.push(`PO/Ref: ${poNumber.trim()}`);
      if (note.trim()) refNoteParts.push(note.trim());

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          type: 'IN',
          quantity,
          department: 'Procurement & Warehouse',
          requesterName: receiverName,
          note: refNoteParts.join(' | ') || 'Stock Restock Receipt'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record stock in');
      }

      // Update unit cost or location if modified
      const costNum = parseFloat(unitCost);
      if ((!isNaN(costNum) && costNum !== selectedItem.cost) || (location && location !== selectedItem.location)) {
        await fetch(`/api/items/${selectedItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cost: !isNaN(costNum) ? costNum : selectedItem.cost,
            location: location.trim() || selectedItem.location
          })
        }).catch(() => {});
      }

      // Record success
      const newStock = selectedItem.currentStock + quantity;
      setSuccessInfo({
        itemName: selectedItem.name,
        itemCode: selectedItem.code,
        receivedQty: quantity,
        newStock,
        unit: selectedItem.unit,
        supplier: supplier.trim() || undefined
      });

      // Update local state
      setItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id ? { ...item, currentStock: newStock } : item
        )
      );

      // Refresh recent logs
      fetch('/api/transactions?type=IN&limit=10')
        .then(r => r.json())
        .then(d => setRecentInLogs(d.transactions || []))
        .catch(() => {});

      // Reset form
      setQuantity(10);
      setSupplier('');
      setPoNumber('');
      setNote('');
      setSelectedItem(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while recording restock');
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
            <span className="text-[#0B6B4F] font-semibold">Receive Stock</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
            <Plus className="w-6 h-6 text-[#0B6B4F]" />
            <span>Receive Stock (Stock In)</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Log incoming inventory from vendors, purchase orders, or school deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/history?type=IN"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F9FAFB] transition shadow-xs"
          >
            <History className="w-4 h-4" />
            <span>In Logs</span>
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {successInfo && (
        <div className="p-4 bg-[#E6F5EF] border border-[#0B6B4F]/30 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0B6B4F] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#0B6B4F] block">
                Stock Received Successfully!
              </span>
              <p className="text-xs text-[#111827] mt-0.5">
                Added <strong className="font-semibold">+{successInfo.receivedQty} {successInfo.unit}</strong> to{' '}
                <strong className="font-semibold">{successInfo.itemName}</strong> ({successInfo.itemCode})
                {successInfo.supplier ? ` from ${successInfo.supplier}` : ''}.
              </p>
              <span className="text-[11px] text-[#6B7280] block mt-1">
                New Total Stock Balance: <strong className="text-[#0B6B4F] font-semibold">{successInfo.newStock} {successInfo.unit}</strong>
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

      {/* Main Grid: Form (Left) & Recent In Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Step 1: Select Item */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Select Item to Restock</span>
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
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className="w-full text-left p-3 rounded-xl border border-[#E5E7EB] hover:border-[#0B6B4F] hover:shadow-xs transition bg-white flex items-center justify-between gap-3"
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
                                isLow ? 'text-[#B54708]' : 'text-[#0B6B4F]'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                            <span className="text-[10px] text-[#6B7280] block">
                              {isLow ? 'Needs Restock' : 'In Stock'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Selected Item Card */
              <div className="p-4 bg-[#F9FAFB] border border-[#0B6B4F]/30 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-white border border-[#E5E7EB] text-[#111827]">
                      {selectedItem.code}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Unit: {selectedItem.unit}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] mt-1 truncate">
                    {selectedItem.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                    {selectedItem.location && <span>Storage: {selectedItem.location}</span>}
                    <span>•</span>
                    <span>Safety Min: {selectedItem.minStock} {selectedItem.unit}</span>
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

          {/* Step 2: Restock Form */}
          {selectedItem && (
            <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Restock Receipt Details</span>
              </span>

              {/* Quantity Counter */}
              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1.5">
                  Received Quantity ({selectedItem.unit}) *
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
                      value={quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setQuantity(val);
                      }}
                      className="w-20 text-center font-bold text-sm text-[#111827] py-2 outline-none border-x border-[#E5E7EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="px-3 py-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Quantity Presets */}
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuantity(amt)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          quantity === amt
                            ? 'bg-[#0B6B4F] text-white shadow-2xs'
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Projection */}
                <div className="mt-2 text-xs text-[#6B7280] flex items-center gap-2">
                  <span>New stock level after receiving:</span>
                  <span className="font-bold text-[#0B6B4F]">
                    {selectedItem.currentStock + quantity} {selectedItem.unit} (+{quantity})
                  </span>
                </div>
              </div>

              {/* Vendor & PO Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Vendor / Supplier
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="e.g. Office Depot, Double A Distributor..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    PO / Invoice / Delivery Note #
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-2026-0881, INV-4491..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  />
                </div>
              </div>

              {/* Cost & Storage Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Purchase Unit Cost (THB ฿)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    placeholder="e.g. 120.00"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111827] block mb-1">
                    Storage Shelf / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Warehouse Shelf B3..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                  />
                </div>
              </div>

              {/* Additional Note */}
              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optional delivery details or remarks..."
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || quantity <= 0}
                  className="w-full sm:w-auto min-w-[220px] bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Restock...' : `Confirm Receive (+${quantity} ${selectedItem.unit})`}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Col: Recent Stock In Logs */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#0B6B4F]" />
                <span>Recent Inward Deliveries</span>
              </span>
              <Link href="/history?type=IN" className="text-[11px] text-[#0B6B4F] hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentInLogs.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  No recent deliveries logged yet.
                </p>
              ) : (
                recentInLogs.slice(0, 6).map(log => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#111827] block truncate">
                        {log.itemName}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-0.5 truncate">
                        <span>{log.note || 'Restock'}</span>
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="font-bold text-[#027A48] shrink-0 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      +{log.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
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
