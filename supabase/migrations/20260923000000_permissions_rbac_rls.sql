-- ==============================================================================
-- 20260923000000_permissions_rbac_rls.sql
-- 3-Tier RBAC/PBAC Schema, Security Functions, and Row-Level Security (RLS)
-- ==============================================================================

-- 1. Create private schema for security functions (hidden from public API)
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Create tables for permissions, roles, and assignments
CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
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
  expires_at TIMESTAMPTZ, -- Optional expiration for temporary roles
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- Index for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);

-- 3. Seed Standard System Permissions
INSERT INTO public.permissions (id, name, module, description) VALUES
  -- Inventory
  ('inventory.items.read', 'ดูรายการสินค้า', 'Inventory', 'สิทธิ์ในการดูข้อมูลรายการสินค้าและสต็อกคงเหลือ'),
  ('inventory.items.create', 'เพิ่มสินค้าใหม่', 'Inventory', 'สิทธิ์ในการสร้างรายการพัสดุหรือสินค้าใหม่'),
  ('inventory.items.edit', 'แก้ไขข้อมูลสินค้า', 'Inventory', 'สิทธิ์ในการแก้ไขชื่อ หมวดหมู่ หรือราคาของสินค้า'),
  ('inventory.items.delete', 'ลบสินค้า', 'Inventory', 'สิทธิ์ระดับสูงในการลบสินค้าออกจากระบบ'),
  ('inventory.stock.receive', 'รับของเข้าสต็อก (+In)', 'Inventory', 'สิทธิ์ในการรับพัสดุเข้าคลังและเพิ่มยอดคงเหลือ'),
  ('inventory.stock.issue', 'เบิกจ่ายพัสดุ (-Out)', 'Inventory', 'สิทธิ์ในการทำรายการเบิกของออกจากสต็อก'),
  ('inventory.labels.print', 'พิมพ์ QR Code / Barcode', 'Inventory', 'สิทธิ์ในการพิมพ์ป้ายบาร์โค้ดสินค้า'),
  
  -- Finance & POS
  ('finance.pos.sell', 'ขายสินค้าผ่านระบบ POS', 'Finance', 'สิทธิ์ในการคิดเงินและออกใบเสร็จรับเงิน'),
  ('finance.receipts.read', 'ดูประวัติใบเสร็จและยอดเงิน', 'Finance', 'สิทธิ์ในการดูรายการขายและรายงานการเงิน'),
  ('finance.receipts.void', 'ยกเลิกใบเสร็จ (Void)', 'Finance', 'สิทธิ์ในการกดยกเลิกและคืนยอดสต็อกใบเสร็จที่ผิดพลาด'),
  
  -- Customers & Students
  ('customers.read', 'ดูข้อมูลลูกค้าและนักเรียน', 'Customers', 'สิทธิ์ในการค้นหาและดูข้อมูลนักเรียน/ลูกค้า'),
  ('customers.manage', 'จัดการข้อมูลลูกค้า/นักเรียน', 'Customers', 'สิทธิ์ในการเพิ่มหรือแก้ไขข้อมูลลูกค้า/นักเรียน'),
  
  -- Reports & Audit
  ('reports.export', 'ส่งออกรายงาน Excel/CSV', 'Reports', 'สิทธิ์ในการ Export รายงานการเคลื่อนไหวสต็อกและยอดขาย'),
  ('audit.logs.read', 'ดูประวัติความปลอดภัย (Audit Logs)', 'Security', 'สิทธิ์ในการตรวจสอบประวัติการทำรายการของผู้ใช้'),
  
  -- User & System Administration
  ('users.read', 'ดูรายชื่อผู้ใช้งาน', 'Administration', 'สิทธิ์ในการดูรายชื่อและสถานะของผู้ใช้งานในระบบ'),
  ('users.manage', 'จัดการผู้ใช้และสิทธิ์', 'Administration', 'สิทธิ์ในการเพิ่ม ลบ หรือแก้ไขบทบาทผู้ใช้งาน'),
  ('system.configure', 'ตั้งค่าระบบ', 'Administration', 'สิทธิ์ในการแก้ไขการตั้งค่าระบบส่วนกลาง')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  module = EXCLUDED.module,
  description = EXCLUDED.description;

