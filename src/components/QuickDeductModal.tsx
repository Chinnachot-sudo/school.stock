'use client';

import { useState, useEffect } from 'react';
import { Item, Department } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import { X, Minus, Plus, MapPin, AlertCircle, Building2, User, HelpCircle } from 'lucide-react';

interface QuickDeductModalProps {
  item: Item | null;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: Item, deductedQty: number) => void;
}

const DEDUCT_REASONS = [
  'เบิกใช้ห้องเรียน',
  'แจกกิจกรรม',
  'ชำรุดจำหน่าย',
  'อื่น ๆ'
];

export default function QuickDeductModal({
  item,
  departments,
  isOpen,
  onClose,
  onSuccess
}: QuickDeductModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('เบิกใช้ห้องเรียน');
  const [department, setDepartment] = useState<string>('');
  const [requesterName, setRequesterName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    if (user) {
      const authName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setRequesterName(authName);
    } else if (typeof window !== 'undefined') {
      const savedRequester = localStorage.getItem('school_stock_last_requester');
      if (savedRequester) setRequesterName(savedRequester);
    }

    if (typeof window !== 'undefined') {
      const savedDept = localStorage.getItem('school_stock_last_dept');
      if (savedDept) setDepartment(savedDept);
      else if (departments.length > 0) setDepartment(departments[0].name);
    }
  }, [departments, user]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason('เบิกใช้ห้องเรียน');
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isOverStock = quantity > item.currentStock;
  const isOutOfStock = item.currentStock <= 0;

  const handleStep = (delta: number) => {
    setError(null);
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (isOverStock) {
      setError('คงเหลือไม่พอสำหรับการตัดครั้งนี้');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const combinedNote = [
        reason ? `เหตุผล: ${reason}` : '',
        note ? `หมายเหตุ: ${note}` : ''
      ].filter(Boolean).join(' | ');

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          type: 'OUT',
          quantity,
          department: department || 'กลุ่มสาระฯ ทั่วไป',
          requesterName,
          note: combinedNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการตัดสต็อก');
      }

      if (typeof window !== 'undefined') {
        if (department) localStorage.setItem('school_stock_last_dept', department);
        if (requesterName) localStorage.setItem('school_stock_last_requester', requesterName);
      }

      onSuccess(data.updatedItem, quantity);
      onClose();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถตัดสต็อกได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-white border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-[#1A1A1A]">ตัดสต็อก / เบิกพัสดุ</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Read-only Item Summary */}
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
                <span className="truncate">{item.location || 'ไม่ระบุจุดจัดเก็บ'}</span>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5">
          
          {/* Negative balance guard warning as specified in Brief */}
          {isOverStock ? (
            <div className="bg-[#FEF0C7] border border-[#B54708]/30 text-[#B54708] p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B54708]" />
              <span>คงเหลือไม่พอสำหรับการตัดครั้งนี้</span>
            </div>
          ) : error ? (
            <div className="bg-[#FEE4E2] border border-[#B42318]/30 text-[#B42318] p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Stepper Input */}
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
              จำนวนที่ต้องการตัด ({item.unit})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={quantity <= 1}
                className="w-11 h-11 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] disabled:opacity-40 flex items-center justify-center font-medium text-[#1A1A1A] active:scale-95 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setQuantity(val);
                  }}
                  className="w-full text-center text-lg font-bold font-mono py-2 bg-white border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1F4D3A] text-[#1A1A1A]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#6B6560] pointer-events-none">
                  {item.unit}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="w-11 h-11 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] flex items-center justify-center font-medium text-[#1A1A1A] active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reason Selector (Mandated in Design Brief) */}
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
              เหตุผลการเบิก <span className="text-[#B54708]">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1F4D3A]"
            >
              {DEDUCT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
              กลุ่มสาระฯ / แผนกงาน
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1F4D3A]"
            >
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Requester Name */}
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
              ผู้รับ / ครูผู้เบิก (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="ระบุชื่อผู้รับพัสดุ"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
              หมายเหตุเพิ่มเติม (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="ระบุกิจกรรมหรือรายละเอียดเพิ่มเติม"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            />
          </div>

          {/* Single Primary Action Button in Terracotta #C45C26 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isOutOfStock || isOverStock}
              className="w-full min-h-[48px] bg-[#C45C26] hover:bg-[#A84B1E] disabled:bg-[#E5E0D8] disabled:text-[#6B6560] disabled:cursor-not-allowed active:scale-98 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <span>กำลังบันทึกตัดสต็อก...</span>
              ) : (
                <span>ยืนยันตัดสต็อก (-{quantity} {item.unit})</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
