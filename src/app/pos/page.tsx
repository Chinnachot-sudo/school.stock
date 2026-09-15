'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Item,
  Category,
  CustomerType,
  PaymentMethod,
  Receipt,
  Customer,
  ALL_IB_GRADES,
  Invoice,
  SCHOOL_BANK_INFO,
  ReturnReason,
  RETURN_REASON_LABELS
} from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import { generatePromptPayPayload, generateSchoolPromptPayPayload } from '@/lib/promptpay';
import ScannerModal from '@/components/ScannerModal';
import ReceiptModal from '@/components/ReceiptModal';
import InvoiceModal from '@/components/InvoiceModal';
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
  Building2,
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Receipt as ReceiptIcon,
  Store,
  Edit2,
  Users,
  X,
  FileText,
  Clock,
  RotateCcw,
  Copy,
  Printer,
  PauseCircle,
  PlayCircle,
  Star,
  Percent,
  DollarSign,
  Keyboard,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Tag
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  item: Item;
  quantity: number;
  unitPrice: number;
  note?: string;
}

interface DraftOrder {
  id: string;
  orderNumber: string;
  timestamp: string;
  customerName: string;
  customerType: CustomerType;
  items: CartItem[];
  discount: number;
  discountType: 'PERCENT' | 'FIXED';
  total: number;
}

const DEFAULT_PROMPTPAY_ID = process.env.NEXT_PUBLIC_DEFAULT_PROMPTPAY_ID || '0994000165';

