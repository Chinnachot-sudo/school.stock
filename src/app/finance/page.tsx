'use client';

import { useState, useEffect, useMemo } from 'react';
import { Receipt, PAYMENT_METHOD_LABELS, CUSTOMER_TYPE_LABELS } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import ReceiptModal from '@/components/ReceiptModal';
import {
  DollarSign,
  TrendingUp,
  Banknote,
  QrCode,
  FileSpreadsheet,
  Search,
  Printer,
  Ban,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  Receipt as ReceiptIcon
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function FinancePage() {
  const { isSuperAdmin, isInventoryManager } = useAuth();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected receipt for viewing/re-printing
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipts');
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchSearch =
        r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.studentClass && r.studentClass.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.studentId && r.studentId.includes(searchQuery));

      const matchPayment = paymentFilter === 'ALL' || r.paymentMethod === paymentFilter;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchSearch && matchPayment && matchStatus;
    });
  }, [receipts, searchQuery, paymentFilter, statusFilter]);

  // Totals calculations
  const activeReceipts = useMemo(() => {
    return filteredReceipts.filter(r => r.status === 'COMPLETED');
  }, [filteredReceipts]);

  const totalSales = useMemo(() => {
    return activeReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [activeReceipts]);

  const totalCash = useMemo(() => {
    return activeReceipts.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + r.totalAmount, 0);
  }, [activeReceipts]);

  const totalPromptPay = useMemo(() => {
    return activeReceipts.filter(r => r.paymentMethod === 'PROMPTPAY').reduce((sum, r) => sum + r.totalAmount, 0);
  }, [activeReceipts]);

  // Void receipt handler
  const handleVoidReceipt = async (receipt: Receipt) => {
    if (receipt.status === 'VOIDED') return;

    const reason = prompt(`กรุณาระบุเหตุผลการยกเลิกใบเสร็จ #${receipt.receiptNumber}:\n(ระบบจะคืนยอดสต็อกสินค้าทั้งหมดกลับเข้าคลังอัตโนมัติ)`);
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถยกเลิกใบเสร็จได้');

      // Update state
      setReceipts(prev =>
        prev.map(r => (r.id === receipt.id ? { ...r, status: 'VOIDED', voidReason: reason.trim() } : r))
      );
      showToast(`🚫 ยกเลิกใบเสร็จ #${receipt.receiptNumber} และคืนสต็อกเรียบร้อย`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredReceipts.length === 0) return;

    const rows = filteredReceipts.map((r, idx) => {
      const itemsList = r.items.map(i => `${i.itemName} x${i.quantity}`).join(', ');
      return {
        ลำดับ: idx + 1,
        เลขที่ใบเสร็จ: r.receiptNumber,
        วันที่เวลา: new Date(r.createdAt).toLocaleString('th-TH'),
        ชื่อผู้ซื้อ: r.customerName,
        ประเภทผู้ซื้อ: CUSTOMER_TYPE_LABELS[r.customerType] || r.customerType,
        ชั้นเรียน: r.studentClass || '-',
        รายการสินค้า: itemsList,
        ยอดรวมก่อนหักส่วนลด: r.subtotal,
        ส่วนลด: r.discount,
        ยอดเงินสุทธิ: r.totalAmount,
        ช่องทางชำระเงิน: PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod,
        รับเงินสด: r.cashReceived || r.totalAmount,
        เงินทอน: r.change || 0,
        ผู้รับเงิน: r.cashierName,
        สถานะ: r.status === 'COMPLETED' ? 'ปกติ' : `ยกเลิก (${r.voidReason || '-'})`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานรายรับสหกรณ์');

    const fileName = `รายงานรายรับ_การเงินสหกรณ์โรงเรียน_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            รายงานการเงินและประวัติใบเสร็จรับเงิน
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปยอดขายรายวัน แยกเงินสด/เงินโอน ตรวจสอบปิดกะ และพิมพ์ใบเสร็จย้อนหลัง
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
          >
            <Store className="w-4 h-4" />
            <span>เปิดหน้าขายของ (POS)</span>
          </Link>

          <button
            onClick={handleExportExcel}
            disabled={filteredReceipts.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ยอดขายรวมสุทธิ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            ฿{totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            จาก {activeReceipts.length} ใบเสร็จปกติ
          </span>
        </div>

        {/* Total Cash */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">เงินสดในเก๊ะ (Cash)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ฿{totalCash.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            สำหรับนับเงินปิดกะรายวัน
          </span>
        </div>

        {/* Total PromptPay */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700">เงินโอน PromptPay</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            ฿{totalPromptPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            ยอดเงินเข้าบัญชีโรงเรียน
          </span>
        </div>

        {/* Receipts Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">จำนวนใบเสร็จ</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <ReceiptIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {receipts.length} <span className="text-xs font-medium text-slate-400">ใบ</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            ยกเลิกแล้ว {receipts.filter(r => r.status === 'VOIDED').length} ใบ
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ใบเสร็จ, ชื่อผู้ซื้อ, ชั้น..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
            >
              <option value="ALL">ทุกช่องทางชำระเงิน</option>
              <option value="CASH">💵 เงินสด (Cash)</option>
              <option value="PROMPTPAY">📱 PromptPay QR</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
            >
              <option value="ALL">ทุกสถานะใบเสร็จ</option>
              <option value="COMPLETED">✅ ปกติ (Completed)</option>
              <option value="VOIDED">🚫 ยกเลิกแล้ว (Voided)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-semibold">กำลังโหลดข้อมูลการเงิน...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ReceiptIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">ไม่พบประวัติใบเสร็จรับเงิน</p>
            <p className="text-xs text-slate-400 mt-1">
              เปิดหน้าขายของเพื่อสร้างใบเสร็จแรกได้ทันที
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-3 px-3.5">เลขที่ใบเสร็จ</th>
                  <th className="py-3 px-3">วันเวลา</th>
                  <th className="py-3 px-3">ผู้ซื้อ / ชั้นเรียน</th>
                  <th className="py-3 px-3">รายการสินค้า</th>
                  <th className="py-3 px-3">ยอดชำระ</th>
                  <th className="py-3 px-3">วิธีชำระ</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map(receipt => {
                  const isVoid = receipt.status === 'VOIDED';
                  const dateStr = new Date(receipt.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) + ' น.';

                  return (
                    <tr
                      key={receipt.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isVoid ? 'bg-red-50/30 opacity-70' : ''
                      }`}
                    >
                      {/* Receipt Number */}
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-blue-700">
                          {receipt.receiptNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{receipt.customerName}</div>
                        {receipt.studentClass && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            ชั้น {receipt.studentClass}
                          </span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                        {receipt.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-black ${isVoid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          ฿{receipt.totalAmount.toFixed(2)}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                          {receipt.paymentMethod === 'CASH' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              💵 เงินสด
                            </span>
                          ) : (
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              📱 PromptPay
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isVoid ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                            ยกเลิกแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            สำเร็จ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReceipt(receipt)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition"
                            title="ดู / พิมพ์ใบเสร็จ A4 ตัดครึ่ง"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>พิมพ์</span>
                          </button>

                          {!isVoid && (isSuperAdmin || isInventoryManager) && (
                            <button
                              onClick={() => handleVoidReceipt(receipt)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="ยกเลิกใบเสร็จ (คืนสต็อกเข้าคลัง)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
      />

    </div>
  );
}
