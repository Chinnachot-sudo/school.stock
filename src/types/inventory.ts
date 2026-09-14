export type TransactionType = 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'VOID_SALE';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'INVENTORY_MANAGER' | 'TEACHER';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRoleRecord {
  email: string;
  role: UserRole;
  name?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  INVENTORY_MANAGER: 'Admin',
  TEACHER: 'Teacher / Staff'
};

// Whitelist mapping for school accounts fallback
export const DEFAULT_ROLE_MAP: Record<string, UserRole> = {
  'chinnachot@roong-aroon.ac.th': 'SUPER_ADMIN',
  'superadmin': 'SUPER_ADMIN',
  'admin': 'ADMIN',
  'chinnachot': 'SUPER_ADMIN',
  'artima@roong-aroon.ac.th': 'ADMIN',
  'pakapol@roong-aroon.ac.th': 'ADMIN',
  'manusnan@roong-aroon.ac.th': 'ADMIN',
  'pattawadee.k@roong-aroon.ac.th': 'ADMIN'
};

export function getUserRole(emailOrRole?: string | null): UserRole {
  if (!emailOrRole) return 'TEACHER';
  const clean = emailOrRole.toLowerCase().trim();
  if (clean === 'super_admin' || clean === 'superadmin') return 'SUPER_ADMIN';
  if (clean === 'admin' || clean === 'inventory_manager') return 'ADMIN';
  if (clean === 'teacher' || clean === 'staff') return 'TEACHER';
  return DEFAULT_ROLE_MAP[clean] || 'TEACHER';
}

export interface Item {
  id: string;
  code: string; // Barcode or QR Code string (e.g. "SK-001", "8850029012345")
  name: string; // e.g. "Double A Copier Paper 80gsm (A4)"
  categoryId: string; // e.g. "cat-stationery"
  currentStock: number;
  minStock: number; // Safety stock alert threshold
  unit: string; // e.g. "Ream", "Pcs", "Box", "Pack", "Bottle", "Set"
  location: string; // e.g. "Cabinet A Fl.2", "Math Department Room"
  price?: number; // Selling price (THB) e.g. 25, 250
  cost?: number; // Cost price (THB) e.g. 18, 190
  isForSale?: boolean; // For school store / POS sale
  note?: string;
  isBorrowable?: boolean; // For equipment like projector, presenter clicker
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  itemCount?: number;
}

export interface Department {
  id: string;
  name: string;
}

// IB Curriculum Structure & Constants
export type IBProgramme = 'PYP' | 'MYP' | 'DP' | 'CP' | 'STAFF' | 'GENERAL';

export const IB_PROGRAMMES: Record<IBProgramme, { name: string; label: string; grades: string[] }> = {
  PYP: {
    name: 'Primary Years Programme',
    label: 'PYP (Early Years - Primary)',
    grades: [
      'EY1 (Early Years 1)',
      'EY2 (Early Years 2)',
      'EY3 (Early Years 3)',
      'Grade 1 (PYP 1)',
      'Grade 2 (PYP 2)',
      'Grade 3 (PYP 3)',
      'Grade 4 (PYP 4)',
      'Grade 5 (PYP 5)'
    ]
  },
  MYP: {
    name: 'Middle Years Programme',
    label: 'MYP (Middle Years)',
    grades: [
      'Grade 6 (MYP 1)',
      'Grade 7 (MYP 2)',
      'Grade 8 (MYP 3)',
      'Grade 9 (MYP 4)',
      'Grade 10 (MYP 5)'
    ]
  },
  DP: {
    name: 'Diploma Programme',
    label: 'DP (Diploma Programme)',
    grades: [
      'Grade 11 (DP 1)',
      'Grade 12 (DP 2)'
    ]
  },
  CP: {
    name: 'Career-related Programme',
    label: 'CP (Career-related Programme)',
    grades: [
      'Grade 11 (CP 1)',
      'Grade 12 (CP 2)'
    ]
  },
  STAFF: {
    name: 'Faculty & Staff',
    label: 'Faculty & Staff',
    grades: [
      'PYP Faculty',
      'MYP Faculty',
      'DP/CP Faculty',
      'Administration & Operations'
    ]
  },
  GENERAL: {
    name: 'General / Visitor',
    label: 'General / Visitor',
    grades: ['General Visitor']
  }
};

