'use client';

import { Invoice, INVOICE_STATUS_LABELS, SCHOOL_BANK_INFO } from '@/types/inventory';
import { thaiBahtText } from '@/lib/thai-baht';
import { generateSchoolPromptPayPayload } from '@/lib/promptpay';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, CheckCircle2, FileText, Download, Loader2 } from 'lucide-react';
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-invoice');
    if (!element) return;

    try {
      setDownloadingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        const ratio = pdfHeight / imgHeight;
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = pdfHeight;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
      }

      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please use the Print button and choose Save as PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const enCreatedDate = new Date(invoice.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const enDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '-';

  const statusInfo = INVOICE_STATUS_LABELS[invoice.status] || INVOICE_STATUS_LABELS.PENDING;
  // Official Bangkok Bank Thai QR Payload matching physical bank payment stand exactly
  const promptPayPayload = generateSchoolPromptPayPayload();

  const handleMarkAsPaid = async () => {
    if (!confirm(`Confirm recording payment for Invoice #${invoice.invoiceNumber} in the amount of ฿${invoice.totalAmount.toLocaleString()}?`)) {
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

  // Keep display rows proportional so it fits comfortably on 1 sheet of A4
  const minDisplayRows = Math.max(invoice.items.length, 3);
  const emptyRowsCount = minDisplayRows - invoice.items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      
      {/* Print Specific CSS to enforce Full-A4 sizing and avoid clipping bank info */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar (Screen Only) */}
        <div className="no-print p-3 sm:p-4 bg-[#0B6B4F] text-white flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                <span>Invoice (A4)</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </h2>
              <p className="text-[10px] text-white/80 font-mono">
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {invoice.status === 'PENDING' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="bg-[#027A48] hover:bg-[#036039] disabled:opacity-50 text-white font-medium text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Paid</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 font-medium transition"
              title="Copy Link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-medium text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
              title="Download Invoice as PDF"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-white hover:bg-white/90 text-[#0B6B4F] font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice (A4)</span>
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
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100 flex-1 flex justify-center">
          
          {/* Printable Invoice Container (Matching Reference Design) */}
          <div
            id="printable-invoice"
            className="bg-white border border-[#E5E7EB] shadow-md rounded-xl p-5 sm:p-8 text-[#111827] text-xs leading-relaxed w-full max-w-[210mm] relative flex flex-col justify-between"
          >
            
            {/* Watermark for Cancelled */}
            {invoice.status === 'CANCELLED' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-red-500/20 text-7xl font-black border-8 border-red-500/20 px-10 py-5 rounded-3xl -rotate-12 select-none">
                  CANCELLED
                </div>
              </div>
            )}

            <div>
              {/* 1. TOP HEADER: INVOICE & SCHOOL CREST */}
              <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
                    INVOICE
                  </h1>
                  <h2 className="text-xs sm:text-sm font-semibold text-[#6B7280] mt-0.5">
                    Official Payment Notice
                  </h2>
                </div>

                {/* Roong Aroon International School Official Gold Crest on Left of School Names */}
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                    <img
                      src="/images/school_crest_gold.png"
                      alt="Roong Aroon International School Crest"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-base sm:text-lg font-bold text-[#111827] tracking-tight block leading-tight">
                      Roong Aroon International School
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#4B5563] block mt-0.5">
                      โรงเรียนนานาชาติรุ่งอรุณ
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. METADATA SECTION: CUSTOMER (LEFT) PAIRED WITH INVOICE NO. (RIGHT) */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 pb-3.5 mb-3.5 text-xs">
                {/* Column 1: Customer Details */}
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-[#6B7280] shrink-0 font-medium">Customer Name</span>
                    <span className="font-bold text-[#111827] flex-1">{invoice.customerName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-[#6B7280] shrink-0 font-medium">Address / Class</span>
                    <span className="text-[#111827] flex-1">
                      {invoice.studentClass || 'Roong Aroon International School'} (Class / Dept)
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-[#6B7280] shrink-0 font-medium">Tax ID / Student ID</span>
                    <span className="text-[#111827] flex-1 font-mono">{invoice.studentId || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-[#6B7280] shrink-0 font-medium">Email</span>
                    <span className="text-[#111827] flex-1 truncate font-mono">
                      {(invoice as any).email || (invoice.studentId ? `${invoice.studentId}@roong-aroon.ac.th` : '-')}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-[#6B7280] shrink-0 font-medium">Contact Person</span>
                    <span className="text-[#111827] flex-1">{invoice.parentName || invoice.customerName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-[#6B7280] shrink-0 font-medium">Phone</span>
                    <span className="text-[#111827] flex-1 font-mono">{invoice.phone || '-'}</span>
                  </div>
                </div>

                {/* Column 2: Document Metadata & Dates (Directly on the Right!) */}
                <div className="space-y-1 text-right">
                  <div className="flex justify-end items-center">
                    <span className="mr-3 text-[#6B7280] shrink-0 font-medium">Invoice No.</span>
                    <span className="font-extrabold text-[#111827] font-mono text-sm">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="mr-3 text-[#6B7280] shrink-0 font-medium">Issue Date</span>
                    <span className="text-[#111827] font-medium">{enCreatedDate}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="mr-3 text-[#6B7280] shrink-0 font-medium">Due Date</span>
                    <span className="font-bold text-[#B42318]">{enDueDate}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="mr-3 text-[#6B7280] shrink-0 font-medium">Payment Terms</span>
                    <span className="text-[#111827]">7 Days upon receipt</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="mr-3 text-[#6B7280] shrink-0 font-medium">Reference</span>
                    <span className="text-[#111827]">School Supply & Welfare Requisition</span>
                  </div>
                </div>

                {/* Issuer Info (Full Width Split across 2 columns) */}
                <div className="col-span-2 pt-2 border-t border-[#E5E7EB] grid grid-cols-2 gap-x-8 text-[11px] text-[#4B5563]">
                  <div className="space-y-0.5">
                    <div className="flex">
                      <span className="w-28 text-[#6B7280] shrink-0 font-medium">Issued By</span>
                      <span className="font-semibold text-[#111827]">
                        Roong Aroon International School
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-[#6B7280] shrink-0 font-medium">Address</span>
                      <span>392 Rim Klong Chak Phra Rd., Khlong Khwang, Phasi Charoen, Bangkok 10160</span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <div className="flex justify-end">
                      <span className="mr-3 text-[#6B7280] shrink-0 font-medium">School Tax ID</span>
                      <span className="font-mono font-medium">0105541008918</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="mr-3 text-[#6B7280] shrink-0 font-medium">Tel / Email</span>
                      <span>02-870-7512 / finance@roong-aroon.ac.th</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TABLE OF ITEMS */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden mb-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#111827] font-semibold text-[11px] bg-[#F9FAFB]">
                      <th className="py-2 px-3 text-center w-12">No.</th>
                      <th className="py-2 px-4 text-left">Item Description</th>
                      <th className="py-2 px-3 text-center w-20">Qty</th>
                      <th className="py-2 px-4 text-right w-28">Unit Price</th>
                      <th className="py-2 px-4 text-right w-32">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center text-[#6B7280] font-mono">{idx + 1}</td>
                        <td className="py-2 px-4">
                          <span className="font-medium text-[#111827]">{item.itemName}</span>
                          {item.itemCode && (
                            <span className="text-[10px] text-[#6B7280] font-mono ml-2">[{item.itemCode}]</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center text-[#111827] font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-4 text-right text-[#111827] font-mono">
                          {item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-4 text-right font-semibold text-[#111827] font-mono">
                          {item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}

                    {/* Empty placeholder rows to maintain document proportionality */}
                    {Array.from({ length: emptyRowsCount }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-7">
                        <td className="py-1 px-3 text-center text-[#9CA3AF] font-mono text-[10px]">
                          {invoice.items.length + i + 1}
                        </td>
                        <td className="py-1 px-4"></td>
                        <td className="py-1 px-3"></td>
                        <td className="py-1 px-4"></td>
                        <td className="py-1 px-4"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. PAYMENT METHODS & TOTALS SECTION (Side by side for guaranteed single-page A4 print fit) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pb-4 mb-4 border-b border-[#E5E7EB]">
                {/* Left 7 cols: Payment Instructions & Crisp Bangkok Bank PromptPay QR */}
                <div className="sm:col-span-7 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-bold text-[#111827] text-xs">Payment Instructions (การชำระเงิน)</h4>
                    <div className="text-[11px] text-[#374151] space-y-1">
                      <p>
                        <span className="text-[#6B7280]">Payee / ชื่อบัญชี:</span>{' '}
                        <strong className="text-[#111827]">{SCHOOL_BANK_INFO.accountName}</strong>
                      </p>
                      <p>
                        <span className="text-[#6B7280]">Bank / ธนาคาร:</span>{' '}
                        <strong className="text-[#111827]">{SCHOOL_BANK_INFO.bankName} (ธนาคารกรุงเทพ)</strong>
                      </p>
                      <p>
                        <span className="text-[#6B7280]">Account No. / เลขที่บัญชี:</span>{' '}
                        <strong className="font-mono text-[#0B6B4F] text-sm">002203089172</strong>
                      </p>
                      <div className="text-[10px] text-[#4B5563] font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">
                        Ref 1 (MID): {SCHOOL_BANK_INFO.ref1} | Ref 3 (TID): {SCHOOL_BANK_INFO.ref3}
                      </div>
                      <p className="text-[9.5px] text-[#6B7280] leading-snug">
                        * Scan with any mobile banking app & confirm payee is <strong>ROONG AROON INTERNATIONAL</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Crisp Official Bangkok Bank PromptPay QR (Enlarged & Sharp) */}
                  <div className="shrink-0 text-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                    <QRCodeSVG
                      value={promptPayPayload}
                      size={96}
                      level="M"
                      includeMargin={false}
                      className="mx-auto"
                    />
                    <div className="mt-1.5">
                      <span className="text-[10px] text-[#0B6B4F] font-bold block tracking-tight">
                        Thai QR Payment
                      </span>
                      <span className="text-[8.5px] text-[#6B7280] block font-medium">
                        Bangkok Bank
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Subtotals & Grand Total Box */}
                <div className="sm:col-span-5 flex flex-col justify-between space-y-2">
                  <div className="space-y-1 text-xs text-right">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Subtotal</span>
                      <span className="font-mono font-medium text-[#111827]">
                        ฿{invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Discount</span>
                      <span className="font-mono text-[#6B7280]">
                        {invoice.discount > 0 ? `-฿${invoice.discount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '฿0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">VAT (7%)</span>
                      <span className="font-mono text-[#6B7280]">0.00 (Exempt)</span>
                    </div>
                  </div>

                  {/* Total Due Banner */}
                  <div className="bg-[#0B6B4F] text-white rounded-xl p-2.5 px-3.5 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold block">Total Due</span>
                      <span className="text-[10px] text-emerald-100/90 font-medium block">
                        ({thaiBahtText(invoice.totalAmount)})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight block">
                        ฿{invoice.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. NOTES & TERMS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-3 mb-3 border-b border-[#E5E7EB]">
                <div>
                  <span className="font-semibold text-[#111827] block mb-0.5 text-[11px]">Notes:</span>
                  <p className="text-[#6B7280] text-[10px] leading-relaxed">
                    {invoice.note || 'Please process payment by the due date and submit the transfer receipt for official receipt issuance.'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-[#111827] block mb-0.5 text-[11px]">Terms & Conditions:</span>
                  <p className="text-[#6B7280] text-[10px] leading-relaxed">
                    This document is an official payment notice for educational supplies and student welfare.
                  </p>
                </div>
              </div>

              {/* 6. DUAL SIGNATURES (Anchors the bottom of the page) */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs text-[#6B7280] pt-2">
                <div className="space-y-1">
                  <div className="border-b border-[#D1D5DB] w-44 sm:w-56 mx-auto h-8"></div>
                  <p className="font-medium text-[#111827]">Received By / Customer Signature</p>
                  <p className="text-[11px] text-[#6B7280]">({invoice.customerName})</p>
                  <p className="text-[10px] text-[#9CA3AF]">Date ..... / ..... / ..........</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-[#D1D5DB] w-44 sm:w-56 mx-auto h-8"></div>
                  <p className="font-medium text-[#111827]">Authorized Signatory</p>
                  <p className="text-[11px] text-[#6B7280]">({invoice.creatorName || 'School Finance Officer'})</p>
                  <p className="text-[10px] text-[#9CA3AF]">Date ..... / ..... / ..........</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
