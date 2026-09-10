export type TransactionType = 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'VOID_SALE';

export type UserRole = 'SUPER_ADMIN' | 'INVENTORY_MANAGER' | 'TEACHER';

export interface UserRoleRecord {
  email: string;
  role: UserRole;
  name?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: '👑 Super Admin',
  INVENTORY_MANAGER: '📦 เจ้าหน้าที่พัสดุ/การเงิน',
  TEACHER: '👨‍🏫 ครู / บุคลากร'
};

// Whitelist mapping for school accounts
export const DEFAULT_ROLE_MAP: Record<string, UserRole> = {
  'chinnachot@roong-aroon.ac.th': 'SUPER_ADMIN',
  'artima@roong-aroon.ac.th': 'INVENTORY_MANAGER',
  'pakapol@roong-aroon.ac.th': 'INVENTORY_MANAGER',
  'manusnan@roong-aroon.ac.th': 'INVENTORY_MANAGER',
  'pattawadee.k@roong-aroon.ac.th': 'INVENTORY_MANAGER'
};

export function getUserRole(email?: string | null): UserRole {
  if (!email) return 'TEACHER';
  const cleanEmail = email.toLowerCase().trim();
  return DEFAULT_ROLE_MAP[cleanEmail] || 'TEACHER';
}

export interface Item {
  id: string;
  code: string; // Barcode or QR Code string (e.g. "SK-001", "8850029012345")
  name: string; // e.g. "กระดาษ Double A 80 แกรม (A4)"
  categoryId: string; // e.g. "cat-stationery"
  currentStock: number;
  minStock: number; // Safety stock alert threshold
  unit: string; // e.g. "รีม", "ด้าม", "กล่อง", "เล่ม", "ขวด", "ตัว"
  location: string; // e.g. "ตู้พัสดุ A ชั้น 2", "ห้องหมวดคณิตศาสตร์"
  price?: number; // Selling price (บาท) เช่น 25, 250
  cost?: number; // Cost price (บาท) เช่น 18, 190
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
    label: '🌱 PYP (อนุบาล - ประถม)',
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
    label: '📘 MYP (มัธยมต้น)',
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
    label: '🎓 DP (มัธยมปลาย Diploma)',
    grades: [
      'Grade 11 (DP 1)',
      'Grade 12 (DP 2)'
    ]
  },
  CP: {
    name: 'Career-related Programme',
    label: '💼 CP (มัธยมปลาย อาชีพ/ทักษะ)',
    grades: [
      'Grade 11 (CP 1)',
      'Grade 12 (CP 2)'
    ]
  },
  STAFF: {
    name: 'Faculty & Staff',
    label: '👨‍🏫 บุคลากร / ครูอาจารย์',
    grades: [
      'PYP Faculty',
      'MYP Faculty',
      'DP/CP Faculty',
      'Administration & Operations'
    ]
  },
  GENERAL: {
    name: 'General / Visitor',
    label: '👤 บุคคลภายนอก / ทั่วไป',
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
  note?: string;
  receiptId?: string;
  createdAt: string; // ISO 8601
}

// ERP Sales & Receipt Types
export type CustomerType = 'STUDENT' | 'PARENT' | 'TEACHER' | 'GENERAL';
export type PaymentMethod = 'CASH' | 'PROMPTPAY' | 'TRANSFER';

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  STUDENT: '🎒 นักเรียน IB',
  PARENT: '👨‍👩‍👧 ผู้ปกครอง',
  TEACHER: '👨‍🏫 ครู / บุคลากร',
  GENERAL: '👤 ทั่วไป'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: '💵 เงินสด',
  PROMPTPAY: '📱 PromptPay QR',
  TRANSFER: '🏦 เงินโอนธนาคาร'
};

// Customer Database Record
export interface Customer {
  id: string;
  name: string; // e.g. "ด.ช. ปัญญาวุฒิ สุขใจ" or "Sarah Jenkins"
  nickname?: string; // e.g. "น้องวิน" or "Ken"
  type: CustomerType;
  programme: IBProgramme;
  grade: string; // e.g. "Grade 7 (MYP 2)"
  studentId?: string; // e.g. "RAIS-2024-042"
  parentName?: string; // e.g. "คุณสมศักดิ์ สุขใจ"
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

