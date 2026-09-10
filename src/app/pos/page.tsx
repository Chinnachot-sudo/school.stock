'use client';

import { useState, useEffect, useMemo } from 'react';
import { Item, Category, CustomerType, PaymentMethod, Receipt, CUSTOMER_TYPE_LABELS } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import { generatePromptPayPayload } from '@/lib/promptpay';
import ScannerModal from '@/components/ScannerModal';
import ReceiptModal from '@/components/ReceiptModal';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShoppingCart,
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Receipt as ReceiptIcon,
  Store,
  Edit2
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  item: Item;
  quantity: number;
  unitPrice: number;
}

const SCHOOL_CLASSES = [
  'อ.1', 'อ.2', 'อ.3',
  'ป.1/1', 'ป.1/2', 'ป.2/1', 'ป.2/2', 'ป.3/1', 'ป.3/2',
  'ป.4/1', 'ป.4/2', 'ป.5/1', 'ป.5/2', 'ป.6/1', 'ป.6/2',
  'ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1', 'ม.3/2',
  'ม.4', 'ม.5', 'ม.6', 'บุคลากร/ทั่วไป'
];

const DEFAULT_PROMPTPAY_ID = process.env.NEXT_PUBLIC_DEFAULT_PROMPTPAY_ID || '0994000165';

