'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Invoice,
  Customer,
  Item,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  CUSTOMER_TYPE_LABELS
} from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import ReceiptModal from '@/components/ReceiptModal';
import InvoiceModal from '@/components/InvoiceModal';
import CreateInvoiceModal from '@/components/CreateInvoiceModal';
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
  FileText,
  Plus,
  ArrowRight,
  Receipt as ReceiptIcon,
  CheckCircle,
  Clock,
  Scissors
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function FinancePage() {
  const { isSuperAdmin, isInventoryManager } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'RECEIPTS' | 'INVOICES'>('RECEIPTS');

  // Receipts State
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

  // Lookup data for creating invoice
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoadingReceipts(true);
      const res = await fetch('/api/receipts');
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [custRes, itemsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/items')
      ]);
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.customers || []);
      }
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }
    } catch (err) {
      console.warn('Error fetching lookup data:', err);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchInvoices();
    fetchLookupData();
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

  // Receipts Totals calculations
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

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.studentClass && inv.studentClass.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
        (inv.studentId && inv.studentId.includes(invoiceSearch)) ||
        (inv.parentName && inv.parentName.toLowerCase().includes(invoiceSearch.toLowerCase()));

      const matchStatus = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter]);

  // Invoices calculations
  const pendingInvoices = useMemo(() => {
    return invoices.filter(i => i.status === 'PENDING');
  }, [invoices]);

  const totalPendingInvoicesAmount = useMemo(() => {
    return pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  }, [pendingInvoices]);

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

      setReceipts(prev =>
        prev.map(r => (r.id === receipt.id ? { ...r, status: 'VOIDED', voidReason: reason.trim() } : r))
      );
      showToast(`🚫 ยกเลิกใบเสร็จ #${receipt.receiptNumber} และคืนสต็อกเรียบร้อย`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Cancel invoice handler
  const handleCancelInvoice = async (invoice: Invoice) => {
    if (invoice.status === 'CANCELLED') return;
    const reason = prompt(`กรุณาระบุเหตุผลการยกเลิกใบแจ้งชำระ #${invoice.invoiceNumber}:`);
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel invoice');

      setInvoices(prev =>
        prev.map(i => (i.id === invoice.id ? { ...i, status: 'CANCELLED', note: reason.trim() } : i))
      );
      showToast(`🚫 ยกเลิกใบแจ้งชำระ #${invoice.invoiceNumber} เรียบร้อย`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mark invoice as paid
  const handleMarkInvoicePaid = async (invoice: Invoice) => {
    if (!confirm(`ยืนยันบันทึกการรับชำระเงินสำหรับใบแจ้ง #${invoice.invoiceNumber} ยอด ฿${invoice.totalAmount.toLocaleString()} บาท?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAt: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');

      setInvoices(prev =>
        prev.map(i => (i.id === invoice.id ? { ...i, status: 'PAID', paidAt: new Date().toISOString() } : i))
      );
      showToast(`✅ บันทึกชำระเงินสำหรับ #${invoice.invoiceNumber} เรียบร้อย`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export Receipts to Excel
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

    const fileName = `รายงานรายรับ_การเงิน_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

      {/* Modern Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Finance & Invoicing ERP
            </span>
            <span className="text-[10px] text-slate-400">
              Roong Aroon International School
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span>ศูนย์บริหารการเงินและใบแจ้งชำระเงิน</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปยอดขายสหกรณ์ ปิดกะรายวัน และออกใบแจ้งชำระเงินครึ่ง A4 พร้อม QR Code ทางการ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>ออกใบแจ้งชำระใหม่</span>
          </button>

          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Store className="w-4 h-4 text-blue-600" />
            <span>เปิด POS</span>
          </Link>

          <button
            onClick={handleExportExcel}
            disabled={filteredReceipts.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition"
            title="ส่งออก Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Shopeers-inspired Metric Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ยอดขายรวมสุทธิ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2 tracking-tight">
            ฿{totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            จาก {activeReceipts.length} ใบเสร็จรับเงิน
          </span>
        </div>

        {/* Total Cash */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">เงินสดในเก๊ะ (Cash)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 tracking-tight">
            ฿{totalCash.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            สำหรับนับเงินปิดกะ
          </span>
        </div>

        {/* Total PromptPay */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700">เงินโอน PromptPay</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2 tracking-tight">
            ฿{totalPromptPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            ยอดเงินเข้าบัญชีโรงเรียน
          </span>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">รอชำระตามใบแจ้งหนี้</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 tracking-tight">
            ฿{totalPendingInvoicesAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            ค้างชำระ {pendingInvoices.length} ฉบับ
          </span>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === 'RECEIPTS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ReceiptIcon className="w-4 h-4 text-blue-600" />
          <span>ประวัติใบเสร็จรับเงิน (Receipts)</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">
            {receipts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === 'INVOICES'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>ใบแจ้งชำระเงินครึ่ง A4 (Invoices)</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RECEIPTS VIEW */}
      {activeTab === 'RECEIPTS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-200/70 flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่บิล, ชื่อผู้ซื้อ หรือชั้นเรียน..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">ช่องทาง: ทั้งหมด</option>
                <option value="CASH">💵 เงินสด</option>
                <option value="PROMPTPAY">📱 PromptPay</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">สถานะ: ทั้งหมด</option>
                <option value="COMPLETED">สำเร็จ</option>
                <option value="VOIDED">ยกเลิกแล้ว</option>
              </select>

              <button
                onClick={fetchReceipts}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReceipts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredReceipts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ReceiptIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">ไม่พบรายการใบเสร็จ</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเปิดบิลขายที่หน้า POS</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">เลขที่ใบเสร็จ</th>
                    <th className="py-3 px-3">วันที่-เวลา</th>
                    <th className="py-3 px-3">ผู้ซื้อ / นักเรียน</th>
                    <th className="py-3 px-3">รายการสินค้า</th>
                    <th className="py-3 px-3">ยอดเงินสุทธิ</th>
                    <th className="py-3 px-3">ช่องทาง</th>
                    <th className="py-3 px-3">สถานะ</th>
                    <th className="py-3 px-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.map(receipt => {
                    const isVoid = receipt.status === 'VOIDED';
                    const dateStr = new Date(receipt.createdAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr
                        key={receipt.id}
                        className={`hover:bg-slate-50/70 transition ${
                          isVoid ? 'bg-red-50/30 opacity-70' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-blue-700">
                            {receipt.receiptNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{receipt.customerName}</div>
                          {receipt.studentClass && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ชั้น {receipt.studentClass}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                          {receipt.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`font-black ${isVoid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            ฿{receipt.totalAmount.toFixed(2)}
                          </span>
                        </td>
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
      )}

      {/* TAB 2: INVOICES (ใบแจ้งชำระเงินครึ่ง A4) VIEW */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Invoices Search & Filter Bar */}
          <div className="p-4 border-b border-slate-200/70 flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่ใบแจ้ง, นักเรียน หรือชั้นเรียน..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={invoiceStatusFilter}
                onChange={e => setInvoiceStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">สถานะ: ทั้งหมด</option>
                <option value="PENDING">⏳ รอชำระเงิน</option>
                <option value="PAID">✅ ชำระแล้ว</option>
                <option value="CANCELLED">🚫 ยกเลิก</option>
              </select>

              <button
                onClick={fetchInvoices}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInvoices ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สร้างใบแจ้ง</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">ไม่พบรายการใบแจ้งการชำระเงิน</p>
              <p className="text-xs text-slate-400 mt-1">กดปุ่ม &quot;ออกใบแจ้งชำระใหม่&quot; เพื่อสร้างเอกสารขนาดครึ่ง A4</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">เลขที่ใบแจ้ง</th>
                    <th className="py-3 px-3">วันที่ออก / กำหนดชำระ</th>
                    <th className="py-3 px-3">ผู้รับชำระ / นักเรียน</th>
                    <th className="py-3 px-3">รายการ</th>
                    <th className="py-3 px-3">ยอดรวมสุทธิ</th>
                    <th className="py-3 px-3">สถานะ</th>
                    <th className="py-3 px-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(invoice => {
                    const statusConfig = INVOICE_STATUS_LABELS[invoice.status] || INVOICE_STATUS_LABELS.PENDING;
                    const createdDateStr = new Date(invoice.createdAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short'
                    });
                    const dueDateStr = invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short'
                        })
                      : '-';

                    return (
                      <tr key={invoice.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-blue-700">
                            {invoice.invoiceNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                          <div>ออก: {createdDateStr}</div>
                          <div className="text-red-600 font-medium mt-0.5">ครบ: {dueDateStr}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{invoice.customerName}</div>
                          {invoice.studentClass && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ชั้น {invoice.studentClass}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                          {invoice.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-black text-slate-900 text-sm">
                          ฿{invoice.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition"
                              title="ดู / พิมพ์ใบแจ้งหนี้ขนาดครึ่ง A4"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>พิมพ์ครึ่ง A4</span>
                            </button>

                            {invoice.status === 'PENDING' && (
                              <button
                                onClick={() => handleMarkInvoicePaid(invoice)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 transition"
                                title="บันทึกว่าชำระแล้ว"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>ชำระแล้ว</span>
                              </button>
                            )}

                            {invoice.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancelInvoice(invoice)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="ยกเลิกใบแจ้ง"
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
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Printable Half-A4 Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        onStatusChange={(updated) => {
          setInvoices(prev => prev.map(i => (i.id === updated.id ? updated : i)));
          setSelectedInvoice(updated);
        }}
      />

      {/* Create New Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        customers={customers}
        items={items}
        onInvoiceCreated={(newInv) => {
          setInvoices(prev => [newInv, ...prev]);
          setActiveTab('INVOICES');
          setSelectedInvoice(newInv);
          showToast(`📄 สร้างใบแจ้งชำระ #${newInv.invoiceNumber} เรียบร้อย`);
        }}
      />

    </div>
  );
}
