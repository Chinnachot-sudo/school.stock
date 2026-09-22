import fs from 'fs';
import path from 'path';
import { Item, Category, Department, Transaction, Receipt, Customer, Invoice, AuditLog } from '@/types/inventory';

interface DatabaseSchema {
  categories: Category[];
  departments: Department[];
  items: Item[];
  transactions: Transaction[];
  receipts: Receipt[];
  invoices: Invoice[];
  customers: Customer[];
  auditLogs?: AuditLog[];
}

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory_db.json');

const INITIAL_DATA: DatabaseSchema = {
  categories: [
    { id: 'cat-uniform', name: 'Uniforms & Dress Code', icon: '👕', description: 'School uniform, polo shirts, shorts, skirts, PE kit' },
    { id: 'cat-books', name: 'IB Textbooks & Workbooks', icon: '📚', description: 'PYP, MYP, DP, CP curriculum books and workbooks' },
    { id: 'cat-stationery', name: 'Stationery & Study Supplies', icon: '✏️', description: 'Pens, pencils, erasers, rulers, scissors, art colors' },
    { id: 'cat-paper', name: 'Paper & School Notebooks', icon: '📄', description: 'School exercise notebooks, A4 reams, planners' },
    { id: 'cat-it', name: 'IT & EdTech Supplies', icon: '💻', description: 'Printer toners, computer accessories, AV cables' },
    { id: 'cat-science', name: 'Science Lab Equipment', icon: '🔬', description: 'Test tubes, lab glassware, safety goggles' },
    { id: 'cat-art', name: 'Art & Design Supplies', icon: '🎨', description: 'Watercolors, canvas, sketch pads, sculpting clay' },
    { id: 'cat-pe', name: 'PHE & Sports Equipment', icon: '⚽', description: 'Balls, cones, badminton rackets, sports gear' },
    { id: 'cat-cleaning', name: 'Hygiene & Facilities', icon: '🧹', description: 'Cleaning supplies, sanitizers, tissues' },
    { id: 'cat-equipment', name: 'Audio-Visual & Loans', icon: '📽️', description: 'Projectors, wireless microphones, adapters' }
  ],
  departments: [
    { id: 'dept-sci', name: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี', allocatedBudget: 150000, spentBudget: 42350, fiscalYear: '2026' },
    { id: 'dept-math', name: 'กลุ่มสาระฯ คณิตศาสตร์', allocatedBudget: 120000, spentBudget: 18500, fiscalYear: '2026' },
    { id: 'dept-thai', name: 'กลุ่มสาระฯ ภาษาไทย', allocatedBudget: 100000, spentBudget: 12000, fiscalYear: '2026' },
    { id: 'dept-foreign', name: 'กลุ่มสาระฯ ภาษาต่างประเทศ', allocatedBudget: 110000, spentBudget: 24500, fiscalYear: '2026' },
    { id: 'dept-social', name: 'กลุ่มสาระฯ สังคมศึกษา ศาสนาฯ', allocatedBudget: 95000, spentBudget: 15400, fiscalYear: '2026' },
    { id: 'dept-art', name: 'กลุ่มสาระฯ ศิลปะ / การงาน', allocatedBudget: 140000, spentBudget: 51200, fiscalYear: '2026' },
    { id: 'dept-pe', name: 'กลุ่มสาระฯ สุขศึกษาและพลศึกษา', allocatedBudget: 130000, spentBudget: 33000, fiscalYear: '2026' },
    { id: 'dept-admin', name: 'งานธุรการและสารบรรณ', allocatedBudget: 200000, spentBudget: 89000, fiscalYear: '2026' },
    { id: 'dept-academic', name: 'งานวิชาการและทะเบียน', allocatedBudget: 160000, spentBudget: 45000, fiscalYear: '2026' },
    { id: 'dept-facility', name: 'งานพัสดุ อาคารสถานที่', allocatedBudget: 250000, spentBudget: 112000, fiscalYear: '2026' }
  ],
  receipts: [],
  invoices: [],
  auditLogs: [],
  customers: [
    {
      id: 'cust-1',
      name: 'Panyawut Sukjai (Ken)',
      type: 'STUDENT',
      programme: 'MYP',
      grade: 'Grade 7 (MYP 2)',
      studentId: 'RAIS-2024-042',
      parentName: 'Somsak Sukjai',
      phone: '081-234-5678',
      email: 'panyawut.k@roong-aroon.ac.th',
      welfareBalance: 1500,
      note: 'Academic Scholarship Student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-2',
      name: 'Pattawadee Mongkolsilp (Pat)',
      type: 'STUDENT',
      programme: 'PYP',
      grade: 'Grade 4 (PYP 4)',
      studentId: 'RAIS-2024-118',
      parentName: 'Wipha Mongkolsilp',
      phone: '089-876-5432',
      email: 'pattawadee.m@roong-aroon.ac.th',
      welfareBalance: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-3',
      name: 'Thanathip Charoenphol (Mark)',
      type: 'STUDENT',
      programme: 'DP',
      grade: 'Grade 11 (DP 1)',
      studentId: 'RAIS-2023-015',
      parentName: 'Kriangkrai Charoenphol',
      phone: '086-555-1234',
      email: 'thanathip.c@roong-aroon.ac.th',
      welfareBalance: 1200,
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
      welfareBalance: 5000,
      note: 'MYP Individuals & Societies Teacher',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  items: [
    {
      id: 'item-1',
      code: 'A4-DOUBLE-A',
      name: 'Double A Copy Paper 80gsm (A4)',
      categoryId: 'cat-paper',
      currentStock: 45,
      minStock: 15,
      unit: 'ream',
      location: 'Cabinet A, 2nd Floor',
      note: 'For official documents and examination papers',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-2',
      code: 'PEN-WB-BLUE',
      name: 'Whiteboard Marker (Blue)',
      categoryId: 'cat-stationery',
      currentStock: 32,
      minStock: 10,
      unit: 'pcs',
      location: 'Stationery Box B1, 1st Floor',
      note: 'Classroom supplies',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-3',
      code: 'PEN-WB-RED',
      name: 'Whiteboard Marker (Red)',
      categoryId: 'cat-stationery',
      currentStock: 18,
      minStock: 10,
      unit: 'pcs',
      location: 'Stationery Box B1, 1st Floor',
      note: 'Grading and emphasis',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-4',
      code: 'INK-BROTHER-2380',
      name: 'Laser Toner Brother TN-2380',
      categoryId: 'cat-it',
      currentStock: 3,
      minStock: 4,
      unit: 'box',
      location: 'Cabinet C, Server Room',
      note: 'Academic office & library printer',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-5',
      code: 'CL-DET-PINK',
      name: 'Restroom Cleaner (Pink)',
      categoryId: 'cat-cleaning',
      currentStock: 14,
      minStock: 6,
      unit: 'bottle',
      location: 'Janitor Storage Room',
      note: 'Weekly cleaning supply',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-6',
      code: 'CRAFT-POSTER-COLOR',
      name: 'Poster Colors 12-Color Set',
      categoryId: 'cat-art',
      currentStock: 25,
      minStock: 8,
      unit: 'set',
      location: 'Art Department Room',
      note: 'Student artwork and exhibition',
      isBorrowable: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-7',
      code: 'EQ-PROJ-EPSON-01',
      name: 'Portable Projector Epson EB-X06',
      categoryId: 'cat-equipment',
      currentStock: 2,
      minStock: 1,
      unit: 'unit',
      location: 'AV Center Display Case',
      note: 'Loan equipment for meeting and hall presentations',
      isBorrowable: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'item-8',
      code: 'EQ-HDMI-10M',
      name: 'HDMI Cable 10m',
      categoryId: 'cat-equipment',
      currentStock: 5,
      minStock: 2,
      unit: 'pcs',
      location: 'AV Center Cable Box',
      note: 'Loan equipment',
      isBorrowable: true,
      updatedAt: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      itemId: 'item-1',
      itemName: 'Double A Copy Paper 80gsm (A4)',
      itemCode: 'A4-DOUBLE-A',
      type: 'OUT',
      quantity: 3,
      balanceAfter: 45,
      department: 'Mathematics Department',
      requesterName: 'Wiphada (Teacher)',
      note: 'Midterm exam sheets',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'tx-2',
      itemId: 'item-2',
      itemName: 'Whiteboard Marker (Blue)',
      itemCode: 'PEN-WB-BLUE',
      type: 'OUT',
      quantity: 2,
      balanceAfter: 32,
      department: 'Science & Technology Dept',
      requesterName: 'Anucha (Teacher)',
      note: 'Science Lab 2 requisition',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'tx-3',
      itemId: 'item-4',
      itemName: 'Laser Toner Brother TN-2380',
      itemCode: 'INK-BROTHER-2380',
      type: 'IN',
      quantity: 2,
      balanceAfter: 3,
      department: 'Facilities & Procurement',
      requesterName: 'Procurement Staff',
      note: 'Received from Siam IT PO',
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
    if (!Array.isArray(parsed.invoices)) {
      parsed.invoices = [];
    }
    if (!Array.isArray(parsed.auditLogs)) {
      parsed.auditLogs = [];
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
