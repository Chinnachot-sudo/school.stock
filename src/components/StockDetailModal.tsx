'use client';

import React from 'react';
import { Item, Category } from '@/types/inventory';
import { X, MapPin, Tag, Boxes, AlertCircle, CheckCircle2, AlertTriangle, ScanLine, DollarSign } from 'lucide-react';

interface StockDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
  onScanNext?: () => void;
}

export default function StockDetailModal({
  item,
  isOpen,
  onClose,
  categories = [],
  onScanNext
}: StockDetailModalProps) {
  if (!isOpen || !item) return null;

  const category = categories.find(c => c.id === item.categoryId);
  const isOutOfStock = item.currentStock <= 0;
  const isLowStock = !isOutOfStock && item.currentStock <= item.minStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-detail-title"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0B6B4F] text-white">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-200" />
            <h2 id="stock-detail-title" className="font-bold text-sm tracking-tight">
              รายละเอียดและสต็อกคงเหลือ
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Main Item Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0B6B4F] border border-slate-200">
                {item.code}
              </span>
              {category && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{category.name}</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {item.name}
            </h3>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>สถานที่จัดเก็บ: <strong className="text-slate-700">{item.location || 'ไม่ได้ระบุ'}</strong></span>
            </div>
          </div>

          {/* Current Stock Highlight Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isOutOfStock
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : isLowStock
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold opacity-80 block">
                จำนวนคงเหลือปัจจุบัน (Remaining Stock)
              </span>
              <div className="text-3xl font-black font-mono mt-0.5">
                {item.currentStock}{' '}
                <span className="text-sm font-semibold opacity-75">{item.unit}</span>
              </div>
            </div>

            <div className="text-right">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>สินค้าหมด</span>
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>สต็อกต่ำกว่าเกณฑ์</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>พร้อมใช้งาน</span>
                </span>
              )}
            </div>
          </div>

          {/* Additional Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 block">เกณฑ์สต็อกขั้นต่ำ (Min Stock):</span>
              <span className="font-semibold text-slate-700 font-mono">
                {item.minStock} {item.unit}
              </span>
            </div>

            {item.price !== undefined && item.price > 0 && (
              <div>
                <span className="text-slate-400 block">ราคาจำหน่าย (Price):</span>
                <span className="font-semibold text-slate-700 font-mono">
                  ฿{Number(item.price).toFixed(2)}
                </span>
              </div>
            )}

            {item.note && (
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-400 block">หมายเหตุ / คำอธิบาย:</span>
                <span className="text-slate-600 italic">{item.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons: Only Close or Scan Another, NO quantity modification */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {onScanNext && (
            <button
              type="button"
              onClick={onScanNext}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              <ScanLine className="w-3.5 h-3.5 text-[#0B6B4F]" />
              <span>สแกนรายการถัดไป</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-[#095740] text-white text-xs font-bold transition shadow-2xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