export default function PosPage() {
  const { user } = useAuth();

  // Data states
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart & Order State
  const [orderNumber] = useState(() => `ORD-${Date.now().toString().slice(-5)}`);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerType, setCustomerType] = useState<CustomerType>('STUDENT');
  const [customerName, setCustomerName] = useState('Walk-in Customer / นักเรียน');
  const [studentClass, setStudentClass] = useState(ALL_IB_GRADES[3] || 'Grade 1 (PYP 1)');
  const [studentId, setStudentId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Discounts & Loyalty
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  // Held Drafts
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);

  // Payment Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cardRefNumber, setCardRefNumber] = useState('');
  const [cardBank, setCardBank] = useState('Bangkok Bank (BBL)');
  const [promptPayId, setPromptPayId] = useState(DEFAULT_PROMPTPAY_ID);
  const [qrMode, setQrMode] = useState<'OFFICIAL' | 'DYNAMIC'>('OFFICIAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Modals & Tools
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<Receipt | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Return & Refund Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSearchReceipt, setReturnSearchReceipt] = useState('');
  const [selectedReturnReceipt, setSelectedReturnReceipt] = useState<Receipt | null>(null);
  const [returnSelectedItems, setReturnSelectedItems] = useState<{ [itemId: string]: number }>({});
  const [returnReason, setReturnReason] = useState<ReturnReason>('DEFECTIVE');
  const [returnDetail, setReturnDetail] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Bill Adjust / History Modal
  const [isBillsModalOpen, setIsBillsModalOpen] = useState(false);
  const [voidingReceiptId, setVoidingReceiptId] = useState<string | null>(null);
  const [voidReasonInput, setVoidReasonInput] = useState('Customer request / Cancel');
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);

  // Drag & Drop State
  const [isDragOverCart, setIsDragOverCart] = useState(false);

  // 1. Fetch initial POS data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [itemsRes, custRes, receiptsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/customers'),
        fetch('/api/receipts')
      ]);

      const itemsData = await itemsRes.json();
      setItems(itemsData.items || []);
      setCategories(itemsData.categories || []);

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.customers || []);
      }

      if (receiptsRes.ok) {
        const recData = await receiptsRes.json();
        setRecentReceipts(recData.receipts || []);
      }

      // Load saved drafts from localStorage
      if (typeof window !== 'undefined') {
        const savedDrafts = localStorage.getItem('school_pos_drafts');
        if (savedDrafts) {
          try {
            setDrafts(JSON.parse(savedDrafts));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error fetching data for POS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard Shortcuts: '/' or F2 to search, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || e.key === 'F2') && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showCustomerDropdown) setShowCustomerDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCustomerDropdown]);

  // Save drafts helper
  const saveDraftsToStorage = (updatedDrafts: DraftOrder[]) => {
    setDrafts(updatedDrafts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('school_pos_drafts', JSON.stringify(updatedDrafts));
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q));
      const matchStock = onlyInStock ? item.currentStock > 0 : true;
      return matchCat && matchSearch && matchStock;
    });
  }, [items, selectedCategory, searchQuery, onlyInStock]);

  // Handle instant Enter on search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      // Try exact barcode/SKU match first
      const exactMatch = items.find(i => i.code.toLowerCase() === q || i.id.toLowerCase() === q);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
        showToast(`Added: ${exactMatch.name}`);
        return;
      }
      // If exactly 1 item in filtered results, add it!
      if (filteredItems.length === 1) {
        addToCart(filteredItems[0]);
        setSearchQuery('');
        showToast(`Added: ${filteredItems[0].name}`);
      }
    }
  };

  // Customers filtered
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.nickname && c.nickname.toLowerCase().includes(q)) ||
        (c.studentId && c.studentId.toLowerCase().includes(q)) ||
        (c.grade && c.grade.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.nickname ? `${c.name} (${c.nickname})` : c.name);
    setCustomerType(c.type || 'STUDENT');
    if (c.grade) setStudentClass(c.grade);
    if (c.studentId) setStudentId(c.studentId);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
    showToast(`Selected customer: ${c.name}`);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('Walk-in Customer / นักเรียน');
    setStudentId('');
    setUseLoyaltyPoints(false);
  };

  // Cart operations
  const addToCart = (item: Item, qtyToAdd = 1) => {
    if (item.currentStock <= 0) {
      showToast(`Item "${item.name}" is out of stock`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) {
        const newQty = existing.quantity + qtyToAdd;
        if (newQty > item.currentStock) {
          showToast(`Cannot exceed stock (${item.currentStock} ${item.unit})`);
          return prev;
        }
        return prev.map(ci => (ci.item.id === item.id ? { ...ci, quantity: newQty } : ci));
      } else {
        const defaultPrice = item.price !== undefined && item.price > 0 ? item.price : 20;
        return [...prev, { item, quantity: Math.min(qtyToAdd, item.currentStock), unitPrice: defaultPrice }];
      }
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(ci => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            if (newQty > ci.item.currentStock) {
              showToast(`Only ${ci.item.currentStock} ${ci.item.unit} available`);
              return ci;
            }
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Direct quantity input
  const handleDirectQtyChange = (itemId: string, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;

    setCart(prev =>
      prev.map(ci => {
        if (ci.item.id === itemId) {
          if (num <= 0) return { ...ci, quantity: 1 };
          if (num > ci.item.currentStock) {
            showToast(`Max available stock is ${ci.item.currentStock} ${ci.item.unit}`);
            return { ...ci, quantity: ci.item.currentStock };
          }
          return { ...ci, quantity: num };
        }
        return ci;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.item.id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear all items from cart?')) {
      setCart([]);
      setDiscountValue(0);
      setUseLoyaltyPoints(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: Item) => {
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDropToCart = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCart(false);
    const itemId = e.dataTransfer.getData('text/plain');
    const targetItem = items.find(i => i.id === itemId);
    if (targetItem) {
      addToCart(targetItem);
      showToast(`Added: ${targetItem.name}`);
    }
  };

  // Drafts (Hold / Resume)
  const handleHoldDraft = () => {
    if (cart.length === 0) {
      showToast('Cart is empty, cannot hold bill');
      return;
    }
    const newDraft: DraftOrder = {
      id: `draft-${Date.now()}`,
      orderNumber,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      customerName,
      customerType,
      items: [...cart],
      discount: discountValue,
      discountType,
      total: totalAmount
    };
    saveDraftsToStorage([newDraft, ...drafts]);
    setCart([]);
    setDiscountValue(0);
    setUseLoyaltyPoints(false);
    showToast(`Order ${orderNumber} held as draft`);
  };

  const handleResumeDraft = (draft: DraftOrder) => {
    setCart(draft.items);
    setCustomerName(draft.customerName);
    setCustomerType(draft.customerType);
    setDiscountValue(draft.discount);
    setDiscountType(draft.discountType);
    saveDraftsToStorage(drafts.filter(d => d.id !== draft.id));
    setShowDraftsModal(false);
    showToast(`Resumed draft for ${draft.customerName}`);
  };

  const handleDeleteDraft = (draftId: string) => {
    saveDraftsToStorage(drafts.filter(d => d.id !== draftId));
    showToast('Draft removed');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);
  }, [cart]);

  // Discount calculation
  const calculatedDiscount = useMemo(() => {
    let disc = 0;
    if (discountType === 'PERCENT') {
      disc = (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    } else {
      disc = Math.min(subtotal, Math.max(0, discountValue));
    }
    return Math.round(disc * 100) / 100;
  }, [subtotal, discountType, discountValue]);

  // Loyalty points discount (10 points = ฿1)
  const loyaltyDiscount = useMemo(() => {
    if (!useLoyaltyPoints || !selectedCustomer || !selectedCustomer.points) return 0;
    const maxRedeemableDiscount = Math.floor(selectedCustomer.points / 10);
    return Math.min(maxRedeemableDiscount, Math.max(0, subtotal - calculatedDiscount));
  }, [useLoyaltyPoints, selectedCustomer, subtotal, calculatedDiscount]);

  const totalDiscount = useMemo(() => {
    return calculatedDiscount + loyaltyDiscount;
  }, [calculatedDiscount, loyaltyDiscount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount);
  }, [subtotal, totalDiscount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, cashReceived - totalAmount);
  }, [cashReceived, totalAmount]);

  // QR Payloads
  const schoolDynamicQrPayload = useMemo(() => {
    if (totalAmount <= 0) return '';
    return generateSchoolPromptPayPayload(totalAmount);
  }, [totalAmount]);

  const customPromptPayPayload = useMemo(() => {
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

  // Submit Sale & Create Receipt
  const handleConfirmSale = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && cashReceived < totalAmount) {
      setCheckoutError(`Tendered amount is less than total due (remaining: ฿${(totalAmount - cashReceived).toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const cashierName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'School Store Staff';
      const cashierEmail = user?.email || '';

      const payload = {
        customerName: customerName.trim() || 'Walk-in Customer / นักเรียน',
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
        discount: totalDiscount,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : totalAmount,
        change: paymentMethod === 'CASH' ? changeAmount : 0,
        cashierName,
        cashierEmail,
        note: `Payment: ${paymentMethod}${paymentMethod === 'CARD' ? ` (Ref: ${cardRefNumber || 'N/A'}, ${cardBank})` : ''}${useLoyaltyPoints ? ` | Loyalty pts redeemed: ฿${loyaltyDiscount}` : ''}`
      };

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error recording sale transaction');

      // Update local item stock
      setItems(prev =>
        prev.map(item => {
          const inCart = cart.find(ci => ci.item.id === item.id);
          if (inCart) {
            return { ...item, currentStock: Math.max(0, item.currentStock - inCart.quantity) };
          }
          return item;
        })
      );

      // Add to recent receipts list
      if (data.receipt) {
        setRecentReceipts(prev => [data.receipt, ...prev]);
      }

      // Close checkout, reset cart, show receipt modal
      setIsCheckoutOpen(false);
      setCart([]);
      setDiscountValue(0);
      setUseLoyaltyPoints(false);
      setCompletedReceipt(data.receipt);
      showToast(`Issued Receipt #${data.receipt.receiptNumber} successfully`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to record sale transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert cart to Half-A4 Invoice
  const handleCreateInvoiceFromCart = async () => {
    if (cart.length === 0) return;
    setIsCreatingInvoice(true);
    setCheckoutError(null);

    try {
      const creatorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'School Store Staff';
      const creatorEmail = user?.email || '';

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Parent / Student',
          customerType,
          studentClass: customerType === 'STUDENT' ? studentClass : undefined,
          studentId: studentId.trim() || undefined,
          parentName: selectedCustomer?.parentName || undefined,
          phone: selectedCustomer?.phone || (customerType !== 'STUDENT' ? studentId : undefined),
          items: cart.map(ci => ({
            itemId: ci.item.id,
            itemCode: ci.item.code,
            itemName: ci.item.name,
            quantity: ci.quantity,
            unitPrice: ci.unitPrice,
            unit: ci.item.unit,
            totalPrice: ci.quantity * ci.unitPrice
          })),
          discount: totalDiscount,
          creatorName,
          creatorEmail,
          note: 'Issued invoice from School Store (POS)'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setIsCheckoutOpen(false);
      setCart([]);
      setDiscountValue(0);
      setUseLoyaltyPoints(false);
      setCompletedInvoice(data.invoice);
      showToast(`Issued Invoice #${data.invoice.invoiceNumber} successfully`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to issue invoice');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Duplicate past bill into cart
  const handleDuplicateBill = (receipt: Receipt) => {
    const newCartItems: CartItem[] = [];
    for (const rItem of receipt.items) {
      const matched = items.find(i => i.id === rItem.itemId || i.code === rItem.itemCode);
      if (matched) {
        newCartItems.push({
          item: matched,
          quantity: rItem.quantity,
          unitPrice: rItem.unitPrice
        });
      } else {
        newCartItems.push({
          item: {
            id: rItem.itemId,
            code: rItem.itemCode,
            name: rItem.itemName,
            categoryId: 'cat-stationery',
            currentStock: 99,
            minStock: 5,
            unit: rItem.unit || 'pcs',
            location: 'School Store',
            price: rItem.unitPrice,
            updatedAt: new Date().toISOString()
          },
          quantity: rItem.quantity,
          unitPrice: rItem.unitPrice
        });
      }
    }

    setCart(newCartItems);
    setCustomerName(receipt.customerName);
    setCustomerType(receipt.customerType);
    if (receipt.studentClass) setStudentClass(receipt.studentClass);
    if (receipt.studentId) setStudentId(receipt.studentId);
    setDiscountValue(receipt.discount || 0);
    setDiscountType('FIXED');
    setIsBillsModalOpen(false);
    showToast(`Duplicated items from Receipt #${receipt.receiptNumber} into cart`);
  };

  // Void / Cancel Bill
  const handleConfirmVoid = async (receiptId: string) => {
    if (!confirm('Are you sure you want to cancel and void this receipt? Items will be restocked.')) return;
    setIsSubmittingVoid(true);
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReasonInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to void receipt');

      setRecentReceipts(prev =>
        prev.map(r => (r.id === receiptId ? { ...r, status: 'VOIDED', voidReason: voidReasonInput } : r))
      );
      setVoidingReceiptId(null);
      showToast(data.message || 'Receipt voided successfully');
      fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Error voiding receipt');
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  // Return & Refund Submit
  const handleConfirmReturn = async () => {
    if (!selectedReturnReceipt) return;
    const itemsToReturn = Object.entries(returnSelectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const orig = selectedReturnReceipt.items.find(i => i.itemId === itemId);
        return {
          itemId,
          itemCode: orig?.itemCode || '',
          itemName: orig?.itemName || '',
          quantity: qty,
          unitPrice: orig?.unitPrice || 0,
          refundAmount: (orig?.unitPrice || 0) * qty
        };
      });

    if (itemsToReturn.length === 0) {
      alert('Please select at least one item and quantity to return');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const res = await fetch('/api/receipts/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: selectedReturnReceipt.id,
          items: itemsToReturn,
          reason: returnReason,
          reasonDetail: returnDetail,
          cashierName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Store Cashier'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process return');

      showToast(data.message || 'Return completed and inventory restocked!');
      setIsReturnModalOpen(false);
      setSelectedReturnReceipt(null);
      setReturnSelectedItems({});
      fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Error processing return');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Barcode scanned
  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    let code = decodedText.trim();
    if (code.includes('code=')) {
      const match = code.match(/[?&]code=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }

    const found = items.find(i => i.code.toLowerCase() === code.toLowerCase() || i.id === code);
    if (found) {
      addToCart(found);
      showToast(`Scanned & Added: ${found.name}`);
    } else {
      alert(`Item with code "${code}" not found in system`);
    }
  };

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP SECTION: Recent Orders & Quick Status Bar (Matching Image.png)        */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Point of Sale & School Store
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#0B6B4F] text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  Live Terminal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Item checkout, loyalty points, multi-payment, receipt printing, and stock sync
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 border border-slate-200"
            >
              <Scan className="w-4 h-4 text-[#0B6B4F]" />
              <span>Scan Barcode</span>
            </button>

            {drafts.length > 0 && (
              <button
                onClick={() => setShowDraftsModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200 relative"
              >
                <PauseCircle className="w-4 h-4 text-amber-600" />
                <span>Held Bills ({drafts.length})</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute -top-0.5 -right-0.5" />
              </button>
            )}

            <button
              onClick={() => setIsBillsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-slate-200"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Adjust Bills</span>
            </button>

            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition border border-rose-200"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Returns & Refunds</span>
            </button>
          </div>
        </div>

        {/* Recent Orders Horizontal Strip */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Recent Completed Orders ({recentReceipts.length})
            </span>
            <button
              onClick={() => setIsBillsModalOpen(true)}
              className="text-[11px] font-bold text-[#0B6B4F] hover:underline flex items-center gap-1"
            >
              View All History <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {recentReceipts.slice(0, 5).map(r => (
              <div
                key={r.id}
                className="shrink-0 w-52 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-700 text-[11px]">{r.receiptNumber}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      r.status === 'VOIDED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {r.status === 'VOIDED' ? 'Voided' : 'Completed'}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 truncate">{r.customerName}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="font-black text-slate-900">฿{r.totalAmount.toLocaleString()}</span>
                  <button
                    onClick={() => handleDuplicateBill(r)}
                    className="flex items-center gap-1 text-[#0B6B4F] hover:underline font-bold text-[10px]"
                    title="Duplicate items to cart"
                  >
                    <Copy className="w-3 h-3" /> Re-Order
                  </button>
                </div>
              </div>
            ))}
            {recentReceipts.length === 0 && (
              <div className="text-xs text-slate-400 italic py-1">No completed transactions recorded yet today.</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN DASHBOARD (Matching Reference Mockup)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Catalog, Categories & Search (7 Cols)                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Menu Categories Bar (Matching reference image) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0B6B4F]" />
                <span className="text-xs font-bold text-slate-700">Categories</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="rounded text-[#0B6B4F] focus:ring-[#0B6B4F]"
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Horizontal Category Pill Slider */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#0B6B4F] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>All Items</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'ALL' ? 'bg-white/20' : 'bg-slate-200'}`}>
                  {items.length}
                </span>
              </button>

              {categories.map(cat => {
                const count = items.filter(i => i.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-[#0B6B4F] text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fast Search Bar (Name, SKU, Barcode) + Keyboard Help */}
            <div className="relative flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Quick search by Name, SKU, Barcode (Press '/' or Enter to add)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200 shrink-0">
                <Keyboard className="w-3 h-3 text-slate-400" />
                <span>/ to focus</span>
              </div>
            </div>
          </div>

          {/* Product Cards Grid (Matching reference mockup style) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
            {filteredItems.map(item => {
              const inCartItem = cart.find(ci => ci.item.id === item.id);
              const isOutOfStock = item.currentStock <= 0;

              return (
                <div
                  key={item.id}
                  draggable={!isOutOfStock}
                  onDragStart={e => handleDragStart(e, item)}
                  onClick={() => !isOutOfStock && addToCart(item)}
                  className={`group relative bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all duration-150 select-none cursor-pointer ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                      : inCartItem
                      ? 'border-[#0B6B4F] shadow-md ring-1 ring-[#0B6B4F]/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Top Image (120x120 modern ratio) */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Store className="w-8 h-8 stroke-1" />
                        <span className="text-[10px] font-medium mt-1">No image</span>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 left-2">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-xs">
                          Out of stock
                        </span>
                      ) : item.currentStock <= (item.minStock || 5) ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                          Low: {item.currentStock} {item.unit}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur text-slate-700 text-[10px] font-bold shadow-xs border border-slate-200/50">
                          {item.currentStock} {item.unit}
                        </span>
                      )}
                    </div>

                    {/* Cart Quantity Badge (if in cart) */}
                    {inCartItem && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0B6B4F] text-white text-xs font-black flex items-center justify-center shadow-md">
                        {inCartItem.quantity}
                      </div>
                    )}
                  </div>

                  {/* Title & SKU */}
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-mono text-slate-400 truncate">{item.code}</div>
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#0B6B4F] transition">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price & Add / Adjuster Buttons */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-none">Price</span>
                      <span className="text-sm font-black text-slate-900">
                        ฿{(item.price || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Quick Stepper on Card */}
                    {inCartItem ? (
                      <div
                        className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-slate-800">
                          {inCartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={inCartItem.quantity >= item.currentStock}
                          className="w-5 h-5 rounded bg-[#0B6B4F] hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        disabled={isOutOfStock}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#0B6B4F] text-[#0B6B4F] hover:text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
                <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">No matching items found</p>
                <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search terms or category</p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Order Cart, Customer & Checkout (5 Cols)                  */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOverCart(true);
            }}
            onDragLeave={() => setIsDragOverCart(false)}
            onDrop={handleDropToCart}
            className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition ${
              isDragOverCart
                ? 'border-dashed border-2 border-[#0B6B4F] bg-emerald-50/20'
                : 'border-slate-200/80'
            }`}
          >
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">{orderNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date().toLocaleDateString('th-TH', { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleHoldDraft}
                    disabled={cart.length === 0}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition disabled:opacity-40"
                    title="Hold Bill (พักบิล)"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition disabled:opacity-40"
                    title="Clear Cart (ล้างตะกร้า)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Customer Type Tabs */}
              <div className="grid grid-cols-4 gap-1 py-3 border-b border-slate-100">
                {(['STUDENT', 'PARENT', 'TEACHER', 'GENERAL'] as CustomerType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setCustomerType(type)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition ${
                      customerType === type
                        ? 'bg-[#0B6B4F] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {type === 'STUDENT'
                      ? 'Student'
                      : type === 'PARENT'
                      ? 'Parent'
                      : type === 'TEACHER'
                      ? 'Staff'
                      : 'Visitor'}
                  </button>
                ))}
              </div>

              {/* Customer Selector & Loyalty Points */}
              <div className="py-3 border-b border-slate-100 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0B6B4F]" />
                    <span>Customer Details (เลือกลูกค้า)</span>
                  </label>
                  {selectedCustomer && (
                    <button
                      onClick={handleClearCustomer}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      Clear Customer
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name, nickname, or student ID..."
                    value={customerSearch || (selectedCustomer ? customerName : '')}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white"
                  />

                  {/* Autocomplete Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                        Select Customer ({filteredCustomers.length})
                      </div>
                      {filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <div className="font-bold text-slate-800">
                              {c.name} {c.nickname ? `(${c.nickname})` : ''}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {c.studentId ? `ID: ${c.studentId}` : ''} {c.grade ? `• ${c.grade}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              <span>{c.points || 120} pts</span>
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="p-3 text-xs text-slate-400 text-center italic">
                          No registered customer found. Using walk-in details.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Loyalty Points Redemption Badge */}
                {selectedCustomer && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Star className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-900">
                          {selectedCustomer.points || 120} Loyalty Points available
                        </div>
                        <div className="text-[10px] text-amber-700">
                          Redeem up to ฿{Math.floor((selectedCustomer.points || 120) / 10)} discount (10 pts = ฿1)
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        useLoyaltyPoints
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {useLoyaltyPoints ? 'Points Applied ✓' : 'Use Points'}
                    </button>
                  </div>
                )}
              </div>

              {/* Ordered Items List */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Ordered Items ({cart.reduce((sum, ci) => sum + ci.quantity, 0)})
                  </span>
                  <span className="text-[11px] text-slate-400">Drag items to add</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  {cart.map(ci => (
                    <div
                      key={ci.item.id}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex items-center gap-3 transition"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {ci.item.imageUrl ? (
                          <img src={ci.item.imageUrl} alt={ci.item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{ci.item.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ฿{ci.unitPrice.toLocaleString()} / {ci.item.unit}
                        </div>
                      </div>

                      {/* Direct Numeric Input Quantity Stepper */}
                      <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(ci.item.id, -1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={ci.item.currentStock}
                          value={ci.quantity}
                          onChange={e => handleDirectQtyChange(ci.item.id, e.target.value)}
                          className="w-10 text-center text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B6B4F] rounded py-0.5"
                        />
                        <button
                          onClick={() => updateQuantity(ci.item.id, 1)}
                          disabled={ci.quantity >= ci.item.currentStock}
                          className="w-6 h-6 rounded bg-[#0B6B4F] hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="text-right shrink-0 min-w-[56px]">
                        <div className="text-xs font-black text-slate-900">
                          ฿{(ci.unitPrice * ci.quantity).toLocaleString()}
                        </div>
                        <button
                          onClick={() => removeFromCart(ci.item.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 mt-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                      <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click or drag items to start an order</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary & Action Grid (Bottom) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              
              {/* Discounts (% or ฿) */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <Percent className="w-3.5 h-3.5 text-[#0B6B4F]" />
                  <span>Discount (ส่วนลด)</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Mode Toggle */}
                  <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                    <button
                      onClick={() => setDiscountType('FIXED')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        discountType === 'FIXED' ? 'bg-[#0B6B4F] text-white' : 'text-slate-600'
                      }`}
                    >
                      ฿ บาท
                    </button>
                    <button
                      onClick={() => setDiscountType('PERCENT')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        discountType === 'PERCENT' ? 'bg-[#0B6B4F] text-white' : 'text-slate-600'
                      }`}
                    >
                      %
                    </button>
                  </div>

                  {/* Discount Input */}
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'PERCENT' ? 100 : subtotal}
                    value={discountValue || ''}
                    placeholder="0"
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs text-right bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
                  />
                </div>
              </div>

              {/* Price Calculations */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal (ยอดรวมสินค้า)</span>
                  <span className="font-semibold text-slate-800">฿{subtotal.toLocaleString()}</span>
                </div>

                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount ({discountType === 'PERCENT' ? `${discountValue}%` : '฿'})</span>
                    <span>-฿{calculatedDiscount.toLocaleString()}</span>
                  </div>
                )}

                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Loyalty Points Discount</span>
                    <span>-฿{loyaltyDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="text-sm font-black text-slate-900">Total Due (ยอดสุทธิ)</span>
                  <span className="text-2xl font-black text-[#0B6B4F]">
                    ฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className="w-full py-3.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-black text-sm transition shadow-lg shadow-emerald-950/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                <span>Pay / ชำระเงิน ฿{totalAmount.toLocaleString()}</span>
              </button>

              {/* Sub-Actions Grid (Matching reference mockup buttons) */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleCreateInvoiceFromCart}
                  disabled={cart.length === 0 || isCreatingInvoice}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoice</span>
                </button>

                <button
                  onClick={handleHoldDraft}
                  disabled={cart.length === 0}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Draft</span>
                </button>

                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={() => setIsReturnModalOpen(true)}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Return</span>
                </button>

                <button
                  onClick={() => setIsBillsModalOpen(true)}
                  className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ReceiptIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transactions & Adjust Bills</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CHECKOUT & PAYMENT MODAL (Multi-Payment: Cash, Card, QR, Transfer)     */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Payment & Settlement</h3>
                <p className="text-xs text-slate-300">Complete transaction for Order {orderNumber}</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Total Banner */}
              <div className="bg-[#0B6B4F]/10 border border-[#0B6B4F]/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600 block">Total Amount to Pay</span>
                  <span className="text-2xl font-black text-[#0B6B4F]">฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Customer: <strong className="text-slate-800">{customerName}</strong></div>
                  <div>Items: {cart.reduce((s, i) => s + i.quantity, 0)} pcs</div>
                </div>
              </div>

              {/* Payment Methods Tabs (Cash, Card, QR, Transfer) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Payment Method (วิธีชำระเงิน)</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                      paymentMethod === 'CASH'
                        ? 'border-[#0B6B4F] bg-emerald-50 text-[#0B6B4F] ring-2 ring-[#0B6B4F]/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash (เงินสด)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                      paymentMethod === 'CARD'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Card (บัตร)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('PROMPTPAY')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                      paymentMethod === 'PROMPTPAY'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>PromptPay</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>Bank (โอน)</span>
                  </button>
                </div>
              </div>

              {/* CASH PAYMENT UI */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cash Received (รับเงินสดมา)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">฿</span>
                      <input
                        type="number"
                        min={totalAmount}
                        value={cashReceived || ''}
                        onChange={e => setCashReceived(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 text-sm font-black text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setCashReceived(totalAmount)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                    >
                      Exact (฿{totalAmount})
                    </button>
                    {[20, 50, 100, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCashReceived(amt)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100"
                      >
                        ฿{amt}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-600">Change (เงินทอน):</span>
                    <span className="text-lg font-black text-emerald-700">
                      ฿{changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* CREDIT / DEBIT CARD UI */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-2 text-xs text-blue-900 font-bold">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Credit / Debit Card Processing (เครื่องรูดบัตร EDC)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Terminal Provider</label>
                      <select
                        value={cardBank}
                        onChange={e => setCardBank(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl"
                      >
                        <option>Bangkok Bank (BBL)</option>
                        <option>Kasikorn Bank (KBank)</option>
                        <option>SCB EDC</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Approval Code / Ref #</label>
                      <input
                        type="text"
                        placeholder="e.g. APP-89421"
                        value={cardRefNumber}
                        onChange={e => setCardRefNumber(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Process card on EDC terminal for <strong>฿{totalAmount.toLocaleString()}</strong> and enter reference code.
                  </p>
                </div>
              )}

              {/* PROMPTPAY QR UI */}
              {paymentMethod === 'PROMPTPAY' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div className="flex justify-center mb-1">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <QRCodeSVG value={schoolDynamicQrPayload || customPromptPayPayload} size={150} />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Scan PromptPay to Pay ฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PromptPay: {SCHOOL_BANK_INFO.accountName} ({SCHOOL_BANK_INFO.bankName})
                  </div>
                </div>
              )}

              {/* BANK TRANSFER UI */}
              {paymentMethod === 'TRANSFER' && (
                <div className="space-y-2.5 bg-purple-50/50 p-4 rounded-2xl border border-purple-200 text-xs">
                  <div className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <span>School Bank Account for Transfer</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1">
                    <div>Bank: <strong>{SCHOOL_BANK_INFO.bankName}</strong></div>
                    <div>Account Name: <strong>{SCHOOL_BANK_INFO.accountName}</strong></div>
                    <div>Bill Payment Ref1: <strong>{SCHOOL_BANK_INFO.ref1}</strong></div>
                    <div>Bill Payment Ref2: <strong>{SCHOOL_BANK_INFO.ref3}</strong></div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSale}
                  className="w-2/3 py-3 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Processing Sale...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Print Receipt (ออกใบเสร็จ)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RETURN & REFUND MODAL (เลือก, คอนเฟิร์ม, บันทึกเหตุผล)                 */}
      {/* ========================================================================= */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-300" />
                  <span>Return & Refund Item (คืนสินค้าและคืนสต็อก)</span>
                </h3>
                <p className="text-xs text-rose-200">Select receipt, choose items to return, and restock to inventory</p>
              </div>
              <button
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setSelectedReturnReceipt(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Receipt Search / Picker */}
              {!selectedReturnReceipt ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    Find Sale Receipt (ค้นหาเลขที่ใบเสร็จ)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter receipt number (e.g. RC2609-0001)..."
                      value={returnSearchReceipt}
                      onChange={e => setReturnSearchReceipt(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Recent Completed Receipts:</div>
                    {recentReceipts
                      .filter(r => r.status === 'COMPLETED')
                      .filter(r => !returnSearchReceipt || r.receiptNumber.toLowerCase().includes(returnSearchReceipt.toLowerCase()))
                      .map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedReturnReceipt(r);
                            const initialSelect: { [key: string]: number } = {};
                            r.items.forEach(it => {
                              initialSelect[it.itemId] = it.quantity;
                            });
                            setReturnSelectedItems(initialSelect);
                          }}
                          className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{r.receiptNumber}</div>
                            <div className="text-slate-500 text-[11px]">{r.customerName} • {r.items.length} items</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">฿{r.totalAmount.toLocaleString()}</div>
                            <span className="text-[10px] text-rose-600 font-bold">Select &rarr;</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* Item Selection & Reason */
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Selected Receipt:</span>{' '}
                      <strong className="text-slate-900">{selectedReturnReceipt.receiptNumber}</strong>
                      <div className="text-[11px] text-slate-500">Customer: {selectedReturnReceipt.customerName}</div>
                    </div>
                    <button
                      onClick={() => setSelectedReturnReceipt(null)}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Change Receipt
                    </button>
                  </div>

                  {/* Choose Items */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Select Items & Quantities to Return:</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedReturnReceipt.items.map(it => {
                        const returnQty = returnSelectedItems[it.itemId] || 0;
                        return (
                          <div
                            key={it.itemId}
                            className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-bold text-slate-800 truncate">{it.itemName}</div>
                              <div className="text-[11px] text-slate-500">
                                Purchased: {it.quantity} {it.unit} @ ฿{it.unitPrice}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600">Return Qty:</span>
                              <input
                                type="number"
                                min="0"
                                max={it.quantity}
                                value={returnQty}
                                onChange={e => {
                                  const q = Math.max(0, Math.min(it.quantity, parseInt(e.target.value, 10) || 0));
                                  setReturnSelectedItems(prev => ({ ...prev, [it.itemId]: q }));
                                }}
                                className="w-14 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Return Reason Dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Return Reason (เหตุผลการคืน)</label>
                      <select
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value as ReturnReason)}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        {Object.entries(RETURN_REASON_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Remark / Detail (หมายเหตุ)</label>
                      <input
                        type="text"
                        placeholder="Specific condition or note..."
                        value={returnDetail}
                        onChange={e => setReturnDetail(e.target.value)}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedReturnReceipt(null)}
                      className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100"
                    >
                      Back
                    </button>
                    <button
                      disabled={isSubmittingReturn}
                      onClick={handleConfirmReturn}
                      className="w-2/3 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/20 disabled:opacity-50"
                    >
                      {isSubmittingReturn ? 'Processing...' : 'Confirm Return & Restock Inventory'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BILL ADJUSTMENT MODAL (สร้างสำเนา, แก้ไข, ยกเลิกบิล)                   */}
      {/* ========================================================================= */}
      {isBillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span>Adjust Bills & Sale Transactions</span>
                </h3>
                <p className="text-xs text-slate-300">Duplicate, edit, or void transactions with inventory sync</p>
              </div>
              <button
                onClick={() => setIsBillsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {recentReceipts.map(receipt => (
                  <div
                    key={receipt.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-sm">{receipt.receiptNumber}</span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          {new Date(receipt.createdAt).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          receipt.status === 'VOIDED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {receipt.status === 'VOIDED' ? 'Voided / Cancelled' : 'Active / Completed'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div>
                        Customer: <strong className="text-slate-800">{receipt.customerName}</strong> ({receipt.customerType})
                      </div>
                      <div className="font-black text-slate-900 text-sm">
                        ฿{receipt.totalAmount.toLocaleString()}
                      </div>
                    </div>

                    {/* Action Bar for this Bill */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-end gap-2 text-xs">
                      {/* Duplicate to Cart */}
                      <button
                        onClick={() => handleDuplicateBill(receipt)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4F] font-bold flex items-center gap-1 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>สร้างสำเนา (Duplicate)</span>
                      </button>

                      {/* Reprint */}
                      <button
                        onClick={() => {
                          setCompletedReceipt(receipt);
                          setIsBillsModalOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>พิมพ์ซ้ำ</span>
                      </button>

                      {/* Void / Cancel */}
                      {receipt.status !== 'VOIDED' && (
                        <button
                          onClick={() => handleConfirmVoid(receipt.id)}
                          disabled={isSubmittingVoid}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ยกเลิกบิล (Void)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {recentReceipts.length === 0 && (
                  <div className="py-12 text-center text-slate-400 italic">No receipts recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HELD BILLS (DRAFTS) MODAL                                              */}
      {/* ========================================================================= */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-300" />
                <span>Held Bills / Draft Orders (บิลพัก)</span>
              </h3>
              <button
                onClick={() => setShowDraftsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{draft.orderNumber} • {draft.customerName}</div>
                    <div className="text-[11px] text-slate-500">
                      {draft.items.length} items • Held at {draft.timestamp}
                    </div>
                    <div className="font-black text-amber-900 mt-1">฿{draft.total.toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResumeDraft(draft)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {drafts.length === 0 && (
                <div className="py-8 text-center text-slate-400 italic">No held draft orders.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* External Scanner, Receipt & Invoice Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        onScanSuccess={handleScanSuccess}
      />

      <ReceiptModal
        receipt={completedReceipt}
        isOpen={Boolean(completedReceipt)}
        onClose={() => setCompletedReceipt(null)}
      />

      <InvoiceModal
        invoice={completedInvoice}
        isOpen={Boolean(completedInvoice)}
        onClose={() => setCompletedInvoice(null)}
      />
    </div>
  );
}
