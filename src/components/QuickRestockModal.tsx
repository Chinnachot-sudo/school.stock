'use client';

import { useState, useEffect } from 'react';
import { Item, Department } from '@/types/inventory';
import { X, Plus, PackagePlus, MapPin, Building2, AlertTriangle } from 'lucide-react';

interface QuickRestockModalProps {
  item: Item | null;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: Item, addedQty: number) => void;
}

export default function QuickRestockModal({
  item,
  departments,
  isOpen,
  onClose,
  onSuccess
}: QuickRestockModalProps) {
  const [quantity, setQuantity] = useState<number>(5);
  const [department, setDepartment] = useState<string>('งานพัสดุ อาคารสถานที่');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(5);
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          type: 'IN',
          quantity,
          department: department || 'งานพัสดุ อาคารสถานที่',
          note: note || 'รับพัสดุเข้าคลัง'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการรับเข้าสต็อก');
      }

      onSuccess(data.updatedItem, quantity);
      onClose();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถรับเข้าสต็อกได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="font-bold text-sm">รับของเข้าสต็อก (Stock In)</h2>
              <p className="text-[10px] text-emerald-200">เพิ่มจำนวนเมื่อได้รับของใหม่</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Summary */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-start justify-between">
          <div className="flex-1 pr-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
              รหัส: {item.code}
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.location}</span>
            </div>
          </div>
          <div className="text-right shrink-0 bg-white px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
            <span className="text-[10px] text-slate-500 block">คงเหลือปัจจุบัน</span>
            <div className="text-xl font-extrabold text-emerald-700 leading-tight">
              {item.currentStock}
            </div>
            <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              จำนวนที่รับเข้าเพิ่ม ({item.unit})
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[5, 10, 20, 50].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`py-2 rounded-xl text-sm font-bold border transition ${
                    quantity === q
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center text-xl font-black py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-400 font-semibold pointer-events-none">
                {item.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ยอดคงเหลือใหม่หลังรับเข้า: <strong className="text-emerald-600">{item.currentStock + quantity} {item.unit}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ / เลขที่ใบส่งของ (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ใบส่งของ บจก.สยามพัสดุ #INV-9821"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-base transition"
            >
              <Plus className="w-5 h-5" />
              <span>ยืนยันการรับเข้า (+{quantity} {item.unit})</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