export default function PosPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('ผู้ปกครอง / นักเรียน');
  const [customerType, setCustomerType] = useState<CustomerType>('STUDENT');
  const [studentClass, setStudentClass] = useState('ป.1/1');
  const [studentId, setStudentId] = useState('');
  const [discount, setDiscount] = useState<number>(0);

  // Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [promptPayId, setPromptPayId] = useState(DEFAULT_PROMPTPAY_ID);
  const [isEditingPromptPay, setIsEditingPromptPay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Scanner & Receipt Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<Receipt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data.items || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching items for POS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter items: prioritize items that have price or isForSale = true
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Add to cart
  const addToCart = (item: Item) => {
    if (item.currentStock <= 0) {
      showToast(`⚠️ สินค้า "${item.name}" หมดสต็อกแล้ว`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.currentStock) {
          showToast(`⚠️ สินค้าคงเหลือเพียง ${item.currentStock} ${item.unit}`);
          return prev;
        }
        return prev.map(ci =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        const defaultPrice = item.price !== undefined && item.price > 0 ? item.price : 20;
        return [...prev, { item, quantity: 1, unitPrice: defaultPrice }];
      }
    });
  };

  // Update quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(ci => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            if (newQty > ci.item.currentStock) {
              showToast(`⚠️ ไม่สามารถเพิ่มได้เกินสต็อกคงเหลือ (${ci.item.currentStock} ${ci.item.unit})`);
              return ci;
            }
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.item.id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('ต้องการล้างรายการในตะกร้าทั้งหมดหรือไม่?')) {
      setCart([]);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, cashReceived - totalAmount);
  }, [cashReceived, totalAmount]);

  // PromptPay QR payload
  const promptPayPayload = useMemo(() => {
    if (!promptPayId || totalAmount <= 0) return '';
    return generatePromptPayPayload(promptPayId, totalAmount);
  }, [promptPayId, totalAmount]);

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(totalAmount);
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  // Barcode scanned
  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    let code = decodedText.trim();
    if (code.includes('code=')) {
      const match = code.match(/[?&]code=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }

    const found = items.find(
      i => i.code.toLowerCase() === code.toLowerCase() || i.id === code
    );

    if (found) {
      addToCart(found);
      showToast(`🎯 เพิ่ม: ${found.name}`);
    } else {
      alert(`ไม่พบสินค้าที่มีรหัส "${code}" ในระบบ`);
    }
  };

  // Submit Sale & Create Receipt
  const handleConfirmSale = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && cashReceived < totalAmount) {
      setCheckoutError(`ยอดเงินที่รับมาน้อยกว่ายอดชำระ (ขาดอีก ${(totalAmount - cashReceived).toFixed(2)} บาท)`);
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const cashierName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'จนท. สหกรณ์';
      const cashierEmail = user?.email || '';

      const payload = {
        customerName: customerName.trim() || 'ผู้ปกครอง / นักเรียน',
        customerType,
        studentClass: customerType === 'STUDENT' ? studentClass : undefined,
        studentId: studentId.trim() || undefined,
        paymentMethod,
        items: cart.map(ci => ({
          itemId: ci.item.id,
          itemCode: ci.item.code,
          itemName: ci.item.name,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice
        })),
        discount,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : totalAmount,
        change: paymentMethod === 'CASH' ? changeAmount : 0,
        cashierName,
        cashierEmail
      };

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกการขาย');

      // Update local item stock
      setItems(prev =>
        prev.map(item => {
          const inCart = cart.find(ci => ci.item.id === item.id);
          if (inCart) {
            return { ...item, currentStock: item.currentStock - inCart.quantity };
          }
          return item;
        })
      );

      // Close checkout, reset cart, show receipt modal
      setIsCheckoutOpen(false);
      setCart([]);
      setDiscount(0);
      setCompletedReceipt(data.receipt);
      showToast(`🎉 ออกใบเสร็จ #${data.receipt.receiptNumber} สำเร็จ`);
    } catch (err: any) {
      setCheckoutError(err.message || 'ไม่สามารถบันทึกรายการขายได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* POS Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                จุดขายสินค้าและสหกรณ์โรงเรียน (School POS)
              </h1>
              <p className="text-[11px] text-slate-400">
                เลือกสินค้า คิดเงิน ออกใบเสร็จ A4 ตัดครึ่ง และหักสต็อกอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
          >
            <Scan className="w-4 h-4 text-blue-600" />
            <span>สแกนบาร์โค้ด</span>
          </button>

          <Link
            href="/finance"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <ReceiptIcon className="w-4 h-4 text-emerald-600" />
            <span>ดูใบเสร็จย้อนหลัง</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Catalog on Left (60%), Cart on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT: Item Catalog (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Search & Category Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า, รหัสบาร์โค้ด..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({items.length})
              </button>

              {categories.map(c => {
                const count = items.filter(i => i.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1 ${
                      selectedCategory === c.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs font-semibold">กำลังโหลดข้อมูลสินค้า...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              <p className="text-sm font-bold text-slate-600">ไม่พบสินค้า</p>
              <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredItems.map(item => {
                const isOut = item.currentStock <= 0;
                const price = item.price !== undefined && item.price > 0 ? item.price : 20;

                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={isOut}
                    className="bg-white border border-slate-200 hover:border-blue-400 disabled:opacity-50 disabled:hover:border-slate-200 p-3 rounded-2xl text-left flex flex-col justify-between transition shadow-2xs hover:shadow-md active:scale-98 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded truncate">
                          {item.code}
                        </span>
                        {isOut ? (
                          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 rounded">
                            หมด
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-500">
                            เหลือ {item.currentStock} {item.unit}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                        {item.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-blue-700">
                        ฿{price.toFixed(2)}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Cart & Customer Info (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Cart Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-xs">ตะกร้าสินค้า ({cart.length} รายการ)</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-red-400 transition"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            {/* Buyer Info Form */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  ประเภทผู้ซื้อ
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['STUDENT', 'PARENT', 'TEACHER', 'GENERAL'] as CustomerType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCustomerType(t)}
                      className={`py-1 rounded-lg text-[10px] font-bold border transition ${
                        customerType === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t === 'STUDENT' ? 'นักเรียน' : t === 'PARENT' ? 'ผู้ปกครอง' : t === 'TEACHER' ? 'ครู' : 'ทั่วไป'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    ชื่อผู้ซื้อ / นักเรียน
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="เช่น ด.ช. วิชัย หรือ ผู้ปกครอง"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {customerType === 'STUDENT' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      ระดับชั้น
                    </label>
                    <select
                      value={studentClass}
                      onChange={e => setStudentClass(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {SCHOOL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      เบอร์โทรศัพท์ (ไม่บังคับ)
                    </label>
                    <input
                      type="text"
                      placeholder="08x-xxx-xxxx"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-3.5 overflow-y-auto max-h-[300px] divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">ยังไม่มีสินค้าในตะกร้า</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    แตะที่รายการสินค้าทางซ้ายเพื่อเลือก
                  </p>
                </div>
              ) : (
                cart.map(ci => (
                  <div key={ci.item.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate leading-snug">
                        {ci.item.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        @{ci.unitPrice.toFixed(2)} บาท / {ci.item.unit}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(ci.item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-slate-800 text-xs">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(ci.item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price & Delete */}
                    <div className="text-right shrink-0 min-w-[65px]">
                      <span className="font-bold text-slate-900 block">
                        ฿{(ci.unitPrice * ci.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(ci.item.id)}
                        className="text-[10px] text-slate-400 hover:text-red-500"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations & Checkout Button */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>ยอดรวมสินค้า:</span>
                <span className="font-bold">฿{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>ส่วนลด (บาท):</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-20 text-right px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold"
                />
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>ยอดชำระสุทธิ:</span>
                <span className="text-lg text-blue-700">฿{totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition"
              >
                <Banknote className="w-4 h-4" />
                <span>ชำระเงิน (฿{totalAmount.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* CHECKOUT MODAL (Cash vs PromptPay QR) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">การชำระเงินและออกใบเสร็จ</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              
              {checkoutError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-2.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Total Summary */}
              <div className="text-center p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <span className="text-xs text-slate-500 font-medium">ยอดที่ต้องชำระ</span>
                <div className="text-3xl font-black text-blue-700 mt-0.5">
                  ฿{totalAmount.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {customerName} {customerType === 'STUDENT' && `(${studentClass})`}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลือกช่องทางชำระเงิน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>เงินสด (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PROMPTPAY')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'PROMPTPAY'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>PromptPay QR</span>
                  </button>
                </div>
              </div>

              {/* If CASH: Tender input & change */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      รับเงินสดมา (บาท)
                    </label>
                    <input
                      type="number"
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(Number(e.target.value) || 0)}
                      className="w-full text-center text-xl font-black py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[totalAmount, 100, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt)}
                        className="py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      >
                        {amt === totalAmount ? 'พอดี' : `฿${amt}`}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-600">เงินทอน:</span>
                    <span className={`text-base font-black ${changeAmount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      ฿{changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* If PROMPTPAY: Real Thai QR Code */}
              {paymentMethod === 'PROMPTPAY' && (
                <div className="space-y-2.5 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center text-xs">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-blue-900">
                    <span>PromptPay QR Code</span>
                    <button
                      onClick={() => setIsEditingPromptPay(!isEditingPromptPay)}
                      className="text-slate-400 hover:text-blue-600 p-1"
                      title="แก้ไขเลข PromptPay"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>

                  {isEditingPromptPay && (
                    <div className="flex gap-1 max-w-xs mx-auto">
                      <input
                        type="text"
                        value={promptPayId}
                        onChange={e => setPromptPayId(e.target.value)}
                        placeholder="เบอร์โทรศัพท์ หรือ เลขผู้เสียภาษี 13 หลัก"
                        className="flex-1 px-2 py-1 text-xs border rounded-lg bg-white font-mono"
                      />
                      <button
                        onClick={() => setIsEditingPromptPay(false)}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                      >
                        ตกลง
                      </button>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-blue-200 mx-auto">
                    {promptPayPayload ? (
                      <QRCodeSVG
                        value={promptPayPayload}
                        size={170}
                        level="M"
                        includeMargin={true}
                      />
                    ) : (
                      <div className="w-[170px] h-[170px] flex items-center justify-center text-slate-400">
                        ระบุเลข PromptPay
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    เปิดแอปธนาคาร สแกนจ่ายยอด <strong>฿{totalAmount.toFixed(2)} บาท</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    (บัญชีพร้อมเพย์: {promptPayId})
                  </p>
                </div>
              )}

              {/* Confirm Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSale}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {isSubmitting ? 'กำลังบันทึกและหักสต็อก...' : 'ยืนยันการรับเงิน & พิมพ์ใบเสร็จ'}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Receipt Modal after sale */}
      <ReceiptModal
        receipt={completedReceipt}
        isOpen={Boolean(completedReceipt)}
        onClose={() => setCompletedReceipt(null)}
      />

    </div>
  );
}
