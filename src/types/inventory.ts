export type TransactionType = 'IN' | 'OUT' | 'ADJUST';

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
