import fs from 'fs';
import path from 'path';
import { Item, Category, Department, Transaction } from '@/types/inventory';

interface DatabaseSchema {
  categories: Category[];
  departments: Department[];
  items: Item[];
  transactions: Transaction[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory_db.json');

const INITIAL_DATA: DatabaseSchema = {
  categories: [
    { id: 'cat-stationery', name: 'เครื่องเขียนและแบบพิมพ์', icon: '✏️' },
    { id: 'cat-paper', name: 'กระดาษและเอกสาร', icon: '📄' },
    { id: 'cat-it', name: 'หมึกพิมพ์และอุปกรณ์ไอที', icon: '🖨️' },
    { id: 'cat-cleaning', name: 'อุปกรณ์ทำความสะอาด', icon: '🧹' },
    { id: 'cat-craft', name: 'อุปกรณ์กิจกรรม/ศิลปะ', icon: '🎨' },
    { id: 'cat-equipment', name: 'อุปกรณ์ยืม-คืน (ครุภัณฑ์)', icon: '📽️' }
  ],
  departments: [
    { id: 'dept-sci', name: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี' },
    { id: 'dept-math', name: 'กลุ่มสาระฯ คณิตศาสตร์' },
    { id: 'dept-thai', name: 'กลุ่มสาระฯ ภาษาไทย' },
    { id: 'dept-foreign', name: 'กลุ่มสาระฯ ภาษาต่างประเทศ' },
    { id: 'dept-social', name: 'กลุ่มสาระฯ สังคมศึกษา ศาสนาฯ' },
    { id: 'dept-art', name: 'กลุ่มสาระฯ ศิลปะ / การงาน' },
    { id: 'dept-pe', name: 'กลุ่มสาระฯ สุขศึกษาและพลศึกษา' },
    { id: 'dept-admin', name: 'งานธุรการและสารบรรณ' },
    { id: 'dept-academic', name: 'งานวิชาการและทะเบียน' },
    { id: 'dept-facility', name: 'งานพัสดุ อาคารสถานที่' }
  ],
  items: [
    {
      id: 'item-1',
      code: 'A4-DOUBLE-A',
      name: 'กระดาษ Double A 80 แกรม (A4)',
      categoryId: 'cat-paper',
      currentStock: 45,
      minStock: 15,
      unit: 'รีม',
      location: 'ตู้พัสดุ A ชั้น 2',
      note: 'ใช้สำหรับพิมพ์เอกสารราชการและข้อสอบ',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-2',
      code: 'PEN-WB-BLUE',
      name: 'ปากกาไวท์บอร์ดตราม้า (น้ำเงิน)',
      categoryId: 'cat-stationery',
      currentStock: 32,
      minStock: 10,
      unit: 'ด้าม',
      location: 'กล่องเครื่องเขียน B1 ชั้น 1',
      note: 'เบิกสำหรับประจำห้องเรียน',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-3',
      code: 'PEN-WB-RED',
      name: 'ปากกาไวท์บอร์ดตราม้า (แดง)',
      categoryId: 'cat-stationery',
      currentStock: 18,
      minStock: 10,
      unit: 'ด้าม',
      location: 'กล่องเครื่องเขียน B1 ชั้น 1',
      note: 'สำหรับตรวจงานและเน้นข้อความ',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-4',
      code: 'INK-BROTHER-2380',
      name: 'ตลับหมึกเลเซอร์ Brother TN-2380',
      categoryId: 'cat-it',
      currentStock: 3,
      minStock: 4,
      unit: 'กล่อง',
      location: 'ตู้พัสดุ C ชั้น 3 (ห้องเซิร์ฟเวอร์)',
      note: 'สำหรับเครื่องพิมพ์ห้องวิชาการและห้องสมุด',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-5',
      code: 'CL-DET-PINK',
      name: 'น้ำยาล้างห้องน้ำ มาจิคลีน (ชมพู)',
      categoryId: 'cat-cleaning',
      currentStock: 14,
      minStock: 6,
      unit: 'ขวด',
      location: 'ห้องเก็บของนักการภารโรง',
      note: 'เบิกสัปดาห์ละ 1-2 ครั้ง',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-6',
      code: 'CRAFT-POSTER-COLOR',
      name: 'สีโปสเตอร์ 12 สี มาสเตอร์อาร์ต',
      categoryId: 'cat-craft',
      currentStock: 25,
      minStock: 8,
      unit: 'ชุด',
      location: 'ห้องกลุ่มสาระฯ ศิลปะ',
      note: 'ใช้จัดบอร์ดและกิจกรรมนักเรียน',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-7',
      code: 'EQ-PROJ-EPSON-01',
      name: 'โปรเจคเตอร์พกพา Epson EB-X06',
      categoryId: 'cat-equipment',
      currentStock: 2,
      minStock: 1,
      unit: 'เครื่อง',
      location: 'ตู้กระจก ห้องโสตทัศนศึกษา',
      note: 'อุปกรณ์ยืม-คืน สำหรับห้องเรียนพิเศษ/ประชุม',
      isBorrowable: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-8',
      code: 'EQ-HDMI-10M',
      name: 'สายสัญญาณ HDMI ยาว 10 เมตร',
      categoryId: 'cat-equipment',
      currentStock: 5,
      minStock: 2,
      unit: 'เส้น',
      location: 'กล่องสายสัญญาณ ห้องโสตฯ',
      note: 'อุปกรณ์ยืม-คืน',
      isBorrowable: true,
      updatedAt: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      itemId: 'item-1',
      itemName: 'กระดาษ Double A 80 แกรม (A4)',
      itemCode: 'A4-DOUBLE-A',
      type: 'OUT',
      quantity: 3,
      balanceAfter: 45,
      department: 'กลุ่มสาระฯ คณิตศาสตร์',
      requesterName: 'ครูวิภาดา',
      note: 'พิมพ์ใบงานกลางภาค',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'tx-2',
      itemId: 'item-2',
      itemName: 'ปากกาไวท์บอร์ดตราม้า (น้ำเงิน)',
      itemCode: 'PEN-WB-BLUE',
      type: 'OUT',
      quantity: 2,
      balanceAfter: 32,
      department: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
      requesterName: 'ครูอนุชา',
      note: 'เบิกห้องปฏิบัติการวิทย์ 2',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'tx-3',
      itemId: 'item-4',
      itemName: 'ตลับหมึกเลเซอร์ Brother TN-2380',
      itemCode: 'INK-BROTHER-2380',
      type: 'IN',
      quantity: 2,
      balanceAfter: 3,
      department: 'งานพัสดุ อาคารสถานที่',
      requesterName: 'เจ้าหน้าที่พัสดุ',
      note: 'รับของตามใบสั่งซื้อ บ.สยามไอที',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]
};

function ensureDbExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

export function readDb(): DatabaseSchema {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file, resetting to initial data:', error);
    return INITIAL_DATA;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDbExists();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}
