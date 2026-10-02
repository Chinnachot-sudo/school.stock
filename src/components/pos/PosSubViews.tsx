'use client';

import React, { useState } from 'react';
import {
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Printer,
  CalendarDays,
  Store,
  DollarSign,
  TrendingUp,
  Receipt as ReceiptIcon,
  User,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Check
} from 'lucide-react';
import { Receipt, ReturnReason, RETURN_REASON_LABELS } from '@/types/inventory';

// ============================================================================
// 1. SHIFT MANAGEMENT VIEW
// ============================================================================
export interface ShiftViewProps {
  receipts: Receipt[];
  cashierName: string;
  onPrintZReport?: () => void;
}

export function ShiftView({ receipts, cashierName, onPrintZReport }: ShiftViewProps) {
  const [openingFloat, setOpeningFloat] = useState(2000);
  const [actualCash, setActualCash] = useState<number>(2000);
  const [closingNote, setClosingNote] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [cashActionModal, setCashActionModal] = useState<'IN' | 'OUT' | null>(null);
  const [cashActionAmount, setCashActionAmount] = useState<number>(0);
  const [cashActionNote, setCashActionNote] = useState('');

  // Calculations
  const validReceipts = receipts.filter(r => r.status !== 'VOIDED');
  const cashSales = validReceipts
    .filter(r => r.paymentMethod === 'CASH')
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const promptPaySales = validReceipts
    .filter(r => r.paymentMethod === 'PROMPTPAY')
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const otherSales = validReceipts
    .filter(r => r.paymentMethod === 'CARD' || r.paymentMethod === 'TRANSFER' || r.paymentMethod === 'WELFARE')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalSales = cashSales + promptPaySales + otherSales;
  const expectedCashInDrawer = openingFloat + cashSales;
  const variance = actualCash - expectedCashInDrawer;

  const pastShifts = [
    {
      id: 'SH-20260923-02',
      date: '23 Sep 2026 (Evening)',
      cashier: 'Ms. Supaporn',
      float: 2000,
      cashSales: 8420,
      qrSales: 11250,
      total: 19670,
      variance: 0,
      status: 'CLOSED_BALANCED'
    },
    {
      id: 'SH-20260923-01',
      date: '23 Sep 2026 (Morning)',
      cashier: 'Mr. Anan',
      float: 2000,
      cashSales: 14100,
      qrSales: 8900,
      total: 23000,
      variance: -20,
      status: 'CLOSED_DISCREPANCY'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Shift Active Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${isClosed ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-[#0B6B4F]'}`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Shift #SH-20260924-01
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                isClosed
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-emerald-50 text-[#0B6B4F] border-emerald-300 animate-pulse'
              }`}>
                {isClosed ? 'Shift Closed' : 'Active / Open'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cashier: <strong className="text-slate-800">{cashierName}</strong> &bull; Terminal: Register 01 (Store Front) &bull; Opened: Today, 07:30 AM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCashActionModal('IN')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
          >
            + Cash In
          </button>
          <button
            onClick={() => setCashActionModal('OUT')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
          >
            - Cash Out
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to close this shift and print the Z-Report?')) {
                setIsClosed(true);
                alert('Shift closed successfully. Printing Z-Report to POS thermal printer.');
              }
            }}
            disabled={isClosed}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              isClosed
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#0B6B4F] hover:bg-emerald-800 text-white shadow-md shadow-emerald-950/20 active:scale-95'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Close Shift & Print Z-Report</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Opening Float</span>
            <Banknote className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ฿{openingFloat.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Verified at shift opening</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cash Sales</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ฿{cashSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Added into cash drawer</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>PromptPay / Electronic</span>
            <QrCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">
            ฿{promptPaySales.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-500 font-medium">Direct school bank credit</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Shift Sales</span>
            <TrendingUp className="w-4 h-4 text-[#0B6B4F]" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ฿{totalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{validReceipts.length} transactions processed</div>
        </div>
      </div>

      {/* Drawer Reconciliation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#0B6B4F]" />
            Cash Drawer Count & Verification
          </h3>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Opening Float:</span>
              <span className="font-bold text-slate-900">฿{openingFloat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Cash Received:</span>
              <span className="font-bold text-slate-900">+ ฿{cashSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-extrabold pt-2 border-t border-slate-200">
              <span>Expected Cash in Drawer:</span>
              <span className="text-emerald-700 text-sm">฿{expectedCashInDrawer.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Actual Cash Counted:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">฿</span>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-black text-base focus:bg-white focus:outline-none focus:border-[#0B6B4F]"
                />
              </div>
            </div>

            {/* Discrepancy Alert */}
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              variance === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : variance > 0
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {variance === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="font-bold">
                  {variance === 0 ? 'Cash Balanced' : variance > 0 ? 'Cash Over' : 'Cash Short'}
                </span>
              </div>
              <span className="font-black text-sm">
                {variance > 0 ? `+฿${variance.toLocaleString()}` : variance < 0 ? `-฿${Math.abs(variance).toLocaleString()}` : '฿0'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Closing Notes / Explanation:
              </label>
              <textarea
                rows={2}
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                placeholder="Enter reason for variance or shift handover notes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0B6B4F]"
              />
            </div>
          </div>
        </div>

        {/* Previous Shift History */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0B6B4F]" />
            Previous Shifts Audit
          </h3>

          <div className="divide-y divide-slate-100">
            {pastShifts.map(s => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span>{s.id}</span>
                    <span className="text-slate-400 font-normal">&bull; {s.date}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Cashier: {s.cashier} &bull; Total Sales: ฿{s.total.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900">
                    ฿{s.total.toLocaleString()}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.variance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {s.variance === 0 ? 'Balanced' : `Diff: ฿${s.variance}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. TODAY'S SALES VIEW
// ============================================================================
export interface TodaySalesViewProps {
  receipts: Receipt[];
  onViewReceipt: (receipt: Receipt) => void;
  onDuplicateBill: (receipt: Receipt) => void;
}

export function TodaySalesView({ receipts, onViewReceipt, onDuplicateBill }: TodaySalesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const validReceipts = receipts.filter(r => r.status !== 'VOIDED');
  const totalSales = validReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItemsSold = validReceipts.reduce((sum, r) => sum + r.items.reduce((acc, i) => acc + i.quantity, 0), 0);
  const averageTicket = validReceipts.length > 0 ? Math.round(totalSales / validReceipts.length) : 0;

  const cashAmount = validReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.totalAmount, 0);
  const promptPayAmount = validReceipts.filter(r => r.paymentMethod === 'PROMPTPAY').reduce((sum, r) => sum + r.totalAmount, 0);
  const otherAmount = validReceipts.filter(r => r.paymentMethod !== 'CASH' && r.paymentMethod !== 'PROMPTPAY').reduce((sum, r) => sum + r.totalAmount, 0);

  const filteredReceipts = receipts.filter(r => {
    const matchSearch =
      r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPayment = paymentFilter === 'ALL' || r.paymentMethod === paymentFilter;
    return matchSearch && matchPayment;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold">Total Sales Today</span>
          <div className="text-2xl font-black text-slate-900">฿{totalSales.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Real-time Turnover
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold">Completed Receipts</span>
          <div className="text-2xl font-black text-slate-900">{validReceipts.length}</div>
          <span className="text-[11px] text-slate-500 font-medium">From {receipts.length} total attempts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold">Items Sold</span>
          <div className="text-2xl font-black text-slate-900">{totalItemsSold.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 font-medium">Uniforms, books, stationery</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-bold">Average Ticket</span>
          <div className="text-2xl font-black text-[#0B6B4F]">฿{averageTicket.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 font-medium">Per completed purchase</span>
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Payment Method Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Banknote className="w-5 h-5 text-emerald-700" />
              <div>
                <div className="text-xs font-bold text-slate-800">Cash</div>
                <div className="text-sm font-black text-emerald-800">฿{cashAmount.toLocaleString()}</div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {totalSales > 0 ? `${Math.round((cashAmount / totalSales) * 100)}%` : '0%'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-blue-700" />
              <div>
                <div className="text-xs font-bold text-slate-800">PromptPay</div>
                <div className="text-sm font-black text-blue-800">฿{promptPayAmount.toLocaleString()}</div>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700">
              {totalSales > 0 ? `${Math.round((promptPayAmount / totalSales) * 100)}%` : '0%'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-amber-700" />
              <div>
                <div className="text-xs font-bold text-slate-800">Card / Transfer</div>
                <div className="text-sm font-black text-amber-800">฿{otherAmount.toLocaleString()}</div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700">
              {totalSales > 0 ? `${Math.round((otherAmount / totalSales) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Receipts Table for Today */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Transactions Ledger</h3>
            <p className="text-xs text-slate-500">Every receipt issued during today's school operations</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt # or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0B6B4F]"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value="ALL">All Payments</option>
              <option value="CASH">Cash Only</option>
              <option value="PROMPTPAY">PromptPay Only</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Receipt #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items Count</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Total (฿)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReceipts.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{r.customerName}</td>
                  <td className="py-3 px-3">{r.items.reduce((acc, i) => acc + i.quantity, 0)} pcs</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    ฿{r.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'VOIDED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {r.status === 'VOIDED' ? 'Voided' : 'Completed'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewReceipt(r)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onDuplicateBill(r)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4F] text-[10px] font-bold"
                      >
                        Re-Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No transactions matching filter today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. RETURN & EXCHANGE VIEW
// ============================================================================
export interface ReturnExchangeViewProps {
  receipts: Receipt[];
  onConfirmReturn: (receiptId: string, items: any[], reason: ReturnReason, detail: string) => Promise<void>;
}

export function ReturnExchangeView({ receipts, onConfirmReturn }: ReturnExchangeViewProps) {
  const [searchReceiptCode, setSearchReceiptCode] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>('WRONG_SIZE');
  const [reasonDetail, setReasonDetail] = useState('');
  const [restockToInventory, setRestockToInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    const initialQtys: Record<string, number> = {};
    receipt.items.forEach(i => {
      initialQtys[i.itemId] = 0;
    });
    setReturnQtys(initialQtys);
  };

  const handleQtyChange = (itemId: string, maxQty: number, delta: number) => {
    setReturnQtys(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItemsToReturn = selectedReceipt?.items.filter(i => (returnQtys[i.itemId] || 0) > 0) || [];
  const totalRefundAmount = selectedItemsToReturn.reduce(
    (sum, i) => sum + i.unitPrice * (returnQtys[i.itemId] || 0),
    0
  );

  const submitReturn = async () => {
    if (!selectedReceipt) return;
    if (selectedItemsToReturn.length === 0) {
      alert('Please specify at least 1 item and quantity to return.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = selectedItemsToReturn.map(i => ({
        itemId: i.itemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        quantity: returnQtys[i.itemId],
        unitPrice: i.unitPrice,
        refundAmount: i.unitPrice * returnQtys[i.itemId]
      }));

      await onConfirmReturn(selectedReceipt.id, itemsPayload, reason, reasonDetail);
      setSelectedReceipt(null);
      setReturnQtys({});
      setReasonDetail('');
    } catch (err: any) {
      alert(err.message || 'Error processing return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Return Policy Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-[#0B6B4F] flex items-center justify-center font-bold shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm block">School Store Return & Exchange Protocol</span>
            <span className="text-emerald-700">
              Students and parents can exchange uniforms within 14 days with original tags. Inventory is automatically synchronized upon return confirmation.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Find Receipt & Line Items */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#0B6B4F]" />
            Find Original Receipt
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Receipt # (e.g. REC-20260924-XXXX) or student name..."
              value={searchReceiptCode}
              onChange={e => setSearchReceiptCode(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0B6B4F]"
            />
          </div>

          {/* Quick Receipt Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Recent Receipts:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {receipts
                .filter(r => r.status !== 'VOIDED')
                .filter(r => !searchReceiptCode || r.receiptNumber.includes(searchReceiptCode) || r.customerName.includes(searchReceiptCode))
                .slice(0, 6)
                .map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectReceipt(r)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedReceipt?.id === r.id
                        ? 'border-[#0B6B4F] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-800">
                      <span>{r.receiptNumber}</span>
                      <span className="text-[#0B6B4F] font-bold">฿{r.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-1">
                      {r.customerName} &bull; {new Date(r.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Line Items of Selected Receipt */}
          {selectedReceipt && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Select Items to Return / Exchange:</span>
                <span className="text-[11px] text-slate-500">{selectedReceipt.items.length} items on bill</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedReceipt.items.map(item => {
                  const returnQty = returnQtys[item.itemId] || 0;
                  return (
                    <div key={item.itemId} className="p-3 bg-white flex items-center justify-between text-xs gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.itemCode} &bull; Purchased: {item.quantity} {item.unit || 'pcs'} @ ฿{item.unitPrice.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.itemId, item.quantity, -1)}
                          disabled={returnQty === 0}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-black flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900 text-sm">
                          {returnQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.itemId, item.quantity, 1)}
                          disabled={returnQty >= item.quantity}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-black flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Return Confirmation & Refund Calculation */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#0B6B4F]" />
            Return Reason & Refund
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Return / Exchange:
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as ReturnReason)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B6B4F]"
              >
                {Object.entries(RETURN_REASON_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Notes / Condition of Item:
              </label>
              <textarea
                rows={2}
                value={reasonDetail}
                onChange={e => setReasonDetail(e.target.value)}
                placeholder="e.g. Exchange uniform size S to M..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0B6B4F]"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-bold p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={restockToInventory}
                onChange={e => setRestockToInventory(e.target.checked)}
                className="w-4 h-4 rounded text-[#0B6B4F] focus:ring-emerald-500"
              />
              <span>Restock item back to warehouse</span>
            </label>

            {/* Refund Calculation Box */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Items Selected for Return:</span>
                <span>{selectedItemsToReturn.length} kinds</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Original Payment Method:</span>
                <span>{selectedReceipt?.paymentMethod || '-'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-sm">Total Refund Amount:</span>
                <span className="text-xl font-black text-emerald-400">฿{totalRefundAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={submitReturn}
              disabled={isSubmitting || selectedItemsToReturn.length === 0}
              className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition ${
                selectedItemsToReturn.length === 0 || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#0B6B4F] hover:bg-emerald-800 text-white shadow-lg shadow-emerald-950/20 active:scale-98'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : 'Confirm Return & Refund'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