-- 4. Seed Standard Roles
INSERT INTO public.roles (id, name, description, is_system) VALUES
  ('SUPER_ADMIN', 'Super Administrator', 'ผู้ดูแลระบบสูงสุด มีสิทธิ์เต็มทุกส่วนของระบบ', true),
  ('ADMIN', 'Inventory & Store Administrator', 'เจ้าหน้าที่บริหารคลังสินค้าและระบบร้านค้า', true),
  ('TEACHER', 'Teacher / General Staff', 'ครูและบุคลากรทั่วไป (เบิกของ, ใช้งาน POS)', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 5. Seed Role Permissions
-- 5.1 Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'SUPER_ADMIN', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- 5.2 Admin gets all permissions EXCEPT deleting items and audit logs
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'ADMIN', id FROM public.permissions
WHERE id NOT IN ('inventory.items.delete', 'audit.logs.read')
ON CONFLICT DO NOTHING;

-- 5.3 Teacher gets basic operational permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
  ('TEACHER', 'inventory.items.read'),
  ('TEACHER', 'inventory.stock.issue'),
  ('TEACHER', 'finance.pos.sell'),
  ('TEACHER', 'customers.read')
ON CONFLICT DO NOTHING;

-- 6. Migrate existing users from app_users into public.user_roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_users') THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT id, 
      CASE 
        WHEN role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
        WHEN role = 'ADMIN' THEN 'ADMIN'
        ELSE 'TEACHER'
      END
    FROM public.app_users
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- 7. Database Function for Permission Checking
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
  -- Check if session user is set via auth.uid() or custom request header
  current_user_id := coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('app.current_user_id', true), '')
  );

  -- If no user is identified, deny access
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has active role that grants this permission (or SUPER_ADMIN wildcard)
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = current_user_id
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND (rp.permission_id = required_permission OR ur.role_id = 'SUPER_ADMIN')
  ) INTO has_perm;

  RETURN coalesce(has_perm, false);
END;
$$;

-- Helper Function to get all active permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(target_user_id TEXT)
RETURNS TABLE (permission_id TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT rp.permission_id
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  WHERE ur.user_id = target_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  UNION
  SELECT id AS permission_id
  FROM public.permissions
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id 
      AND role_id = 'SUPER_ADMIN'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 8. Enable Row-Level Security (RLS) on Business Tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_users') THEN
    ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 9. Clean up old permissive policies
DROP POLICY IF EXISTS "public_categories_all" ON public.categories;
DROP POLICY IF EXISTS "public_departments_all" ON public.departments;
DROP POLICY IF EXISTS "public_items_all" ON public.items;
DROP POLICY IF EXISTS "public_transactions_all" ON public.transactions;
DROP POLICY IF EXISTS "public_customers_all" ON public.customers;
DROP POLICY IF EXISTS "public_receipts_all" ON public.receipts;

-- 10. Create Standard Read/Write Policies for RLS
-- Categories & Departments: Readable by anyone authenticated, manageable by inventory admins
CREATE POLICY "categories_read_policy" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "departments_read_policy" ON public.departments FOR SELECT TO public USING (true);

-- Items: Read by permitted users, write protected
CREATE POLICY "items_select_policy" ON public.items
  FOR SELECT TO authenticated, anon
  USING (true); -- Catalog viewing allowed for POS/inventory

CREATE POLICY "items_insert_policy" ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (private.authorize('inventory.items.create'));

CREATE POLICY "items_update_policy" ON public.items
  FOR UPDATE TO authenticated
  USING (private.authorize('inventory.items.edit'));

CREATE POLICY "items_delete_policy" ON public.items
  FOR DELETE TO authenticated
  USING (private.authorize('inventory.items.delete'));

-- Receipts: Read by finance/cashiers, void by finance managers
CREATE POLICY "receipts_select_policy" ON public.receipts
  FOR SELECT TO authenticated
  USING (private.authorize('finance.receipts.read') OR private.authorize('finance.pos.sell'));

CREATE POLICY "receipts_insert_policy" ON public.receipts
  FOR INSERT TO authenticated
  WITH CHECK (private.authorize('finance.pos.sell'));

CREATE POLICY "receipts_update_policy" ON public.receipts
  FOR UPDATE TO authenticated
  USING (private.authorize('finance.receipts.void'));

-- Customers: Manageable by staff
CREATE POLICY "customers_select_policy" ON public.customers
  FOR SELECT TO authenticated
  USING (private.authorize('customers.read'));

CREATE POLICY "customers_modify_policy" ON public.customers
  FOR ALL TO authenticated
  USING (private.authorize('customers.manage'));
