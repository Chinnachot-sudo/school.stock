'use client';

import { Receipt, PAYMENT_METHOD_LABELS, CUSTOMER_TYPE_LABELS } from '@/types/inventory';
import { thaiBahtText } from '@/lib/thai-baht';
import { X, Printer, CheckCircle2, Scissors, Copy, School, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ReceiptModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, isOpen, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/receipts/${receipt.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formattedDate = new Date(receipt.createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isVoided = receipt.status === 'VOIDED';

  // Sub-component for rendering one half of the receipt
  const renderReceiptHalf = (copyType: 'ORIGINAL' | 'COPY') => {
    const isOriginal = copyType === 'ORIGINAL';
    return (
      <div className="receipt-half border border-slate-300 rounded-xl p-4 sm:p-5 bg-white text-slate-800 text-[11px] leading-relaxed relative flex flex-col justify-between min-h-[380px] print:min-h-0">
        {/* Void Watermark */}
        {isVoided && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-red-500/20 text-6xl font-black border-8 border-red-500/20 px-8 py-4 rounded-3xl -rotate-12 select-none">
              VOID
            </div>
          </div>
        )}

        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0">
                <img
                  src="/images/school_logo.png"
                  alt="Roong Aroon International School Crest"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 leading-tight">
                  Roong Aroon International School
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  โรงเรียนนานาชาติรุ่งอรุณ
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide mb-1 border">
                {isOriginal ? (
                  <span className="text-blue-800 bg-blue-50 border-blue-200">
                    Original (Parent / Student)
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-50 border-amber-200">
                    Copy (School / Accounts)
                  </span>
                )}
              </div>
              <h4 className="font-bold text-xs text-slate-800">
                Official Receipt
              </h4>
            </div>
          </div>

          {/* Customer & Receipt Meta */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg mb-2.5 border border-slate-200/80 text-[10px]">
            <div>
              <p>
                <span className="text-slate-500 font-medium">Customer: </span>
                <strong className="text-slate-900 font-bold">{receipt.customerName}</strong>
              </p>
              {receipt.studentClass && (
                <p className="mt-0.5">
                  <span className="text-slate-500 font-medium">Grade / Class: </span>
                  <strong className="text-slate-800">{receipt.studentClass}</strong>
                  {receipt.studentId && <span> (ID: {receipt.studentId})</span>}
                </p>
              )}
              <p className="mt-0.5">
                <span className="text-slate-500 font-medium">Type: </span>
                <span>{CUSTOMER_TYPE_LABELS[receipt.customerType] || receipt.customerType}</span>
              </p>
            </div>

            <div className="text-right">
              <p>
                <span className="text-slate-500 font-medium">Receipt No.: </span>
                <strong className="font-mono font-bold text-blue-700">{receipt.receiptNumber}</strong>
              </p>
              <p className="mt-0.5">
                <span className="text-slate-500 font-medium">Date & Time: </span>
                <span>{formattedDate}</span>
              </p>
              <p className="mt-0.5">
                <span className="text-slate-500 font-medium">Payment: </span>
                <strong className="text-emerald-700">{PAYMENT_METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod}</strong>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-2 text-[10px]">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-100 text-slate-600">
                <th className="py-1 px-1.5 text-center w-8">No.</th>
                <th className="py-1 px-1.5 text-left">Description</th>
                <th className="py-1 px-1.5 text-center w-14">Qty</th>
                <th className="py-1 px-1.5 text-right w-16">Unit Price</th>
                <th className="py-1 px-1.5 text-right w-18">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-1 px-1.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-1 px-1.5 font-medium text-slate-900">
                    {item.itemName}
                    <span className="text-[9px] text-slate-400 font-mono ml-1">({item.itemCode})</span>
                  </td>
                  <td className="py-1 px-1.5 text-center">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-1 px-1.5 text-right">฿{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1 px-1.5 text-right font-bold">฿{item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {/* Total & Summary Box */}
          <div className="border-t border-slate-200 pt-1.5 mt-1 flex items-start justify-between text-[10px]">
            <div className="flex-1 pr-2">
              <span className="text-slate-500 block">Amount in words:</span>
              <span className="font-bold text-blue-900">
                ({thaiBahtText(receipt.totalAmount)})
              </span>
              {receipt.paymentMethod === 'CASH' && receipt.cashReceived !== undefined && (
                <p className="text-[9px] text-slate-500 mt-1">
                  Cash Received: <strong>฿{receipt.cashReceived.toFixed(2)}</strong> | Change: <strong>฿{(receipt.change || 0).toFixed(2)}</strong>
                </p>
              )}
            </div>

            <div className="w-44 text-right space-y-0.5">
              {receipt.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount:</span>
                  <span>-฿{receipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs text-slate-900 border-t border-slate-200 pt-0.5">
                <span>Total Amount:</span>
                <span className="text-blue-700">฿{receipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t border-slate-100 text-[9px] text-slate-600">
            <div className="text-center">
              <p className="mt-4 border-b border-dotted border-slate-400 w-3/4 mx-auto"></p>
              <p className="mt-1">Payer / Authorized Recipient</p>
            </div>
            <div className="text-center">
              <p className="mt-4 border-b border-dotted border-slate-400 w-3/4 mx-auto"></p>
              <p className="mt-1">
                Cashier: <strong>{receipt.cashierName || 'Finance / Store Staff'}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      
      {/* Print Specific CSS to enforce Full-A4 sizing and two symmetrical halves */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            font-size: 10pt !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 280mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            z-index: 9999999 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .receipt-half {
            flex: 1 1 0% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] my-auto">
        
        {/* Top Controls Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm">
                Official Receipt #{receipt.receiptNumber}
              </h2>
              <p className="text-[10px] text-slate-400">
                Half-A4 Format (Original + Copy)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition text-slate-200"
              title="Copy Receipt Link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Half-A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-100 print:bg-white print:p-0">
          
          {/* Notice Banner */}
          <div className="no-print bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Prints to standard A4 sheet with automatic perforation line (top half for parent, bottom half for school archives).
              </span>
            </div>
          </div>

          {/* The Actual Dual-Half Receipt Paper */}
          <div id="printable-receipt" className="receipt-print-area space-y-4 print:space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
            {/* Top Half: Original for Parent / Student */}
            {renderReceiptHalf('ORIGINAL')}

            {/* Scissor Cut Line Divider */}
            <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] my-1 py-1 select-none shrink-0">
              <Scissors className="w-3.5 h-3.5 rotate-90" />
              <span className="tracking-widest font-mono">
                - - - - - - - - Cut Along Perforation (Half-A4) - - - - - - - -
              </span>
              <Scissors className="w-3.5 h-3.5 -rotate-90" />
            </div>

            {/* Bottom Half: Copy for School */}
            {renderReceiptHalf('COPY')}
          </div>

        </div>

      </div>
    </div>
  );
}
