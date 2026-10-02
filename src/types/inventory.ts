export type TransactionType = 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'VOID_SALE' | 'RETURN_RESTOCK';

export type UserRole =
  | 'super_admin'
  | 'legacy_admin'
  | 'admin'
  | 'warehouse'
  | 'cashier'
  | 'accountant'
  | 'teacher'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'WAREHOUSE'
  | 'CASHIER'
  | 'ACCOUNTANT'
  | 'INVENTORY_MANAGER'
  | 'TEACHER';

export type PermissionKey =
  // Inventory
  | 'inventory:item:read'
  | 'inventory:item:create'
  | 'inventory:item:update'
  | 'inventory:item:delete'
  | 'inventory:stock:restock'
  | 'inventory:stock:issue'
  | 'inventory:stock:adjust'
  // POS & Receipts
  | 'pos:shift:manage'
  | 'pos:receipt:read'
  | 'pos:receipt:create'
  | 'pos:receipt:void'
  | 'pos:receipt:refund'
  // Customers
  | 'customer:read'
  | 'customer:create'
  | 'customer:update'
  | 'customer:delete'
  // Invoicing & Payments
  | 'invoice:create'
  | 'invoice:read'
  | 'invoice:update'
  | 'payment:receive'
  // Requests
  | 'request:create'
  | 'request:read:own'
  | 'request:approve'
  | 'request:approve:limited'
  // Finance & Reports
  | 'finance:cost:read'
  | 'finance:profit:read'
  | 'report:cost:read'
  | 'label:print'
  | 'report:read'
  | 'report:export'
  // IAM & Security
  | 'iam:user:read'
  | 'iam:user:create'
  | 'iam:user:update'
  | 'iam:user:disable'
  | 'iam:user:delete'
  | 'iam:role:assign'
  | 'iam:settings:configure'
  | 'audit:log:read';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  role: UserRole;
  roles?: string[];
  permissions?: PermissionKey[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithPermissions extends AppUser {
  permissions: PermissionKey[];
}

export interface UserRoleRecord {
  email: string;
  role: UserRole;
  name?: string;
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  legacy_admin: 'Legacy Admin',
  teacher: 'Teacher / Staff',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  INVENTORY_MANAGER: 'Admin',
  TEACHER: 'Teacher / Staff'
};

export function getUserRole(emailOrRole?: string | null): UserRole {
  if (!emailOrRole) return 'teacher';
  const clean = emailOrRole.toLowerCase().trim();
  if (clean === 'super_admin' || clean === 'superadmin') return 'super_admin';
  if (clean === 'admin' || clean === 'legacy_admin' || clean === 'inventory_manager') return 'legacy_admin';
  return 'teacher';
}

export const STANDARD_UNITS = [
  'Pcs',
  'Book',
  'Pen',
  'Box',
  'Pack',
  'Roll',
  'Ream',
  'Sheet',
  'Bottle',
  'Unit',
  'Set',
  'Kg',
  'Tube',
  'Pair',
  'Can',
  'Meter'
] as const;

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
  imageUrl?: string; // Item photo / equipment image URL (data URL or hosted image)
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
  allocatedBudget?: number; // Allocated budget
  spentBudget?: number;     // Spent budget
  fiscalYear?: string;     // Academic / Fiscal year
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
  departmentId?: string;
  issuedToUserId?: string;
  issuedToName?: string;
  unitCost?: number;
  unitPrice?: number;
  totalCost?: number;
  budgetDeducted?: boolean;
  requesterName?: string;
  userName?: string;
  note?: string;
  receiptId?: string;
  createdAt: string; // ISO 8601
}

export type AuditActionCategory = 'INVENTORY' | 'STOCK_OPERATION' | 'POS_SALE' | 'USER_MANAGEMENT' | 'SYSTEM';

export interface AuditLog {
  id: string;
  category: AuditActionCategory;
  action: string; // e.g. "RECEIVE_STOCK", "ISSUE_STOCK", "CREATE_ITEM", "UPDATE_ITEM", "DELETE_ITEM", "CREATE_USER", "POS_SALE"
  details: string; // Human-readable description of what was done
  actorName: string; // Who performed the action
  actorEmail?: string;
  targetId?: string; // Item ID, User ID, Receipt ID etc.
  targetName?: string;
  metadata?: Record<string, any>;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  createdAt: string; // ISO 8601
}

// ERP Sales & Receipt Types
export type CustomerType = 'STUDENT' | 'PARENT' | 'TEACHER' | 'GENERAL';
export type PaymentMethod = 'CASH' | 'CARD' | 'PROMPTPAY' | 'TRANSFER' | 'WELFARE';

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  STUDENT: 'IB Student',
  PARENT: 'Parent / Guardian',
  TEACHER: 'Teacher / Staff',
  GENERAL: 'General / Visitor'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Credit / Debit Card',
  PROMPTPAY: 'PromptPay QR',
  TRANSFER: 'Bank Transfer',
  WELFARE: 'School Welfare Wallet'
};

// Return & Refund Types
export type ReturnReason = 'DEFECTIVE' | 'WRONG_SIZE' | 'MIND_CHANGED' | 'DUPLICATE' | 'OTHER';

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defective / Damaged',
  WRONG_SIZE: 'Wrong Size / Spec',
  MIND_CHANGED: 'Customer Changed Mind',
  DUPLICATE: 'Duplicate Purchase',
  OTHER: 'Other Reason'
};

export interface ReturnRecord {
  id: string;
  receiptId: string;
  receiptNumber: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
  }[];
  totalRefund: number;
  reason: ReturnReason;
  reasonDetail?: string;
  cashierName: string;
  createdAt: string;
}

export type GuardianRelationship =
  | 'Father'
  | 'Mother'
  | 'Stepmother'
  | 'Stepfather'
  | 'Legal Guardian'
  | 'Grandmother'
  | 'Grandfather'
  | 'Sister'
  | 'Brother'
  | 'Other';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: GuardianRelationship;
  phone?: string;
  email?: string;
}

// Customer Database Record
export interface Customer {
  id: string;
  name: string; // e.g. "Sarah Jenkins" or "Panyawut Sukjai"
  nickname?: string; // e.g. "Ken" or "Win"
  type: CustomerType;
  programme: IBProgramme;
  grade: string; // e.g. "Grade 7 (MYP 2)"
  studentId?: string; // e.g. "RAIS-2024-042"
  parentName?: string; // e.g. "Smith Amornsaensuk (Father), Man Chi Mo (Mother)"
  phone?: string;
  email?: string;
  guardians?: FamilyMember[];
  points?: number; // Loyalty points (e.g. 150)
  welfareBalance?: number; // School Welfare Wallet balance (e.g. 1500)
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
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

