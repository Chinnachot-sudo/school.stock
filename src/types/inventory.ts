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
}

export interface Department {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  type: TransactionType;
  quantity: number; // e.g. 2
  balanceAfter: number; // e.g. 38
  department: string; // e.g. "กลุ่มสาระฯ คณิตศาสตร์" or "ร้านค้าสวัสดิการ / สหกรณ์"
  requesterName?: string; // e.g. "ครูสมชาย" or "ด.ช. ปัญญาวุฒิ"
  note?: string; // e.g. "ใช้จัดกิจกรรมสัปดาห์วิทยาศาสตร์" or "เลขที่ใบเสร็จ RC202609-001"
  receiptId?: string;
  createdAt: string; // ISO 8601
}

// ERP Sales & Receipt Types
export type CustomerType = 'STUDENT' | 'PARENT' | 'TEACHER' | 'GENERAL';
export type PaymentMethod = 'CASH' | 'PROMPTPAY' | 'TRANSFER';

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  STUDENT: '🎒 นักเรียน',
  PARENT: '👨‍👩‍👧 ผู้ปกครอง',
  TEACHER: '👨‍🏫 ครู / บุคลากร',
  GENERAL: '👤 ทั่วไป'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: '💵 เงินสด',
  PROMPTPAY: '📱 PromptPay QR',
  TRANSFER: '🏦 เงินโอนธนาคาร'
};

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
  customerName: string; // e.g. "ด.ช. ทักษิณ ทองสุข" หรือ "ผู้ปกครอง"
  customerType: CustomerType;
  studentClass?: string; // e.g. "ป.3/2"
  studentId?: string; // e.g. "65012"
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

