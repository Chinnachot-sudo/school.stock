'use client';

import { Invoice, INVOICE_STATUS_LABELS, CUSTOMER_TYPE_LABELS, SCHOOL_BANK_INFO } from '@/types/inventory';
import { thaiBahtText } from '@/lib/thai-baht';
import { X, Printer, Copy, School, AlertCircle, Calendar, CreditCard, Scissors, CheckCircle2, FileText } from 'lucide-react';
import { useState } from 'react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (updatedInvoice: Invoice) => void;
}

export default function InvoiceModal({ invoice, isOpen, onClose, onStatusChange }: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/finance?invoice=${invoice.invoiceNumber}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const thaiCreatedDate = new Date(invoice.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const thaiDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '-';

  const statusInfo = INVOICE_STATUS_LABELS[invoice.status] || INVOICE_STATUS_LABELS.PENDING;

  const handleMarkAsPaid = async () => {
    if (!confirm(`ยืนยันบันทึกการชำระเงินสำหรับใบแจ้ง #${invoice.invoiceNumber} ยอด ฿${invoice.totalAmount.toLocaleString()} บาท?`)) {
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAt: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update invoice');
      if (onStatusChange) onStatusChange({ ...invoice, status: 'PAID', paidAt: new Date().toISOString() });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      
      {/* Print Specific CSS to enforce Half-A4 sizing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-container,
          .invoice-print-container * {
            visibility: visible;
          }
          .invoice-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 210mm;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Top Control Bar (Screen Only) */}
        <div className="no-print p-3 sm:p-4 bg-[#1F4D3A] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                <span>ใบแจ้งการชำระเงิน (Half-A4 Invoice)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </h2>
              <p className="text-[10px] text-white/70 font-mono">
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status === 'PENDING' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>บันทึกชำระแล้ว</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-medium transition"
              title="คัดลอกลิงก์"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว!' : 'แชร์ลิงก์'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ครึ่ง A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="overflow-y-auto p-3 sm:p-5 bg-slate-100 flex-1">
          
          {/* Printable Container: Half A4 Page */}
          <div className="invoice-print-container bg-white border border-slate-300 shadow-md rounded-2xl p-4 sm:p-6 text-slate-800 text-[11px] leading-relaxed relative flex flex-col justify-between min-h-[460px]">
            
            {/* Watermark for Cancelled */}
            {invoice.status === 'CANCELLED' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-red-500/20 text-6xl font-black border-8 border-red-500/20 px-8 py-4 rounded-3xl -rotate-12 select-none">
                  ยกเลิก / CANCELLED
                </div>
              </div>
            )}

            <div>
              {/* Header: School Branding & Doc Title */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                      Roong Aroon International School
                    </h1>
                    <p className="text-[11px] font-bold text-blue-700">
                      โรงเรียนนานาชาติรุ่งอรุณ
                    </p>
                    <p className="text-[9px] text-slate-400">
                      แผนกการเงินและสวัสดิการพัสดุการศึกษา • Finance & Educational Store
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase mb-1">
                    ใบแจ้งการชำระเงิน
                  </span>
                  <h2 className="font-bold text-xs text-slate-800 tracking-tight">
                    INVOICE / BILLING SLIP
                  </h2>
                  <p className="font-mono font-bold text-blue-700 text-xs mt-0.5">
                    #{invoice.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl mb-3 border border-slate-200/80 text-[10px]">
                {/* Bill To */}
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">
                    ข้อมูลผู้รับใบแจ้ง / นักเรียน (Bill To)
                  </p>
                  <p>
                    <span className="text-slate-500">ชื่อ-สกุล: </span>
                    <strong className="text-slate-900 text-xs font-extrabold">{invoice.customerName}</strong>
                  </p>
                  {invoice.studentClass && (
                    <p>
                      <span className="text-slate-500">ระดับชั้น IB: </span>
                      <strong className="text-slate-800">{invoice.studentClass}</strong>
                      {invoice.studentId && <span className="text-slate-500"> (รหัส: {invoice.studentId})</span>}
                    </p>
                  )}
                  {invoice.parentName && (
                    <p>
                      <span className="text-slate-500">ผู้ปกครอง: </span>
                      <span className="text-slate-700">{invoice.parentName}</span>
                    </p>
                  )}
                  {invoice.phone && (
                    <p>
                      <span className="text-slate-500">โทรศัพท์: </span>
                      <span className="text-slate-700 font-mono">{invoice.phone}</span>
                    </p>
                  )}
                </div>

                {/* Dates & Status */}
                <div className="text-right space-y-0.5">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">
                    กำหนดและสถานะ (Details)
                  </p>
                  <p>
                    <span className="text-slate-500">วันที่ออกเอกสาร: </span>
                    <span className="text-slate-800">{thaiCreatedDate}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">กำหนดชำระภายใน: </span>
                    <strong className="text-red-700 font-bold">{thaiDueDate}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">สถานะ: </span>
                    <strong className={`font-bold ${invoice.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {statusInfo.label}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">ผู้ออกใบแจ้ง: </span>
                    <span className="text-slate-700">{invoice.creatorName}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2.5 text-center w-8">#</th>
                      <th className="py-1.5 px-2 text-left">รายการพัสดุ / บริการ (Description)</th>
                      <th className="py-1.5 px-2 text-center w-14">จำนวน</th>
                      <th className="py-1.5 px-2 text-right w-16">ราคา/หน่วย</th>
                      <th className="py-1.5 px-2.5 text-right w-20">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <span className="font-semibold text-slate-900">{item.itemName}</span>
                          {item.itemCode && (
                            <span className="text-[9px] text-slate-400 font-mono ml-1.5">[{item.itemCode}]</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-700">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right text-slate-700">
                          ฿{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                          ฿{item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation & Thai Baht Text */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] mb-3">
                <div>
                  <span className="text-slate-500 font-medium">จำนวนเงินตัวอักษร: </span>
                  <strong className="text-blue-900 font-bold text-[11px]">
                    ({thaiBahtText(invoice.totalAmount)})
                  </strong>
                  {invoice.note && (
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      หมายเหตุ: {invoice.note}
                    </p>
                  )}
                </div>

                <div className="text-right space-y-0.5 min-w-[170px] shrink-0">
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ส่วนลด:</span>
                      <span className="text-red-600 font-bold">-฿{invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-0.5">
                    <span>ยอดรวมสุทธิ:</span>
                    <span className="text-sm text-blue-700">฿{invoice.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT SECTION WITH OFFICIAL SCHOOL BANGKOK BANK QR */}
              <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3.5">
                {/* Official QR Image */}
                <div className="shrink-0 bg-white p-1.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center">
                  <img
                    src={SCHOOL_BANK_INFO.qrImagePath}
                    alt="PromptPay QR Code ทางการ"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-lg"
                  />
                  <span className="text-[8px] font-bold text-blue-800 mt-1 uppercase tracking-tight">
                    Thai QR Payment
                  </span>
                </div>

                {/* Bank Account Details */}
                <div className="flex-1 text-[10px] space-y-1 w-full text-left">
                  <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                    <span>ช่องทางชำระเงิน / Payment Instructions</span>
                  </div>

                  <p className="text-slate-600">
                    กรุณาสแกนจ่ายด้วยแอปพลิเคชันธนาคารผ่าน <strong>PromptPay QR Code</strong>
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 bg-white/90 p-2 rounded-lg border border-blue-100 text-[9px] font-mono">
                    <div>
                      <span className="text-slate-400 block">ธนาคาร:</span>
                      <strong className="text-slate-800">{SCHOOL_BANK_INFO.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ชื่อบัญชี:</span>
                      <strong className="text-slate-800">{SCHOOL_BANK_INFO.accountName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ref.1 (MID):</span>
                      <strong className="text-blue-800 text-[10px]">{SCHOOL_BANK_INFO.ref1}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ref.3 (TID):</span>
                      <strong className="text-blue-800 text-[10px]">{SCHOOL_BANK_INFO.ref3}</strong>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-tight">
                    * เมื่อชำระเงินเรียบร้อย กรุณาส่งสลิปหลักฐานแจ้งเจ้าหน้าที่การเงินโรงเรียนเพื่อรับใบเสร็จฉบับจริง
                  </p>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-4 text-center text-[9px] text-slate-500 pt-5 mt-3 border-t border-slate-200">
                <div>
                  <div className="border-b border-slate-300 w-36 mx-auto mb-1"></div>
                  <p>ผู้รับใบแจ้ง / นักเรียน / ผู้ปกครอง</p>
                  <p className="text-[8px] text-slate-400">วันที่ ......./......./............</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 w-36 mx-auto mb-1"></div>
                  <p>เจ้าหน้าที่ผู้มีอำนาจออกเอกสาร</p>
                  <p className="text-[8px] text-slate-400">โรงเรียนนานาชาติรุ่งอรุณ</p>
                </div>
              </div>

            </div>

            {/* Scissors Cut Guideline for Half-A4 */}
            <div className="no-print mt-4 pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>เส้นปรุสำหรับตัดขนาดครึ่งกระดาษ A4 (A4 Half Sheet Cut Line)</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
