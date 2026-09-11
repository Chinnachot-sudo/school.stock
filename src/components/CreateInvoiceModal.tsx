'use client';

import { useState, useMemo } from 'react';
import { Customer, Item, ALL_IB_GRADES, IBProgramme, CustomerType, Invoice } from '@/types/inventory';
import { X, Plus, Trash2, Search, User, FileText, AlertTriangle, Calendar, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  items: Item[];
  onInvoiceCreated: (invoice: Invoice) => void;
}

interface TempLineItem {
  id: string;
  itemId?: string;
  itemCode?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  customers,
  items,
  onInvoiceCreated
}: CreateInvoiceModalProps) {
  const { user } = useAuth();

  // Customer Selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('STUDENT');
  const [studentClass, setStudentClass] = useState<string>(ALL_IB_GRADES[0] || 'Grade 1 (PYP 1)');
  const [studentId, setStudentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [discount, setDiscount] = useState<number>(0);
  const [note, setNote] = useState('');

  // Items in invoice
  const [lineItems, setLineItems] = useState<TempLineItem[]>([
    {
      id: 'item-1',
      itemName: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'ชิ้น'
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter customers for dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 6);
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.nickname && c.nickname.toLowerCase().includes(q)) ||
      (c.studentId && c.studentId.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [customers, customerSearch]);

  if (!isOpen) return null;

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.nickname ? `${c.name} (${c.nickname})` : c.name);
    setCustomerType(c.type);
    if (c.grade) setStudentClass(c.grade);
    if (c.studentId) setStudentId(c.studentId);
    if (c.parentName) setParentName(c.parentName);
    if (c.phone) setPhone(c.phone);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'ชิ้น'
      }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const handleItemSelect = (lineId: string, itemId: string) => {
    const foundItem = items.find(i => i.id === itemId);
    if (!foundItem) return;

    setLineItems(prev =>
      prev.map(li =>
        li.id === lineId
          ? {
              ...li,
              itemId: foundItem.id,
              itemCode: foundItem.code,
              itemName: foundItem.name,
              unitPrice: foundItem.price || 0,
              unit: foundItem.unit || 'ชิ้น'
            }
          : li
      )
    );
  };

  const updateLineItem = (id: string, field: keyof TempLineItem, value: any) => {
    setLineItems(prev =>
      prev.map(li => (li.id === id ? { ...li, [field]: value } : li))
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(discount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('กรุณาระบุชื่อผู้รับใบแจ้ง / นักเรียน');
      return;
    }

    const validItems = lineItems.filter(i => i.itemName.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError('กรุณาระบุรายการอย่างน้อย 1 รายการ');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const creatorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'จนท. การเงิน';
      const creatorEmail = user?.email || '';

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerType,
          studentClass: studentClass.trim() || undefined,
          studentId: studentId.trim() || undefined,
          parentName: parentName.trim() || undefined,
          phone: phone.trim() || undefined,
          dueDate,
          items: validItems.map(i => ({
            itemId: i.itemId,
            itemCode: i.itemCode,
            itemName: i.itemName.trim(),
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.unitPrice) || 0,
            unit: i.unit || 'ชิ้น'
          })),
          discount: Number(discount) || 0,
          creatorName,
          creatorEmail,
          note: note.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      onInvoiceCreated(data.invoice);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-[#E5E0D8] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#E5E0D8] bg-[#1F4D3A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">
                ออกใบแจ้งชำระเงินใหม่ (Half-A4 Invoice)
              </h2>
              <p className="text-[11px] text-white/70">
                สำหรับส่งผู้ปกครองหรือนักเรียน พร้อมฝัง QR Code ทางการของโรงเรียน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          
          {error && (
            <div className="p-2.5 bg-[#FEF0C7] border border-[#B54708]/20 text-[#B54708] rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection & Quick Search */}
          <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>ข้อมูลผู้รับใบแจ้ง / นักเรียน (Bill To)</span>
              </span>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerName('');
                    setStudentId('');
                    setParentName('');
                    setPhone('');
                  }}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  ล้าง / กรอกเอง
                </button>
              )}
            </div>

            {/* Quick Customer Autocomplete */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาจากฐานข้อมูลนักเรียน (ชื่อ, ชื่อเล่น, รหัส)..."
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
              />

              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-2.5 hover:bg-blue-50 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {c.name} {c.nickname ? `(${c.nickname})` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {c.grade} {c.studentId ? `• รหัส: ${c.studentId}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        เลือก
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  ชื่อ-สกุล นักเรียน / ผู้รับใบแจ้ง *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ด.ช. ปัญญาวุฒิ สุขใจ"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  ระดับชั้น (IB Curriculum)
                </label>
                <select
                  value={studentClass}
                  onChange={e => setStudentClass(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  {ALL_IB_GRADES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  รหัสนักเรียน (Student ID)
                </label>
                <input
                  type="text"
                  placeholder="เช่น RAIS-2024-042"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  เบอร์โทรศัพท์ผู้ปกครอง
                </label>
                <input
                  type="text"
                  placeholder="08x-xxx-xxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dates & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                กำหนดชำระเงินภายใน (Due Date) *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                หมายเหตุใบแจ้งชำระ (Note)
              </label>
              <input
                type="text"
                placeholder="เช่น ค่าชุดยูนิฟอร์มประจำภาคเรียนที่ 1"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>รายการพัสดุ / ค่าบริการที่ต้องชำระ</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (เลือกจากคลัง หรือพิมพ์รายการใหม่ได้)
                </span>
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการ</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((li, idx) => (
                <div key={li.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 text-center text-slate-400 font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>

                  {/* Preset Item Selector */}
                  <select
                    onChange={e => handleItemSelect(li.id, e.target.value)}
                    defaultValue=""
                    className="w-full sm:w-44 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                  >
                    <option value="" disabled>-- เลือกจากคลัง --</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.price ? `฿${item.price}` : 'ไม่มีราคา'})
                      </option>
                    ))}
                  </select>

                  {/* Item Description */}
                  <input
                    type="text"
                    required
                    placeholder="รายละเอียดรายการ..."
                    value={li.itemName}
                    onChange={e => updateLineItem(li.id, 'itemName', e.target.value)}
                    className="flex-1 w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />

                  {/* Quantity */}
                  <div className="flex items-center gap-1 shrink-0 w-24">
                    <input
                      type="number"
                      min="1"
                      value={li.quantity}
                      onChange={e => updateLineItem(li.id, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 text-center px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="หน่วย"
                      value={li.unit}
                      onChange={e => updateLineItem(li.id, 'unit', e.target.value)}
                      className="w-10 text-center px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px]"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="flex items-center gap-1 shrink-0 w-24">
                    <span className="text-slate-400">฿</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={li.unitPrice}
                      onChange={e => updateLineItem(li.id, 'unitPrice', Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-right px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="w-20 text-right font-black text-slate-800 shrink-0">
                    ฿{(li.quantity * li.unitPrice).toFixed(2)}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeLineItem(li.id)}
                    disabled={lineItems.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Calculations Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">ส่วนลด (บาท):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-right font-bold text-red-600"
                />
              </div>

              <div className="text-right">
                <span className="text-slate-400 mr-2 text-[11px]">ยอดสุทธิทั้งสิ้น:</span>
                <span className="text-lg font-black text-blue-700">
                  ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E0D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] text-[#6B6560] font-medium hover:bg-[#F7F4EF] transition text-xs"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] disabled:opacity-40 text-white font-medium flex items-center gap-1.5 transition text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>ออกใบแจ้งชำระเงิน</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
