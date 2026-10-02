-- ==============================================================================
-- [DEPRECATED] REFERENCE ONLY - DO NOT MODIFY DIRECTLY
-- All future database schema changes must be added as new migration files under:
-- supabase/migrations/ (e.g. supabase/migrations/0001_baseline.sql)
-- ==============================================================================
-- สคริปต์สร้างและอัปเดตฐานข้อมูลสำหรับระบบ ERP โรงเรียนรุ่งอรุณ (Supabase SQL - Reference)

-- 1. ตารางหมวดหมู่สินค้า (Categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏷️'
);

-- 2. ตารางกลุ่มสาระ / แผนกงาน (Departments)
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 3. ตารางรายการสินค้า / พัสดุ (Items)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'ชิ้น',
  location TEXT DEFAULT 'ตู้พัสดุกลาง',
  price NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  is_for_sale BOOLEAN DEFAULT false,
  note TEXT,
  is_borrowable BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- เพิ่ม Columns สำหรับระบบขาย POS หากมีตารางเดิมอยู่แล้ว
ALTER TABLE items ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;

-- 4. ตารางบันทึกประวัติการเบิก-รับ (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'IN' (รับเข้า), 'OUT' (เบิกตัดสต็อก), 'SALE' (ขาย POS), 'ADJUST' (ปรับยอด)
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  department TEXT NOT NULL,
  requester_name TEXT,
  note TEXT,
  receipt_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_id TEXT;

-- 5. ตารางฐานข้อมูลลูกค้าและนักเรียน IB (Customers)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  type TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT' | 'PARENT' | 'TEACHER' | 'GENERAL'
  programme TEXT NOT NULL DEFAULT 'MYP', -- 'PYP' | 'MYP' | 'DP' | 'CP' | 'STAFF' | 'GENERAL'
  grade TEXT DEFAULT '',
  student_id TEXT,
  parent_name TEXT,
  phone TEXT,
  email TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 6. ตารางใบเสร็จรับเงิน (Receipts)
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_type TEXT NOT NULL DEFAULT 'STUDENT',
  student_class TEXT,
  student_id TEXT,
  payment_method TEXT NOT NULL DEFAULT 'CASH', -- 'CASH' | 'PROMPTPAY' | 'TRANSFER'
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  cash_received NUMERIC DEFAULT 0,
  change NUMERIC DEFAULT 0,
  cashier_name TEXT,
  cashier_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED' | 'VOIDED'
  void_reason TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- 7. ระบบจัดการสิทธิ์ 3-Tier RBAC/PBAC & Row-Level Security (RLS)
-- =========================================================
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- ฟังก์ชันตรวจสอบสิทธิ์ระดับ Database
CREATE OR REPLACE FUNCTION private.authorize(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id TEXT;
  has_perm BOOLEAN;
BEGIN
  current_user_id := coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('app.current_user_id', true), '')
  );

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = current_user_id
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND (rp.permission_id = required_permission OR ur.role_id = 'SUPER_ADMIN')
  ) INTO has_perm;

  RETURN coalesce(has_perm, false);
END;
$$;

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- กำหนด Policies ที่เข้มงวด
CREATE POLICY "categories_read" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "departments_read" ON departments FOR SELECT TO public USING (true);

CREATE POLICY "items_read" ON items FOR SELECT TO public USING (true);
CREATE POLICY "items_insert" ON items FOR INSERT TO authenticated WITH CHECK (private.authorize('inventory.items.create'));
CREATE POLICY "items_update" ON items FOR UPDATE TO authenticated USING (private.authorize('inventory.items.edit'));
CREATE POLICY "items_delete" ON items FOR DELETE TO authenticated USING (private.authorize('inventory.items.delete'));

CREATE POLICY "receipts_read" ON receipts FOR SELECT TO authenticated USING (private.authorize('finance.receipts.read') OR private.authorize('finance.pos.sell'));
CREATE POLICY "receipts_insert" ON receipts FOR INSERT TO authenticated WITH CHECK (private.authorize('finance.pos.sell'));
CREATE POLICY "receipts_update" ON receipts FOR UPDATE TO authenticated USING (private.authorize('finance.receipts.void'));

