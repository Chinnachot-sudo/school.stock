'use client';

import { Invoice, INVOICE_STATUS_LABELS, SCHOOL_BANK_INFO } from '@/types/inventory';
import { thaiBahtText } from '@/lib/thai-baht';
import { X, Printer, Copy, CheckCircle2, FileText, Download } from 'lucide-react';
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
    month: 'long',
    day: 'numeric'
  });

  const thaiDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
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

  // Ensure minimum rows so table looks proportional matching reference image
  const minDisplayRows = Math.max(invoice.items.length, 5);
  const emptyRowsCount = minDisplayRows - invoice.items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      
      {/* Print Specific CSS to enforce Full-A4 sizing and prevent tiny box distortion */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            font-size: 11pt !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            z-index: 9999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar (Screen Only) */}
        <div className="no-print p-3 sm:p-4 bg-[#0B6B4F] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                <span>ใบแจ้งหนี้ (A4 Invoice)</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </h2>
              <p className="text-[10px] text-white/80 font-mono">
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status === 'PENDING' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="bg-[#027A48] hover:bg-[#036039] disabled:opacity-50 text-white font-medium text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>บันทึกชำระแล้ว</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 font-medium transition"
              title="คัดลอกลิงก์"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว!' : 'แชร์'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-white hover:bg-white/90 text-[#0B6B4F] font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบแจ้งหนี้ (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex-1 flex justify-center">
          
          {/* Printable Invoice Container (Matching Reference Design) */}
          <div
            id="printable-invoice"
            className="bg-white border border-[#E5E7EB] shadow-md rounded-xl p-6 sm:p-10 text-[#111827] text-xs leading-relaxed w-full max-w-[210mm] relative flex flex-col justify-between"
          >
            
            {/* Watermark for Cancelled */}
            {invoice.status === 'CANCELLED' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-red-500/20 text-7xl font-black border-8 border-red-500/20 px-10 py-5 rounded-3xl -rotate-12 select-none">
                  ยกเลิก / CANCELLED
                </div>
              </div>
            )}

            <div>
              {/* 1. TOP HEADER: INVOICE & LOGO (สอดคล้องตามภาพตัวอย่าง) */}
              <div className="flex items-start justify-between pb-6 mb-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight font-sans">
                    INVOICE
                  </h1>
                  <h2 className="text-base sm:text-lg font-bold text-[#111827] mt-0.5">
                    ใบแจ้งหนี้
                  </h2>
                </div>

                {/* Romaneeya Green Leaf Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                    <img
                      src="/images/romaneeya_leaf_transparent.svg"
                      alt="Romaneeya Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-lg font-extrabold text-[#0B6B4F] tracking-tight block leading-tight">
                      Romaneeya
                    </span>
                    <span className="text-[10px] text-[#6B7280] block font-mono">
                      Roong Aroon International School
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. METADATA SECTION: CUSTOMER, DOCUMENT & ISSUER DETAILS (ตาราง 2 คอลัมน์ตามรูปตัวอย่าง) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pb-6 mb-6 text-xs">
                {/* Column 1: Customer Details */}
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-24 text-[#6B7280] shrink-0 font-medium">ชื่อลูกค้า</span>
                    <span className="font-bold text-[#111827] flex-1">{invoice.customerName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-[#6B7280] shrink-0 font-medium">ที่อยู่</span>
                    <span className="text-[#111827] flex-1">
                      {invoice.studentClass || 'โรงเรียนนานาชาติรุ่งอรุณ'} (ชั้นเรียน/แผนก)
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-[#6B7280] shrink-0 font-medium">เลขผู้เสียภาษี</span>
                    <span className="text-[#111827] flex-1 font-mono">{invoice.studentId || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-[#6B7280] shrink-0 font-medium">อีเมล</span>
                    <span className="text-[#111827] flex-1 truncate font-mono">
                      {(invoice as any).email || (invoice.studentId ? `${invoice.studentId}@roong-aroon.ac.th` : '-')}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-[#6B7280] shrink-0 font-medium">ผู้ติดต่อ</span>
                    <span className="text-[#111827] flex-1">{invoice.parentName || invoice.customerName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-[#6B7280] shrink-0 font-medium">เบอร์โทรศัพท์</span>
                    <span className="text-[#111827] flex-1 font-mono">{invoice.phone || '-'}</span>
                  </div>
                </div>

                {/* Column 2: Document Metadata & Dates */}
                <div className="space-y-1.5 md:text-right">
                  <div className="flex md:justify-end">
                    <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">เลขที่</span>
                    <span className="font-bold text-[#111827] font-mono">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex md:justify-end">
                    <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">วันที่</span>
                    <span className="text-[#111827]">{thaiCreatedDate}</span>
                  </div>
                  <div className="flex md:justify-end">
                    <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">ครบกำหนด</span>
                    <span className="font-bold text-[#B42318]">{thaiDueDate}</span>
                  </div>
                  <div className="flex md:justify-end">
                    <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">เครดิต</span>
                    <span className="text-[#111827]">7 วัน (ชำระตามกำหนด)</span>
                  </div>
                  <div className="flex md:justify-end">
                    <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">อ้างอิง</span>
                    <span className="text-[#111827]">ใบเบิกพัสดุและสวัสดิการการศึกษา</span>
                  </div>
                </div>

                {/* Issuer Info (Full Width / Split) */}
                <div className="md:col-span-2 pt-3 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] text-[#4B5563]">
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="w-24 text-[#6B7280] shrink-0 font-medium">ผู้ออก</span>
                      <span className="font-medium text-[#111827]">
                        โรงเรียนนานาชาติรุ่งอรุณ (Roong Aroon International School) • Romaneeya
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-[#6B7280] shrink-0 font-medium">ที่อยู่</span>
                      <span>392 ถนนริมคลองชักพระ แขวงคลองขวาง เขตภาษีเจริญ กรุงเทพฯ 10160</span>
                    </div>
                  </div>

                  <div className="space-y-1 md:text-right">
                    <div className="flex md:justify-end">
                      <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">เลขประจำตัวผู้เสียภาษี</span>
                      <span className="font-mono">0105541008918</span>
                    </div>
                    <div className="flex md:justify-end">
                      <span className="w-24 md:w-auto md:mr-3 text-[#6B7280] shrink-0 font-medium">เบอร์โทร / อีเมล</span>
                      <span>02-870-7512 / finance@roong-aroon.ac.th</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TABLE OF ITEMS (กรอบตารางเส้นบางแบบภาพตัวอย่าง) */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden mb-6">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#111827] font-semibold text-[11px] bg-[#F9FAFB]">
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-4 text-left">รายการสินค้า</th>
                      <th className="py-2.5 px-3 text-center w-20">จำนวน</th>
                      <th className="py-2.5 px-4 text-right w-28">ราคา/หน่วย</th>
                      <th className="py-2.5 px-4 text-right w-32">ราคารวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center text-[#6B7280] font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-medium text-[#111827]">{item.itemName}</span>
                          {item.itemCode && (
                            <span className="text-[10px] text-[#6B7280] font-mono ml-2">[{item.itemCode}]</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#111827] font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right text-[#111827] font-mono">
                          {item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#111827] font-mono">
                          {item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}

                    {/* Empty placeholder rows to maintain document height */}
                    {Array.from({ length: emptyRowsCount }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-8">
                        <td className="py-2 px-3 text-center text-[#9CA3AF] font-mono text-[10px]">
                          {invoice.items.length + i + 1}
                        </td>
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. SUBTOTALS & NOTES ROW */}
              <div className="border-t border-[#E5E7EB] pt-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Notes */}
                <div>
                  <span className="font-bold text-[#111827] block mb-1">หมายเหตุ</span>
                  <p className="text-[#6B7280] text-[11px] leading-relaxed">
                    {invoice.note || 'โปรดชำระภายในกำหนดเวลา และส่งหลักฐานการโอนเงินเพื่อออกใบเสร็จรับเงินฉบับจริง'}
                  </p>
                </div>

                {/* Subtotals */}
                <div className="space-y-1.5 md:text-right">
                  <div className="flex md:justify-end">
                    <span className="w-32 text-[#6B7280]">ราคารวม</span>
                    <span className="w-32 font-mono font-medium text-[#111827]">
                      {invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex md:justify-end">
                    <span className="w-32 text-[#6B7280]">ส่วนลด</span>
                    <span className="w-32 font-mono text-[#6B7280]">
                      {invoice.discount > 0 ? `-${invoice.discount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </span>
                  </div>
                  <div className="flex md:justify-end">
                    <span className="w-32 text-[#6B7280]">ภาษีมูลค่าเพิ่ม 7%</span>
                    <span className="w-32 font-mono text-[#6B7280]">
                      0.00 (ยกเว้น)
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. GRAND TOTAL BOX (สไตล์แถบไฮไลต์ตามตัวอย่าง) */}
              <div className="border border-[#E5E7EB] rounded-lg p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB]/50">
                <div>
                  <span className="font-bold text-sm text-[#111827] block">
                    จำนวนเงินรวมทั้งสิ้น
                  </span>
                  <span className="text-xs text-[#0B6B4F] font-semibold mt-0.5 block">
                    ({thaiBahtText(invoice.totalAmount)})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono tracking-tight block">
                    ฿{invoice.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 6. DUAL SIGNATURES (ช่องลงชื่อผู้รับใบแจ้งหนี้ และ ผู้อนุมัติ ตามตัวอย่าง) */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs text-[#6B7280] mb-8 pt-4">
                <div className="space-y-1.5">
                  <div className="border-b border-[#D1D5DB] w-48 sm:w-60 mx-auto h-12"></div>
                  <p className="font-medium text-[#111827]">ผู้รับใบแจ้งหนี้</p>
                  <p className="text-[11px] text-[#6B7280]">({invoice.customerName})</p>
                  <p className="text-[10px] text-[#9CA3AF]">วันที่ ..... / ..... / ..........</p>
                </div>

                <div className="space-y-1.5">
                  <div className="border-b border-[#D1D5DB] w-48 sm:w-60 mx-auto h-12"></div>
                  <p className="font-medium text-[#111827]">ผู้อนุมัติ</p>
                  <p className="text-[11px] text-[#6B7280]">({invoice.creatorName || 'เจ้าหน้าที่การเงินโรงเรียน'})</p>
                  <p className="text-[10px] text-[#9CA3AF]">วันที่ ..... / ..... / ..........</p>
                </div>
              </div>

              {/* 7. FOOTER: TERMS & PAYMENT METHODS (สอดคล้องตามตัวอย่าง) */}
              <div className="border-t border-[#E5E7EB] pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Terms */}
                <div>
                  <h4 className="font-bold text-[#111827] mb-1.5">เงื่อนไข</h4>
                  <ul className="text-[11px] text-[#6B7280] space-y-1 list-disc list-inside">
                    <li>เอกสารนี้เป็นใบแจ้งหนี้สำหรับชำระค่าสวัสดิการการศึกษาและพัสดุ</li>
                    <li>เมื่อชำระเงินเรียบร้อย กรุณาส่งสลิปหลักฐานเพื่อออกใบเสร็จรับเงินฉบับจริง</li>
                    <li>หากพ้นกำหนดชำระ กรุณาติดต่อฝ่ายการเงินโรงเรียนเพื่อปรับปรุงเอกสาร</li>
                  </ul>
                </div>

                {/* Payment Instructions + Mini PromptPay QR */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#111827] mb-1">ช่องทางการชำระเงิน</h4>
                    <div className="text-[11px] text-[#4B5563] space-y-0.5">
                      <p><span className="text-[#6B7280]">ชื่อบัญชี:</span> <strong className="text-[#111827]">{SCHOOL_BANK_INFO.accountName}</strong></p>
                      <p><span className="text-[#6B7280]">เลขที่บัญชี:</span> <strong className="font-mono text-[#0B6B4F]">002203089172</strong></p>
                      <p><span className="text-[#6B7280]">ธนาคาร:</span> {SCHOOL_BANK_INFO.bankName}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono mt-1">Ref 1: {SCHOOL_BANK_INFO.ref1} | Ref 3: {SCHOOL_BANK_INFO.ref3}</p>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="shrink-0 text-center bg-[#F9FAFB] p-1.5 rounded-lg border border-[#E5E7EB]">
                    <img
                      src={SCHOOL_BANK_INFO.qrImagePath}
                      alt="Thai QR Payment"
                      className="w-20 h-auto object-contain rounded"
                    />
                    <span className="text-[9px] text-[#0B6B4F] font-bold block mt-1">
                      Thai QR
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
