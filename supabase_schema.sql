-- =========================================================
-- สคริปต์สร้างตารางฐานข้อมูลสำหรับระบบสต็อกโรงเรียน (Supabase SQL)
-- นำสคริปต์นี้ไปวางในเมนู "SQL Editor" บน Supabase แล้วกด RUN
-- =========================================================

-- 1. ตารางหมวดหมู่สินค้า (Categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT
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
  location TEXT,
  note TEXT,
  is_borrowable BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ตารางบันทึกประวัติการเบิก-รับ (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'IN' (รับเข้า), 'OUT' (เบิกตัดสต็อก), 'ADJUST' (ปรับยอด)
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  department TEXT NOT NULL,
  requester_name TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ปิด Row Level Security (RLS) เพื่อให้ระบบเว็บเบิกพัสดุสามารถบันทึกได้สะดวก
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 5. ข้อมูลหมวดหมู่ตั้งต้น (Initial Categories)
INSERT INTO categories (id, name, icon) VALUES
  ('cat-stationery', 'เครื่องเขียนและแบบพิมพ์', '✏️'),
  ('cat-paper', 'กระดาษและเอกสาร', '📄'),
  ('cat-it', 'หมึกพิมพ์และอุปกรณ์ไอที', '🖨️'),
  ('cat-cleaning', 'อุปกรณ์ทำความสะอาด', '🧹'),
  ('cat-craft', 'อุปกรณ์กิจกรรม/ศิลปะ', '🎨'),
  ('cat-equipment', 'อุปกรณ์ยืม-คืน (ครุภัณฑ์)', '📽️')
ON CONFLICT (id) DO NOTHING;

-- 6. ข้อมูลกลุ่มสาระฯ / แผนกตั้งต้น (Initial Departments)
INSERT INTO departments (id, name) VALUES
  ('dept-sci', 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี'),
  ('dept-math', 'กลุ่มสาระฯ คณิตศาสตร์'),
  ('dept-thai', 'กลุ่มสาระฯ ภาษาไทย'),
  ('dept-foreign', 'กลุ่มสาระฯ ภาษาต่างประเทศ'),
  ('dept-social', 'กลุ่มสาระฯ สังคมศึกษา ศาสนาฯ'),
  ('dept-art', 'กลุ่มสาระฯ ศิลปะ / การงาน'),
  ('dept-pe', 'กลุ่มสาระฯ สุขศึกษาและพลศึกษา'),
  ('dept-admin', 'งานธุรการและสารบรรณ'),
  ('dept-academic', 'งานวิชาการและทะเบียน'),
  ('dept-facility', 'งานพัสดุ อาคารสถานที่')
ON CONFLICT (id) DO NOTHING;

-- 7. ข้อมูลสินค้าตัวอย่างสำหรับโรงเรียน (Initial Items)
INSERT INTO items (id, code, name, category_id, current_stock, min_stock, unit, location, note, is_borrowable) VALUES
  ('item-1', 'A4-DOUBLE-A', 'กระดาษ Double A 80 แกรม (A4)', 'cat-paper', 45, 15, 'รีม', 'ตู้พัสดุ A ชั้น 2', 'ใช้สำหรับพิมพ์เอกสารราชการและข้อสอบ', false),
  ('item-2', 'PEN-WB-BLUE', 'ปากกาไวท์บอร์ดตราม้า (น้ำเงิน)', 'cat-stationery', 32, 10, 'ด้าม', 'กล่องเครื่องเขียน B1 ชั้น 1', 'เบิกสำหรับประจำห้องเรียน', false),
  ('item-3', 'PEN-WB-RED', 'ปากกาไวท์บอร์ดตราม้า (แดง)', 'cat-stationery', 18, 10, 'ด้าม', 'กล่องเครื่องเขียน B1 ชั้น 1', 'สำหรับตรวจงานและเน้นข้อความ', false),
  ('item-4', 'INK-BROTHER-2380', 'ตลับหมึกเลเซอร์ Brother TN-2380', 'cat-it', 3, 4, 'กล่อง', 'ตู้พัสดุ C ชั้น 3 (ห้องเซิร์ฟเวอร์)', 'สำหรับเครื่องพิมพ์ห้องวิชาการและห้องสมุด', false),
  ('item-5', 'CL-DET-PINK', 'น้ำยาล้างห้องน้ำ มาจิคลีน (ชมพู)', 'cat-cleaning', 14, 6, 'ขวด', 'ห้องเก็บของนักการภารโรง', 'เบิกสัปดาห์ละ 1-2 ครั้ง', false),
  ('item-6', 'CRAFT-POSTER-COLOR', 'สีโปสเตอร์ 12 สี มาสเตอร์อาร์ต', 'cat-craft', 25, 8, 'ชุด', 'ห้องกลุ่มสาระฯ ศิลปะ', 'ใช้จัดบอร์ดและกิจกรรมนักเรียน', false),
  ('item-7', 'EQ-PROJ-EPSON-01', 'โปรเจคเตอร์พกพา Epson EB-X06', 'cat-equipment', 2, 1, 'เครื่อง', 'ตู้กระจก ห้องโสตทัศนศึกษา', 'อุปกรณ์ยืม-คืน สำหรับห้องเรียนพิเศษ/ประชุม', true),
  ('item-8', 'EQ-HDMI-10M', 'สายสัญญาณ HDMI ยาว 10 เมตร', 'cat-equipment', 5, 2, 'เส้น', 'กล่องสายสัญญาณ ห้องโสตฯ', 'อุปกรณ์ยืม-คืน', true)
ON CONFLICT (id) DO NOTHING;
