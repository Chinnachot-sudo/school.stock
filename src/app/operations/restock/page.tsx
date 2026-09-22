'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Item, Transaction } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import ScannerModal from '@/components/ScannerModal';
import {
  Plus,
  Minus,
  Search,
  ScanLine,
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  History,
  Trash2,
  ShoppingCart,
  Boxes,
  Layers,
  ArrowUpRight,
  PackageCheck
} from 'lucide-react';
import Link from 'next/link';

interface ReceiveCartItem {
  item: Item;
  quantity: number;
  unitCost: number;
}

export default function StockRestockPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [recentInLogs, setRecentInLogs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Supplier & Batch Information
  const [supplier, setSupplier] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Search & Cart
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<ReceiveCartItem[]>([]);

  // Modals & Feedback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    itemCount: number;
    totalUnits: number;
    totalCost: number;
    supplier?: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?type=IN&limit=6')
      ]);

      const itemsData = await itemsRes.json();
      const txData = await txRes.json();

      setItems(itemsData.items || []);
      setRecentInLogs(txData.transactions || []);
    } catch (err) {
      console.error('Failed to load restock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill receiver name from user session
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setReceiverName(name);
    }
  }, [user]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Add item to receive cart
  const handleAddToCart = (item: Item) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(ci => ci.item.id === item.id);
      if (existingIndex !== -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        const defaultCost = item.cost !== undefined && item.cost > 0 ? item.cost : (item.price ?? 0);
        return [...prevCart, { item, quantity: 1, unitCost: defaultCost }];
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
            const validQty = Math.max(1, newQty);
            return { ...ci, quantity: validQty };
          }
          return ci;
        })
        .filter(ci => ci.quantity > 0);
    });
  };

  // Update unit cost in cart
  const handleUpdateUnitCost = (itemId: string, newCost: number) => {
    setCart(prevCart => {
      return prevCart.map(ci => {
        if (ci.item.id === itemId) {
          return { ...ci, unitCost: Math.max(0, newCost) };
        }
        return ci;
      });
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
      handleAddToCart(found);
      setSearchQuery('');
      setErrorMessage(null);
    } else {
      setSearchQuery(cleanCode);
      setErrorMessage(`No item found matching barcode/code "${cleanCode}".`);
    }
  };

  // Cart summary calculations
  const totalCartCost = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity * ci.unitCost, 0);
  }, [cart]);

  const totalCartUnits = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cart]);

  // Submit batch restock
  const handleSubmitBatchRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage('Please add at least one item to receive.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        type: 'IN',
        items: cart.map(ci => ({
          itemId: ci.item.id,
          quantity: ci.quantity,
          unitCost: ci.unitCost
        })),
        requesterName: receiverName.trim() || 'Warehouse Receiving Staff',
        issuedToName: receiverName.trim() || 'Warehouse Receiving Staff',
        department: 'Warehouse Inward Storage',
        note: [
          supplier.trim() ? `Supplier: ${supplier.trim()}` : '',
          poNumber.trim() ? `PO: ${poNumber.trim()}` : '',
          note.trim() ? `Note: ${note.trim()}` : ''
        ].filter(Boolean).join(' | ')
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process inward delivery');
      }

      setSuccessInfo({
        itemCount: cart.length,
        totalUnits: totalCartUnits,
        totalCost: totalCartCost,
        supplier: supplier.trim() || undefined
      });

      // Clear cart & fields
      setCart([]);
      setPoNumber('');
      setNote('');

      // Refresh items and logs
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while recording restock');
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
            <span className="text-[#0B6B4F] font-semibold">Receive Stock</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-[#0B6B4F]" />
            <span>Receive Stock & Inward Deliveries (รับสินค้าเข้าคลัง)</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Multi-item batch receiving, PO purchase tracking, and instant inventory replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/history?type=IN"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F9FAFB] transition shadow-2xs"
          >
            <History className="w-4 h-4" />
            <span>Inward Logs</span>
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
                Stock Replenishment Recorded Successfully!
              </span>
              <p className="text-xs text-[#111827] mt-0.5">
                Successfully received <strong className="font-semibold">{successInfo.itemCount} items</strong> ({successInfo.totalUnits} units) totaling <strong className="font-semibold text-[#0B6B4F]">฿{successInfo.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
                {successInfo.supplier ? ` from ${successInfo.supplier}` : ''}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessInfo(null)}
            className="text-xs text-[#6B7280] hover:text-[#111827] px-2 py-1 rounded-lg hover:bg-white/50 transition cursor-pointer"
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
            <span className="font-bold block">Attention</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Form & Cart (Left 2 Cols) + Inward Logs (Right Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* STEP 1: Supplier & Delivery Document Reference */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Supplier & Delivery Information</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  Supplier / Vendor Name
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="e.g. Double A Official, B2S, Siam IT..."
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  PO / Invoice Number
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-0881"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  Receiver Name (ผู้ตรวจรับ)
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  placeholder="e.g. Warehouse Staff, Artima..."
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Item Search & Picker */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Search Items to Restock</span>
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

            {/* Filtered Items List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B7280] bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
                  {searchQuery.trim() ? (
                    <span>No items matched your search &quot;{searchQuery}&quot;.</span>
                  ) : (
                    <span>พิมพ์ชื่อสินค้า, SKU หรือสแกนบาร์โค้ดเพื่อเริ่มทำรายการ</span>
                  )}
                </div>
              ) : (
                filteredItems.map(item => {
                  const inCartItem = cart.find(ci => ci.item.id === item.id);
                  const isLow = item.currentStock <= item.minStock;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        inCartItem
                          ? 'bg-[#E6F5EF]/40 border-[#0B6B4F]/40'
                          : 'bg-white border-[#E5E7EB] hover:border-[#0B6B4F] hover:shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#111827]">{item.code}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Low Stock ({item.currentStock} {item.unit})
                            </span>
                          )}
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
                          <span>Current Stock: <strong className="font-mono font-bold text-[#0B6B4F]">{item.currentStock} {item.unit}</strong></span>
                          <span>Cost: <strong className="font-mono text-[#111827]">฿{(item.cost || item.price || 0).toFixed(2)}</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {inCartItem ? (
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-[#0B6B4F]">
                            <span className="text-[11px] font-semibold text-[#0B6B4F]">
                              In Cart ({inCartItem.quantity})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="w-5 h-5 rounded bg-[#0B6B4F] text-white flex items-center justify-center text-xs font-bold"
                              title="Receive one more"
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

          {/* STEP 3: Receive Cart & Final Confirmation */}
          <form onSubmit={handleSubmitBatchRestock} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#0B6B4F]" />
                <span>Receive Cart (รายการรับเข้าคลัง • {cart.length} items)</span>
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
                <Boxes className="w-8 h-8 mx-auto text-[#6B7280]/40 mb-1" />
                <p className="font-medium text-[#111827]">Receive Cart is empty</p>
                <p className="text-[11px]">Search and add items above to record an incoming stock delivery.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(ci => {
                  const lineTotal = ci.quantity * ci.unitCost;
                  const newStock = ci.item.currentStock + ci.quantity;

                  return (
                    <div
                      key={ci.item.id}
                      className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#111827]">{ci.item.code}</span>
                          <span className="text-xs font-semibold text-[#111827] truncate">{ci.item.name}</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                          <span>Current Stock: {ci.item.currentStock} {ci.item.unit}</span>
                          <span>→</span>
                          <span>New Stock: <strong className="text-[#0B6B4F] font-bold">{newStock} {ci.item.unit}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 flex-wrap">
                        {/* Quantity Stepper */}
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
                            value={ci.quantity}
                            onChange={e => handleUpdateQuantity(ci.item.id, parseInt(e.target.value, 10) || 1)}
                            className="w-14 text-center font-bold font-mono text-xs text-[#111827] py-1 outline-none border-x border-[#E5E7EB]"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(ci.item.id, ci.quantity + 1)}
                            className="px-2.5 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition text-xs font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Unit Cost input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-[#6B7280]">฿</span>
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={ci.unitCost}
                            onChange={e => handleUpdateUnitCost(ci.item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 font-mono text-xs text-right bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 outline-none focus:border-[#0B6B4F]"
                            title="Purchase Unit Cost"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="w-24 text-right">
                          <span className="font-mono font-bold text-xs text-[#111827] block">
                            ฿{lineTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(ci.item.id)}
                          className="p-1.5 text-[#6B7280] hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Remove item"
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
                    Total Received ({totalCartUnits} units in {cart.length} items):
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
                Additional Notes / Reference (บันทึกเพิ่มเติม)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Delivered by Flash Express, Tracking #TH12345..."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] p-2.5 outline-none focus:border-[#0B6B4F]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full sm:w-auto min-w-[220px] bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Recording Inward Delivery...'
                    : `Confirm Receive Stock (${totalCartUnits} units)`}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Recent Inward Deliveries */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0B6B4F]" />
                <span>Recent Inward Deliveries</span>
              </span>
              <Link href="/history?type=IN" className="text-[11px] text-[#0B6B4F] hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentInLogs.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  No stock receipts recorded yet today.
                </p>
              ) : (
                recentInLogs.slice(0, 6).map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111827] truncate">
                        {log.itemName}
                      </span>
                      <span className="font-bold text-[#0B6B4F] shrink-0 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +{log.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-0.5">
                      <span className="truncate">{log.department || 'Warehouse Storage'}</span>
                      <span className="shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {log.requesterName && (
                      <div className="text-[10px] text-[#6B7280] truncate">
                        Receiver: {log.requesterName}
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
