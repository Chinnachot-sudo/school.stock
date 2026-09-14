'use client';

import { useState, useEffect } from 'react';
import { Item, Category } from '@/types/inventory';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckSquare, Square, QrCode, MapPin, School, Info, Link2, Hash, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function PrintQrPage() {
  const { canPrintQr, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardSize, setCardSize] = useState<'medium' | 'small'>('medium');
  const [qrMode, setQrMode] = useState<'url' | 'code'>('url');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        const list = data.items || [];
        setItems(list);
        setSelectedIds(list.map((i: Item) => i.id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItems = items.filter(i => selectedIds.includes(i.id));

  // Compute QR value according to selected mode
  const getQrValue = (item: Item): string => {
    if (qrMode === 'url' && origin) {
      return `${origin}/?code=${encodeURIComponent(item.code)}`;
    }
    return item.code;
  };

  if (!authLoading && !canPrintQr) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Inventory Staff & Super Admin Only
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            This page is for printing inventory QR Code labels. Access is restricted to Inventory Staff and Super Admins.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Control Header (Hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E5E0D8] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#1F4D3A]" />
              Print QR Code Labels for Shelves & Storage
            </h1>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Select items to generate and print A4 adhesive QR label sheets for storage shelves and bins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] disabled:opacity-40 text-white text-xs font-medium transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Labels ({selectedItems.length})</span>
            </button>
          </div>
        </div>

        {/* Informative Tip Box */}
        <div className="bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-3 text-xs text-[#1A1A1A] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1F4D3A] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Mobile Camera Scan Instructions:</strong>
            <p className="text-[#6B6560] mt-0.5">
              When using <u>&quot;Direct Web Link&quot;</u>, teachers and staff can scan the QR label using their smartphone camera (or LINE app) to instantly open the deduction page for that item.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Select All Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-medium text-[#1A1A1A] hover:text-[#1F4D3A] transition"
            >
              {selectedIds.length === items.length ? (
                <CheckSquare className="w-4 h-4 text-[#1F4D3A]" />
              ) : (
                <Square className="w-4 h-4 text-[#6B6560]" />
              )}
              <span>Select All ({selectedIds.length}/{items.length})</span>
            </button>
          </div>

          {/* QR Content Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#F7F4EF] p-1 rounded-lg border border-[#E5E0D8]">
            <span className="text-[#6B6560] font-medium px-1.5 text-xs">QR Format:</span>
            <button
              onClick={() => setQrMode('url')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1 transition ${
                qrMode === 'url'
                  ? 'bg-[#1F4D3A] text-white'
                  : 'text-[#6B6560] hover:text-[#1A1A1A]'
              }`}
              title="Mobile camera opens deduction page directly"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Direct Web Link (Recommended)</span>
            </button>
            <button
              onClick={() => setQrMode('code')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1 transition ${
                qrMode === 'code'
                  ? 'bg-[#1F4D3A] text-white'
                  : 'text-[#6B6560] hover:text-[#1A1A1A]'
              }`}
              title="Raw SKU code only"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Raw SKU Code</span>
            </button>
          </div>

          {/* Label Size Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[#6B6560] font-medium text-xs">Label Size:</span>
            <button
              onClick={() => setCardSize('medium')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardSize === 'medium'
                  ? 'bg-[#E8F0EB] text-[#1F4D3A] border-[#1F4D3A]/20'
                  : 'bg-[#F7F4EF] text-[#6B6560] border-[#E5E0D8]'
              }`}
            >
              Standard (Shelf)
            </button>
            <button
              onClick={() => setCardSize('small')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardSize === 'small'
                  ? 'bg-[#E8F0EB] text-[#1F4D3A] border-[#1F4D3A]/20'
                  : 'bg-[#F7F4EF] text-[#6B6560] border-[#E5E0D8]'
              }`}
            >
              Compact (Bin / Box)
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white p-4 sm:p-8 rounded-xl border border-[#E5E0D8] min-h-[500px]">
        {selectedItems.length === 0 ? (
          <div className="p-12 text-center text-[#6B6560] no-print">
            <p className="text-xs font-medium">Please select items above to preview printable QR labels</p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              cardSize === 'medium'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}
          >
            {selectedItems.map(item => {
              const qrValue = getQrValue(item);

              return (
                <div
                  key={item.id}
                  className="relative bg-white border-2 border-dashed border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-between hover:border-[#1F4D3A] transition break-inside-avoid"
                >
                  {/* Deselect checkbox on screen only */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="no-print absolute top-2 right-2 p-1 text-[#6B6560] hover:text-[#B42318]"
                    title="Remove from print list"
                  >
                    <CheckSquare className="w-4 h-4 text-[#1F4D3A]" />
                  </button>

                  {/* Card Header */}
                  <div className="flex items-center gap-1.5 border-b border-[#E5E0D8] pb-1.5 mb-2">
                    <School className="w-3.5 h-3.5 text-[#1F4D3A]" />
                    <span className="text-[10px] font-semibold text-[#1A1A1A] uppercase tracking-tight">
                      School Stock • Scan to Issue
                    </span>
                  </div>

                  {/* QR Code and Item Meta */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 flex items-center justify-center">
                      <QRCodeSVG
                        value={qrValue}
                        size={cardSize === 'medium' ? 78 : 64}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded block truncate w-max">
                        {item.code}
                      </span>
                      <h2 className="text-xs font-black text-slate-900 mt-1 leading-snug line-clamp-2">
                        {item.name}
                      </h2>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Unit: {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Shelf Location Tag */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <strong className="truncate">{item.location || 'Central Storage'}</strong>
                    </span>
                    <span className="text-[9px] text-blue-600 font-semibold shrink-0">
                      Scan to Issue
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
