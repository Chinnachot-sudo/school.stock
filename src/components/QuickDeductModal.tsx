'use client';

import { useState, useEffect } from 'react';
import { Item, Department } from '@/types/inventory';
import { X, Minus, Plus, Scissors, MapPin, Building2, User, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QuickDeductModalProps {
  item: Item | null;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: Item, deductedQty: number) => void;
}

export default function QuickDeductModal({
  item,
  departments,
  isOpen,
  onClose,
  onSuccess
}: QuickDeductModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [department, setDepartment] = useState<string>('');
  const [requesterName, setRequesterName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDept = localStorage.getItem('school_stock_last_dept');
      const savedRequester = localStorage.getItem('school_stock_last_requester');
      if (savedDept) setDepartment(savedDept);
      else if (departments.length > 0) setDepartment(departments[0].name);
      if (savedRequester) setRequesterName(savedRequester);
    }
  }, [departments]);

  // Reset quantity when modal opens for a new item
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isOutOfStock = item.currentStock <= 0;
  const isOverRequest = quantity > item.currentStock;

  const handleQuickQty = (q: number) => {
    setError(null);
    setQuantity(q);
  };

  const handleStep = (delta: number) => {
    setError(null);
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (quantity > item.currentStock) {
      setError(`ยอดคงเหลือไม่พอตัด (มีเพียง ${item.currentStock} ${item.unit})`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          type: 'OUT',
          quantity,
          department: department || 'กลุ่มสาระฯ ทั่วไป',
          requesterName,
          note
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการตัดสต็อก');
      }

      // Save department and requester preference for future ease-of-use
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm">ตัดสต็อก / เบิกพัสดุ</h2>
              <p className="text-[10px] text-slate-400">ระบุจำนวนและผู้เบิก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Info Summary Card */}
        <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex items-start justify-between">
          <div className="flex-1 pr-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-200 text-blue-800">
              รหัส: {item.code}
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{item.location || 'ไม่ระบุจุดจัดเก็บ'}</span>
            </div>
          </div>
          <div className="text-right shrink-0 bg-white px-3 py-2 rounded-xl border border-blue-100 shadow-sm">
            <span className="text-[10px] text-slate-500 block">คงเหลือ</span>
            <div className="text-xl font-extrabold text-blue-600 leading-tight">
              {item.currentStock}
            </div>
            <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Buttons for Mobile */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              จำนวนที่ต้องการเบิก ({item.unit})
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 2, 5, 10].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickQty(q)}
                  disabled={q > item.currentStock}
                  className={`py-2 rounded-xl text-sm font-bold border transition ${
                    quantity === q
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : q > item.currentStock
                      ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Stepper Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={quantity <= 1}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  max={item.currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center text-lg font-black py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                  {item.unit}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={quantity >= item.currentStock}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {isOverRequest && (
              <p className="text-[11px] text-red-500 mt-1">
                * จำนวนเบิกเกินยอดสต็อกคงเหลือที่มี
              </p>
            )}
          </div>

          {/* Department Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              กลุ่มสาระการเรียนรู้ / แผนกงาน
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-0.5">
              * ระบบจะจำแผนกที่คุณเลือกไว้ให้อัตโนมัติสำหรับการเบิกครั้งถัดไป
            </p>
          </div>

          {/* Requester Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              ชื่อครู / เจ้าหน้าที่ผู้เบิก (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ครูสมหมาย หรือ จนท.พัสดุ"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ / ใช้สำหรับกิจกรรม (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ใช้จัดงานวันวิทยาศาสตร์, จัดสอบกลางภาค"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isOutOfStock || isOverRequest}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 active:scale-98 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-base transition"
            >
              {isSubmitting ? (
                <span>กำลังบันทึกตัดสต็อก...</span>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  <span>ยืนยันการตัดสต็อก (-{quantity} {item.unit})</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
