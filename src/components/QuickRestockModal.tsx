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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-[#1F4D3A]" />
            <h2 className="font-semibold text-sm text-[#1A1A1A]">รับของเข้าสต็อก (Stock In)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Summary */}
        <div className="p-4 bg-[#F7F4EF] border-b border-[#E5E0D8]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] text-[#6B6560] block uppercase tracking-wider">
                {item.code}
              </span>
              <h3 className="font-semibold text-sm text-[#1A1A1A] mt-0.5 leading-snug">
                {item.name}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-[#6B6560] mt-1">
                <MapPin className="w-3 h-3 text-[#6B6560] shrink-0" />
                <span>{item.location || 'ไม่ระบุจุดจัดเก็บ'}</span>
              </div>
            </div>

            <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-lg border border-[#E5E0D8]">
              <span className="text-[10px] text-[#6B6560] block">คงเหลือ</span>
              <div className="text-lg font-bold font-mono text-[#1A1A1A] leading-tight">
                {item.currentStock}
              </div>
              <span className="text-[10px] text-[#6B6560]">{item.unit}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="bg-[#FEE4E2] border border-[#B42318]/30 text-[#B42318] p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              จำนวนที่รับเข้าเพิ่ม ({item.unit})
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[5, 10, 20, 50].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`py-2 rounded-lg text-xs font-medium border transition ${
                    quantity === q
                      ? 'bg-[#1F4D3A] text-white border-[#1F4D3A]'
                      : 'bg-white hover:bg-[#F7F4EF] text-[#1A1A1A] border-[#E5E0D8]'
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
                className="w-full text-center text-lg font-bold font-mono py-2 bg-white border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1F4D3A] text-[#1A1A1A]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#6B6560] pointer-events-none">
                {item.unit}
              </span>
            </div>
            <p className="text-[11px] text-[#6B6560] mt-1">
              ยอดคงเหลือใหม่หลังรับเข้า: <strong className="font-mono text-[#027A48]">{item.currentStock + quantity} {item.unit}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
              หมายเหตุ / เลขที่ใบส่งของ (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ใบส่งของ บจก.สยามพัสดุ #INV-9821"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-[#1F4D3A] hover:bg-[#183D2E] disabled:opacity-50 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>ยืนยันการรับเข้า (+{quantity} {item.unit})</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
