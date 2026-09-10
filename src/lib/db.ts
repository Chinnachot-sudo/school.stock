import fs from 'fs';
import path from 'path';
import { Item, Category, Department, Transaction, Receipt, Customer } from '@/types/inventory';

interface DatabaseSchema {
  categories: Category[];
  departments: Department[];
  items: Item[];
  transactions: Transaction[];
  receipts: Receipt[];
  customers: Customer[];
}

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory_db.json');

const INITIAL_DATA: DatabaseSchema = {
  categories: [
    { id: 'cat-uniform', name: 'ชุดนักเรียนและเครื่องแบบ (Uniforms)', icon: '👕', description: 'เครื่องแบบนักเรียน เสื้อเชิ้ต กางเกง กระโปรง ชุดพละ' },
    { id: 'cat-books', name: 'หนังสือและแบบเรียน IB (Textbooks & Workbooks)', icon: '📚', description: 'หนังสือเรียน PYP, MYP, DP, CP และแบบฝึกหัด' },
    { id: 'cat-stationery', name: 'เครื่องเขียนและอุปกรณ์การเรียน (Stationery)', icon: '✏️', description: 'ปากกา ดินสอ ยางลบ ไม้บรรทัด กรรไกร สี' },
    { id: 'cat-paper', name: 'กระดาษและสมุดโรงเรียน (Paper & Notebooks)', icon: '📄', description: 'สมุดรายงานโรงเรียน กระดาษ A4 สมุดจดการบ้าน' },
    { id: 'cat-it', name: 'หมึกพิมพ์และอุปกรณ์ไอที (IT & EdTech)', icon: '💻', description: 'หมึกพิมพ์ สายต่อคอมพิวเตอร์ อุปกรณ์ไอที' },
    { id: 'cat-science', name: 'อุปกรณ์การทดลองวิทย์ (Science Lab)', icon: '🔬', description: 'หลอดทดลอง สารเคมี แว่นตานิรภัย' },
    { id: 'cat-art', name: 'อุปกรณ์ศิลปะและงานดีไซน์ (Art & Design)', icon: '🎨', description: 'สีน้ำ สีโปสเตอร์ กระดาษวาดเขียน ดินน้ำมัน' },
    { id: 'cat-pe', name: 'อุปกรณ์กีฬาและพลศึกษา (PHE & Sports)', icon: '⚽', description: 'ลูกบอล กรวยฝึกซ้อม ไม้แบดมินตัน' },
    { id: 'cat-cleaning', name: 'อุปกรณ์ทำความสะอาด (Hygiene & Facilities)', icon: '🧹', description: 'น้ำยาทำความสะอาด ทิชชู่ ถุงขยะ' },
    { id: 'cat-equipment', name: 'ครุภัณฑ์ยืม-คืน (Audio-Visual Equipment)', icon: '📽️', description: 'โปรเจคเตอร์ ไมโครโฟน สายสัญญาณ' }
  ],
  departments: [
    { id: 'dept-store', name: 'School Store & Co-op (ร้านค้าสวัสดิการและสหกรณ์)' },
    { id: 'dept-pyp', name: 'Primary Years Programme (PYP)' },
    { id: 'dept-myp', name: 'Middle Years Programme (MYP)' },
    { id: 'dept-dp', name: 'Diploma Programme (DP)' },
    { id: 'dept-cp', name: 'Career-related Programme (CP)' },
    { id: 'dept-sci', name: 'Science & Laboratory Department' },
    { id: 'dept-art', name: 'Arts & Design Department' },
    { id: 'dept-phe', name: 'Physical & Health Education (PHE)' },
    { id: 'dept-it', name: 'IT & Educational Technology' },
    { id: 'dept-lib', name: 'Library & Resource Center' },
    { id: 'dept-admin', name: 'Administration & Admissions' },
    { id: 'dept-facility', name: 'Facilities & Maintenance' }
  ],
  receipts: [],
  customers: [
    {
      id: 'cust-1',
      name: 'ด.ช. ปัญญาวุฒิ สุขใจ (Ken)',
      type: 'STUDENT',
      programme: 'MYP',
      grade: 'Grade 7 (MYP 2)',
      studentId: 'RAIS-2024-042',
      parentName: 'คุณสมศักดิ์ สุขใจ',
      phone: '081-234-5678',
      email: 'panyawut.k@roong-aroon.ac.th',
      note: 'นักเรียนทุนวิชาการ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-2',
      name: 'ด.ญ. ภัทรวดี มงคลศิลป์ (Pat)',
      type: 'STUDENT',
      programme: 'PYP',
      grade: 'Grade 4 (PYP 4)',
      studentId: 'RAIS-2024-118',
      parentName: 'คุณวิภา มงคลศิลป์',
      phone: '089-876-5432',
      email: 'pattawadee.m@roong-aroon.ac.th',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-3',
      name: 'นายธนาธิป เจริญผล (Mark)',
      type: 'STUDENT',
      programme: 'DP',
      grade: 'Grade 11 (DP 1)',
      studentId: 'RAIS-2023-015',
      parentName: 'คุณเกรียงไกร เจริญผล',
      phone: '086-555-1234',
      email: 'thanathip.c@roong-aroon.ac.th',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-4',
      name: 'Sarah Jenkins (Ms. Sarah)',
      type: 'TEACHER',
      programme: 'MYP',
      grade: 'MYP Faculty',
      studentId: 'STAFF-029',
      phone: '092-333-8899',
      email: 'sarah.j@roong-aroon.ac.th',
      note: 'MYP Individuals & Societies Teacher',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
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
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      // If on Vercel, copy existing bundled data from app bundle if present
      const bundledFile = path.join(process.cwd(), 'data', 'inventory_db.json');
      if (isVercel && fs.existsSync(bundledFile)) {
        try {
          const content = fs.readFileSync(bundledFile, 'utf-8');
          fs.writeFileSync(DB_FILE, content, 'utf-8');
          return;
        } catch {
          // fall through to INITIAL_DATA
        }
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('ensureDbExists warning:', err);
  }
}

export function readDb(): DatabaseSchema {
  ensureDbExists();
  try {
    if (!fs.existsSync(DB_FILE)) {
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!Array.isArray(parsed.receipts)) {
      parsed.receipts = [];
    }
    if (!Array.isArray(parsed.customers)) {
      parsed.customers = INITIAL_DATA.customers;
    }
    if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      parsed.categories = INITIAL_DATA.categories;
    }
    return parsed;
  } catch (error) {
    console.error('Error reading database file, resetting to initial data:', error);
    return INITIAL_DATA;
  }
}

export function writeDb(data: DatabaseSchema): void {
  try {
    ensureDbExists();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('writeDb: Could not write to local filesystem:', err);
  }
}
