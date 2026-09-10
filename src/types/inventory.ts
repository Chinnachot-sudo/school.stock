export type TransactionType = 'IN' | 'OUT' | 'ADJUST';

export type UserRole = 'SUPER_ADMIN' | 'INVENTORY_MANAGER' | 'TEACHER';

export interface UserRoleRecord {
  email: string;
  role: UserRole;
  name?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: '👑 Super Admin',
  INVENTORY_MANAGER: '📦 เจ้าหน้าที่พัสดุ',
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
  unit: string; // e.g. "รีม", "ด้าม", "กล่อง", "เล่ม", "ขวด"
  location: string; // e.g. "ตู้พัสดุ A ชั้น 2", "ห้องหมวดคณิตศาสตร์"
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
  department: string; // e.g. "กลุ่มสาระฯ คณิตศาสตร์"
  requesterName?: string; // e.g. "ครูสมชาย"
  note?: string; // e.g. "ใช้จัดกิจกรรมสัปดาห์วิทยาศาสตร์"
  createdAt: string; // ISO 8601
}