CREATE POLICY "customers_read" ON customers FOR SELECT TO authenticated USING (private.authorize('customers.read'));
CREATE POLICY "customers_modify" ON customers FOR ALL TO authenticated USING (private.authorize('customers.manage'));

-- =========================================================
-- ข้อมูลหมวดหมู่ตั้งต้นตามหลักสูตรโรงเรียน IB (Initial Categories)
-- =========================================================
INSERT INTO categories (id, name, icon) VALUES
  ('cat-uniform', 'ชุดนักเรียนและเครื่องแบบ (Uniforms)', '👕'),
  ('cat-books', 'หนังสือและแบบเรียน IB (Textbooks & Workbooks)', '📚'),
  ('cat-stationery', 'เครื่องเขียนและอุปกรณ์การเรียน (Stationery)', '✏️'),
  ('cat-paper', 'กระดาษและสมุดโรงเรียน (Paper & Notebooks)', '📄'),
  ('cat-it', 'หมึกพิมพ์และอุปกรณ์ไอที (IT & EdTech)', '💻'),
  ('cat-science', 'อุปกรณ์การทดลองวิทย์ (Science Lab)', '🔬'),
  ('cat-art', 'อุปกรณ์ศิลปะและงานดีไซน์ (Art & Design)', '🎨'),
  ('cat-pe', 'อุปกรณ์กีฬาและพลศึกษา (PHE & Sports)', '⚽'),
  ('cat-cleaning', 'อุปกรณ์ทำความสะอาด (Hygiene & Facilities)', '🧹'),
  ('cat-equipment', 'ครุภัณฑ์ยืม-คืน (Audio-Visual Equipment)', '📽️')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon;

-- =========================================================
-- ข้อมูลแผนกงานและหลักสูตรโรงเรียน (Initial Departments)
-- =========================================================
INSERT INTO departments (id, name) VALUES
  ('dept-store', 'School Store & Co-op (ร้านค้าสวัสดิการและสหกรณ์)'),
  ('dept-pyp', 'Primary Years Programme (PYP)'),
  ('dept-myp', 'Middle Years Programme (MYP)'),
  ('dept-dp', 'Diploma Programme (DP)'),
  ('dept-cp', 'Career-related Programme (CP)'),
  ('dept-sci', 'Science & Laboratory Department'),
  ('dept-art', 'Arts & Design Department'),
  ('dept-phe', 'Physical & Health Education (PHE)'),
  ('dept-it', 'IT & Educational Technology'),
  ('dept-lib', 'Library & Resource Center'),
  ('dept-admin', 'Administration & Admissions'),
  ('dept-facility', 'Facilities & Maintenance')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- =========================================================
-- ตัวอย่างข้อมูลนักเรียน IB ตั้งต้น (Sample IB Students)
-- =========================================================
INSERT INTO customers (id, name, nickname, type, programme, grade, student_id, parent_name, phone, email, note) VALUES
  ('cust-1', 'ด.ช. ปัญญาวุฒิ สุขใจ', 'Ken', 'STUDENT', 'MYP', 'Grade 7 (MYP 2)', 'RAIS-2024-042', 'คุณสมศักดิ์ สุขใจ', '081-234-5678', 'panyawut.k@roong-aroon.ac.th', 'นักเรียนทุนวิชาการ'),
  ('cust-2', 'Sarah Jenkins', 'Sarah', 'STUDENT', 'DP', 'Grade 11 (DP 1)', 'RAIS-2023-108', 'Mr. Robert Jenkins', '089-876-5432', 'sarah.j@roong-aroon.ac.th', 'IB Diploma Candidate'),
  ('cust-3', 'ด.ญ. กัญญาพัชร มงคลกุล', 'ขวัญข้าว', 'STUDENT', 'PYP', 'Grade 3 (PYP 3)', 'RAIS-2025-015', 'คุณปิยะดา มงคลกุล', '086-555-4321', 'kanyapat.m@roong-aroon.ac.th', 'แพ้ถั่วลิสง'),
  ('cust-4', 'นายธนกฤต วิริยะภาพ', 'Mark', 'STUDENT', 'CP', 'Grade 12 (CP 2)', 'RAIS-2022-099', 'คุณวิรัช วิริยะภาพ', '082-333-7890', 'thanakrit.w@roong-aroon.ac.th', 'BTEC Art & Design')
ON CONFLICT (id) DO NOTHING;
