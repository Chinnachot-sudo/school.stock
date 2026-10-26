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

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory_db.json');

function assertLocalDatabaseEnabled(): void {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_LOCAL_JSON_DB !== 'true') {
    throw new Error('Local JSON database is disabled. Configure Supabase server access; local JSON requires ALLOW_LOCAL_JSON_DB=true in non-production only.');
  }
}

const INITIAL_DATA: DatabaseSchema = {
  categories: [],
  departments: [],
  items: [],
  transactions: [],
  receipts: [],
  invoices: [],
  customers: [],
  auditLogs: []
};

function ensureDbExists(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('ensureDbExists warning:', err);
  }
}

export function readDb(): DatabaseSchema {
  assertLocalDatabaseEnabled();
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
  assertLocalDatabaseEnabled();
  try {
    ensureDbExists();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    throw new Error('Could not persist local database changes', { cause: err });
  }
}
