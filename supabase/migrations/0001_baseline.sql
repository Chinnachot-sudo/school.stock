-- ==============================================================================
-- 0001_baseline.sql
-- Baseline RBAC/PBAC Schema, Roles, Permissions, and System Tables
-- ==============================================================================

-- 1. Private schema for internal functions
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Core Security & RBAC Tables
CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY, -- Colon-separated e.g. 'inventory:item:create'
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY, -- 'super_admin', 'legacy_admin', 'teacher'
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);

-- 3. Audit Logs Table with before/after JSONB columns
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  actor_id TEXT,
  actor_name TEXT,
  target_id TEXT,
  target_name TEXT,
  before JSONB,
  after JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS before JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS after JSONB;

-- 4. Seed Standard Roles
INSERT INTO public.roles (id, name, description, is_system) VALUES
  ('super_admin', 'Super Administrator', 'ผู้ดูแลระบบสูงสุด มีสิทธิ์เต็มทุกส่วนของระบบ', true),
  ('legacy_admin', 'Legacy Admin', 'บทบาทชั่วคราวระหว่างย้ายระบบ — ห้าม assign ให้ user ใหม่', true),
  ('teacher', 'Teacher / General Staff', 'ครูและบุคลากรทั่วไป (เบิกของ, ใช้งาน POS, ดูรายการสินค้า)', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system;

-- 5. Seed Standard Colon-Separated Permissions (No 'manage' keyword)
INSERT INTO public.permissions (id, name, module, description) VALUES
  -- Inventory
  ('inventory:item:read', 'ดูรายการสินค้า', 'Inventory', 'สิทธิ์ในการดูข้อมูลรายการสินค้าและสต็อกคงเหลือ'),
  ('inventory:item:create', 'เพิ่มสินค้าใหม่', 'Inventory', 'สิทธิ์ในการสร้างรายการพัสดุหรือสินค้าใหม่'),
  ('inventory:item:update', 'แก้ไขข้อมูลสินค้า', 'Inventory', 'สิทธิ์ในการแก้ไขชื่อ หมวดหมู่ หรือราคาของสินค้า'),
  ('inventory:item:delete', 'ลบสินค้า', 'Inventory', 'สิทธิ์ระดับสูงในการลบสินค้าออกจากระบบ'),
  ('inventory:stock:restock', 'รับของเข้าสต็อก (+In)', 'Inventory', 'สิทธิ์ในการรับพัสดุเข้าคลังและเพิ่มยอดคงเหลือ'),
  ('inventory:stock:issue', 'เบิกจ่ายพัสดุ (-Out)', 'Inventory', 'สิทธิ์ในการทำรายการเบิกของออกจากสต็อก'),
  
  -- POS & Receipts
  ('pos:receipt:read', 'ดูประวัติใบเสร็จและยอดขาย', 'POS', 'สิทธิ์ในการดูรายการขายและรายงานการเงิน'),
  ('pos:receipt:create', 'ขายสินค้าผ่านระบบ POS', 'POS', 'สิทธิ์ในการคิดเงินและออกใบเสร็จรับเงิน'),
  ('pos:receipt:void', 'ยกเลิกใบเสร็จ (Void)', 'POS', 'สิทธิ์ในการกดยกเลิกและคืนยอดสต็อกใบเสร็จที่ผิดพลาด'),
  ('pos:receipt:refund', 'คืนเงิน/คืนสินค้า', 'POS', 'สิทธิ์ในการทำเรื่องคืนเงินและรับของคืนสต็อก'),
  
  -- Customers & Students
  ('customer:read', 'ดูข้อมูลลูกค้าและนักเรียน', 'Customers', 'สิทธิ์ในการค้นหาและดูข้อมูลนักเรียน/ลูกค้า'),
  ('customer:create', 'เพิ่มข้อมูลลูกค้า/นักเรียน', 'Customers', 'สิทธิ์ในการสร้างประวัตินักเรียนและลูกค้าใหม่'),
  ('customer:update', 'แก้ไขข้อมูลลูกค้า/นักเรียน', 'Customers', 'สิทธิ์ในการอัปเดตข้อมูลนักเรียนและลูกค้า'),
  ('customer:delete', 'ลบข้อมูลลูกค้า/นักเรียน', 'Customers', 'สิทธิ์ในการลบประวัตินักเรียนหรือลูกค้า'),
  
  -- Labels & Reports
  ('label:print', 'พิมพ์ QR Code / Barcode', 'Labels', 'สิทธิ์ในการพิมพ์ป้ายบาร์โค้ดสินค้า'),
  ('report:read', 'ดูรายงานและสถิติ', 'Reports', 'สิทธิ์ในการดูรายงานสรุปยอดและการเงิน'),
  ('report:export', 'ส่งออกรายงาน Excel/CSV', 'Reports', 'สิทธิ์ในการ Export รายงานการเคลื่อนไหวสต็อกและยอดขาย'),
  
  -- IAM & Administration
  ('iam:user:read', 'ดูรายชื่อผู้ใช้งาน', 'IAM', 'สิทธิ์ในการดูรายชื่อและสถานะของผู้ใช้งานในระบบ'),
  ('iam:user:create', 'สร้างผู้ใช้ใหม่', 'IAM', 'สิทธิ์ในการเพิ่มบัญชีผู้ใช้งานใหม่'),
  ('iam:user:update', 'แก้ไขข้อมูลผู้ใช้', 'IAM', 'สิทธิ์ในการแก้ไขข้อมูลบัญชีผู้ใช้งาน'),
  ('iam:user:disable', 'ปิดการใช้งาน/ลบผู้ใช้', 'IAM', 'สิทธิ์ในการปิดการใช้งานหรือลบผู้ใช้'),
  ('iam:role:assign', 'กำหนดบทบาทและสิทธิ์', 'IAM', 'สิทธิ์ในการเปลี่ยนหรือมอบหมายบทบาทให้ผู้ใช้'),
  ('iam:settings:configure', 'ตั้งค่าระบบ', 'IAM', 'สิทธิ์ในการแก้ไขการตั้งค่าระบบส่วนกลาง'),
  ('audit:log:read', 'ดูประวัติความปลอดภัย (Audit Logs)', 'Security', 'สิทธิ์ในการตรวจสอบประวัติการทำรายการของผู้ใช้')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  module = EXCLUDED.module,
  description = EXCLUDED.description;

-- 6. Seed Role Permissions
-- 6.1 super_admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- 6.2 legacy_admin gets all permissions EXCEPT item delete, user disable, audit logs, and system settings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'legacy_admin', id FROM public.permissions
WHERE id NOT IN ('inventory:item:delete', 'iam:user:disable', 'audit:log:read', 'iam:settings:configure')
ON CONFLICT DO NOTHING;

-- 6.3 teacher gets basic operational permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
  ('teacher', 'inventory:item:read'),
  ('teacher', 'inventory:stock:issue'),
  ('teacher', 'pos:receipt:create'),
  ('teacher', 'pos:receipt:read'),
  ('teacher', 'customer:read')
ON CONFLICT DO NOTHING;

-- 7. Migrate existing users from UPPERCASE roles to lowercase normalized roles
DO $$
BEGIN
  -- Migrate app_users role column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_users') THEN
    UPDATE public.app_users SET role = 'super_admin' WHERE role = 'SUPER_ADMIN';
    UPDATE public.app_users SET role = 'legacy_admin' WHERE role IN ('ADMIN', 'INVENTORY_MANAGER');
    UPDATE public.app_users SET role = 'teacher' WHERE role IN ('TEACHER', 'STAFF');
  END IF;

  -- Migrate user_roles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    -- Delete obsolete uppercase assignments if lowercase exists, or update them
    UPDATE public.user_roles SET role_id = 'super_admin' WHERE role_id = 'SUPER_ADMIN';
    UPDATE public.user_roles SET role_id = 'legacy_admin' WHERE role_id = 'ADMIN';
    UPDATE public.user_roles SET role_id = 'teacher' WHERE role_id = 'TEACHER';
  END IF;
END $$;