export const ALL_IB_GRADES = [
  // PYP
  'EY1 (Early Years 1)',
  'EY2 (Early Years 2)',
  'EY3 (Early Years 3)',
  'Grade 1 (PYP 1)',
  'Grade 2 (PYP 2)',
  'Grade 3 (PYP 3)',
  'Grade 4 (PYP 4)',
  'Grade 5 (PYP 5)',
  // MYP
  'Grade 6 (MYP 1)',
  'Grade 7 (MYP 2)',
  'Grade 8 (MYP 3)',
  'Grade 9 (MYP 4)',
  'Grade 10 (MYP 5)',
  // DP
  'Grade 11 (DP 1)',
  'Grade 12 (DP 2)',
  // CP
  'Grade 11 (CP 1)',
  'Grade 12 (CP 2)',
  // Staff
  'Faculty / Staff'
];

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  type: TransactionType;
  quantity: number; // e.g. 2
  balanceAfter: number; // e.g. 38
  department: string; // e.g. "MYP Sciences" or "School Store / Co-op"
  requesterName?: string;
  userName?: string;
  note?: string;
  receiptId?: string;
  createdAt: string; // ISO 8601
}

// ERP Sales & Receipt Types
export type CustomerType = 'STUDENT' | 'PARENT' | 'TEACHER' | 'GENERAL';
export type PaymentMethod = 'CASH' | 'PROMPTPAY' | 'TRANSFER';

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  STUDENT: 'IB Student',
  PARENT: 'Parent / Guardian',
  TEACHER: 'Teacher / Staff',
  GENERAL: 'General / Visitor'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  PROMPTPAY: 'PromptPay QR',
  TRANSFER: 'Bank Transfer'
};

// Customer Database Record
export interface Customer {
  id: string;
  name: string; // e.g. "Sarah Jenkins" or "Panyawut Sukjai"
  nickname?: string; // e.g. "Ken" or "Win"
  type: CustomerType;
  programme: IBProgramme;
  grade: string; // e.g. "Grade 7 (MYP 2)"
  studentId?: string; // e.g. "RAIS-2024-042"
  parentName?: string; // e.g. "Mr. David Jenkins"
  phone?: string;
  email?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. "RC2609-0001"
  customerName: string;
  customerType: CustomerType;
  studentClass?: string; // e.g. "Grade 7 (MYP 2)"
  studentId?: string; // e.g. "RAIS-2024-042"
  paymentMethod: PaymentMethod;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  cashReceived?: number;
  change?: number;
  cashierName: string;
  cashierEmail: string;
  note?: string;
  status: 'COMPLETED' | 'VOIDED';
  voidReason?: string;
  createdAt: string;
}

// Half-A4 Billing Invoice (Payment Notice / Invoice)
export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending Payment', color: 'text-[#B54708]', bg: 'bg-[#FEF0C7] border-[#E5E0D8]' },
  PAID: { label: 'Paid', color: 'text-[#027A48]', bg: 'bg-[#D1FADF] border-[#E5E0D8]' },
  CANCELLED: { label: 'Cancelled', color: 'text-[#B42318]', bg: 'bg-[#FEE4E2] border-[#E5E0D8]' }
};

export interface InvoiceItem {
  itemId?: string;
  itemCode?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV2609-0001"
  customerName: string;
  customerType: CustomerType;
  studentClass?: string; // e.g. "Grade 7 (MYP 2)"
  studentId?: string; // e.g. "RAIS-2024-042"
  parentName?: string;
  phone?: string;
  dueDate?: string; // e.g. "2026-09-25"
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  creatorName: string;
  creatorEmail: string;
  note?: string;
  status: InvoiceStatus;
  receiptId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Official Bangkok Bank Thai QR payment metadata for Roong Aroon International School
export const SCHOOL_BANK_INFO = {
  bankName: 'Bangkok Bank',
  accountName: 'ROONG AROON INTERN',
  ref1: '002203089172',
  ref3: '43008918',
  mid: '002203089172',
  tid: '43008918',
  qrImagePath: '/images/promptpay_qr.jpg'
};

