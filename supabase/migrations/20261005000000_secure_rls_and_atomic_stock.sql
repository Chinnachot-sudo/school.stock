-- ==============================================================================
-- 20261005000000_secure_rls_and_atomic_stock.sql
-- 1. Standardize Permissions schema & seed aliases (dot and colon syntax)
-- 2. Revoke wide-open anon RLS policies and restrict table access to authenticated RBAC
-- 3. Add Atomic Stock & POS Sale RPCs with row-level locking (FOR UPDATE)
-- 4. Restrict RPC EXECUTE privileges to authorized roles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Standardize & Seed Permissions Aliases
-- ------------------------------------------------------------------------------
INSERT INTO public.permissions (id, name, module, description) VALUES
  -- Colon-delimited aliases to match application keys
  ('inventory:item:read', 'ดูรายการสินค้า', 'Inventory', 'สิทธิ์ในการดูข้อมูลรายการสินค้าและสต็อกคงเหลือ'),
  ('inventory:item:create', 'เพิ่มสินค้าใหม่', 'Inventory', 'สิทธิ์ในการสร้างรายการพัสดุหรือสินค้าใหม่'),
  ('inventory:item:update', 'แก้ไขข้อมูลสินค้า', 'Inventory', 'สิทธิ์ในการแก้ไขชื่อ หมวดหมู่ หรือราคาของสินค้า'),
  ('inventory:item:delete', 'ลบสินค้า', 'Inventory', 'สิทธิ์ระดับสูงในการลบสินค้าออกจากระบบ'),
  ('inventory:stock:restock', 'รับของเข้าสต็อก (+In)', 'Inventory', 'สิทธิ์ในการรับพัสดุเข้าคลังและเพิ่มยอดคงเหลือ'),
  ('inventory:stock:issue', 'เบิกจ่ายพัสดุ (-Out)', 'Inventory', 'สิทธิ์ในการทำรายการเบิกของออกจากสต็อก'),
  ('inventory:stock:adjust', 'ปรับปรุงสต็อก', 'Inventory', 'สิทธิ์ในการปรับยอดคงเหลือจริง'),
  ('pos:receipt:read', 'ดูประวัติใบเสร็จและยอดเงิน', 'Finance', 'สิทธิ์ในการดูรายการขายและรายงานการเงิน'),
  ('pos:receipt:create', 'สร้างใบเสร็จ/ขายสินค้า POS', 'Finance', 'สิทธิ์ในการคิดเงินและออกใบเสร็จรับเงิน'),
  ('pos:receipt:void', 'ยกเลิกใบเสร็จ (Void)', 'Finance', 'สิทธิ์ในการกดยกเลิกและคืนยอดสต็อกใบเสร็จที่ผิดพลาด'),
  ('customer:read', 'ดูข้อมูลลูกค้าและนักเรียน', 'Customers', 'สิทธิ์ในการค้นหาและดูข้อมูลนักเรียน/ลูกค้า'),
  ('customer:create', 'เพิ่มข้อมูลลูกค้า', 'Customers', 'สิทธิ์ในการสร้างข้อมูลลูกค้า/นักเรียน'),
  ('customer:update', 'แก้ไขข้อมูลลูกค้า', 'Customers', 'สิทธิ์ในการแก้ไขข้อมูลลูกค้า/นักเรียน'),
  ('customer:delete', 'ลบข้อมูลลูกค้า', 'Customers', 'สิทธิ์ในการลบข้อมูลลูกค้า/นักเรียน'),
  ('audit:log:read', 'ดูประวัติความปลอดภัย (Audit Logs)', 'Security', 'สิทธิ์ในการตรวจสอบประวัติการทำรายการของผู้ใช้'),
  ('iam:user:read', 'ดูรายชื่อผู้ใช้งาน', 'Administration', 'สิทธิ์ในการดูรายชื่อและสถานะของผู้ใช้งานในระบบ'),
  ('iam:user:create', 'สร้างผู้ใช้ใหม่', 'Administration', 'สิทธิ์ในการเพิ่มผู้ใช้'),
  ('iam:user:update', 'จัดการผู้ใช้และสิทธิ์', 'Administration', 'สิทธิ์ในการแก้ไขบทบาทผู้ใช้งาน'),
  ('iam:user:delete', 'ลบผู้ใช้', 'Administration', 'สิทธิ์ในการลบผู้ใช้งาน'),
  ('iam:settings:configure', 'ตั้งค่าระบบ', 'Administration', 'สิทธิ์ในการแก้ไขการตั้งค่าระบบส่วนกลาง')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  module = EXCLUDED.module,
  description = EXCLUDED.description;

-- Grant permissions to SUPER_ADMIN & ADMIN roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'SUPER_ADMIN', id FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'ADMIN', id FROM public.permissions
WHERE id NOT IN ('inventory:item:delete', 'inventory.items.delete', 'audit:log:read', 'audit.logs.read')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Drop Insecure Old Policies Across All Public Tables
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS items_select_policy ON public.items;
DROP POLICY IF EXISTS items_insert_policy ON public.items;
DROP POLICY IF EXISTS items_update_policy ON public.items;
DROP POLICY IF EXISTS items_delete_policy ON public.items;
DROP POLICY IF EXISTS items_read_policy ON public.items;
DROP POLICY IF EXISTS items_write_policy ON public.items;

DROP POLICY IF EXISTS transactions_all_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_select_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_read_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_write_policy ON public.transactions;

DROP POLICY IF EXISTS receipts_all_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_select_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_insert_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_update_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_read_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_write_policy ON public.receipts;

DROP POLICY IF EXISTS customers_all_policy ON public.customers;
DROP POLICY IF EXISTS customers_select_policy ON public.customers;
DROP POLICY IF EXISTS customers_modify_policy ON public.customers;
DROP POLICY IF EXISTS customers_read_policy ON public.customers;
DROP POLICY IF EXISTS customers_write_policy ON public.customers;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_all_policy ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_select_policy ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Apply Strict RLS Policies (Using valid p.id column)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

-- 3.1 Items
CREATE POLICY items_select_policy ON public.items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY items_insert_policy ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('inventory:item:create', 'inventory.items.create', 'users.manage', 'iam:user:update')
    )
  );

CREATE POLICY items_update_policy ON public.items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('inventory:item:update', 'inventory.items.edit', 'inventory:stock:issue', 'inventory.stock.issue', 'inventory:stock:restock', 'inventory.stock.receive', 'pos:receipt:create', 'finance.pos.sell')
    )
  );

CREATE POLICY items_delete_policy ON public.items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('inventory:item:delete', 'inventory.items.delete', 'users.manage', 'iam:user:update')
    )
  );

-- 3.2 Transactions
CREATE POLICY transactions_select_policy ON public.transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY transactions_insert_policy ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('inventory:stock:issue', 'inventory.stock.issue', 'inventory:stock:restock', 'inventory.stock.receive', 'inventory:stock:adjust', 'pos:receipt:create', 'finance.pos.sell')
    )
  );

-- 3.3 Receipts
CREATE POLICY receipts_select_policy ON public.receipts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY receipts_insert_policy ON public.receipts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('pos:receipt:create', 'finance.pos.sell')
    )
  );

CREATE POLICY receipts_update_policy ON public.receipts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('pos:receipt:void', 'finance.receipts.void', 'users.manage', 'iam:user:update')
    )
  );

-- 3.4 Customers
CREATE POLICY customers_select_policy ON public.customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY customers_modify_policy ON public.customers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('customer:update', 'customer:create', 'customer:delete', 'customers.manage')
    )
  );

-- 3.5 Audit Logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY audit_logs_select_policy ON public.audit_logs
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.role_permissions rp ON ur.role_id = rp.role_id
          JOIN public.permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = auth.uid()::text AND p.id IN ('audit:log:read', 'audit.logs.read')
        )
      );

    CREATE POLICY audit_logs_insert_policy ON public.audit_logs
      FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Atomic RPC Functions for Stock Movement & POS Checkout
-- ------------------------------------------------------------------------------

-- 4.1 Deduct Stock (with row lock & balance validation)
CREATE OR REPLACE FUNCTION public.deduct_item_stock(
  p_item_id TEXT,
  p_quantity INT
)
RETURNS TABLE (
  success BOOLEAN,
  new_stock INT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INT;
  v_updated INT;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT false, 0, 'Deduction quantity must be greater than zero'::TEXT;
    RETURN;
  END IF;

  -- Lock row to prevent race conditions
  SELECT current_stock INTO v_current
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Item not found'::TEXT;
    RETURN;
  END IF;

  IF v_current < p_quantity THEN
    RETURN QUERY SELECT false, v_current, ('Insufficient stock. Available: ' || v_current || ', Requested: ' || p_quantity)::TEXT;
    RETURN;
  END IF;

  UPDATE public.items
  SET current_stock = current_stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id
  RETURNING current_stock INTO v_updated;

  RETURN QUERY SELECT true, v_updated, 'Stock deducted successfully'::TEXT;
END;
$$;

-- 4.2 Increase Stock (Restock/Receive)
CREATE OR REPLACE FUNCTION public.increase_item_stock(
  p_item_id TEXT,
  p_quantity INT
)
RETURNS TABLE (
  success BOOLEAN,
  new_stock INT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT false, 0, 'Increase quantity must be greater than zero'::TEXT;
    RETURN;
  END IF;

  UPDATE public.items
  SET current_stock = current_stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id
  RETURNING current_stock INTO v_updated;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Item not found'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_updated, 'Stock increased successfully'::TEXT;
END;
$$;

-- 4.3 Adjust Stock
CREATE OR REPLACE FUNCTION public.adjust_item_stock(
  p_item_id TEXT,
  p_new_stock INT
)
RETURNS TABLE (
  success BOOLEAN,
  new_stock INT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_new_stock < 0 THEN
    RETURN QUERY SELECT false, 0, 'New stock cannot be negative'::TEXT;
    RETURN;
  END IF;

  UPDATE public.items
  SET current_stock = p_new_stock,
      updated_at = NOW()
  WHERE id = p_item_id
  RETURNING current_stock INTO v_updated;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Item not found'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_updated, 'Stock adjusted successfully'::TEXT;
END;
$$;

-- 4.4 All-in-One Atomic POS Sale (Receipt + Stock Deductions + Transaction logs in 1 DB Transaction)
CREATE OR REPLACE FUNCTION public.create_pos_sale(
  p_receipt JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_item_id TEXT;
  v_item_code TEXT;
  v_item_name TEXT;
  v_qty INT;
  v_current_stock INT;
  v_new_stock INT;
  v_receipt_id TEXT;
  v_receipt_num TEXT;
  v_cust_name TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  v_receipt_id := p_receipt->>'id';
  v_receipt_num := p_receipt->>'receiptNumber';
  v_cust_name := COALESCE(p_receipt->>'customerName', 'Parent / Student');

  -- 1. Validate & Lock all items, check stock levels
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := v_item->>'itemId';
    v_qty := (v_item->>'quantity')::INT;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity for item % must be positive', v_item_id;
    END IF;

    -- Lock row
    SELECT current_stock, code, name INTO v_current_stock, v_item_code, v_item_name
    FROM public.items
    WHERE id = v_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item % not found in database', v_item_id;
    END IF;

    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%": available %, requested %', v_item_name, v_current_stock, v_qty;
    END IF;

    -- Deduct stock
    UPDATE public.items
    SET current_stock = current_stock - v_qty,
        updated_at = v_now
    WHERE id = v_item_id
    RETURNING current_stock INTO v_new_stock;

    -- Insert sale transaction record
    INSERT INTO public.transactions (
      id, item_id, item_name, item_code, type, quantity,
      balance_after, department, requester_name, note,
      receipt_id, created_at
    ) VALUES (
      'tx-sale-' || floor(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 1000)::text,
      v_item_id,
      v_item_name,
      v_item_code,
      'SALE',
      v_qty,
      v_new_stock,
      'School Store & Co-op',
      v_cust_name,
      'Sale as per Receipt #' || v_receipt_num,
      v_receipt_id,
      v_now
    );
  END LOOP;

  -- 2. Insert receipt
  INSERT INTO public.receipts (
    id, receipt_number, customer_name, customer_type, student_class,
    student_id, payment_method, items, subtotal, discount,
    total_amount, cash_received, change, cashier_name, cashier_email,
    note, status, created_at
  ) VALUES (
    v_receipt_id,
    v_receipt_num,
    v_cust_name,
    COALESCE(p_receipt->>'customerType', 'STUDENT'),
    p_receipt->>'studentClass',
    p_receipt->>'studentId',
    COALESCE(p_receipt->>'paymentMethod', 'CASH'),
    p_items,
    (p_receipt->>'subtotal')::NUMERIC,
    COALESCE((p_receipt->>'discount')::NUMERIC, 0),
    (p_receipt->>'totalAmount')::NUMERIC,
    COALESCE((p_receipt->>'cashReceived')::NUMERIC, (p_receipt->>'totalAmount')::NUMERIC),
    COALESCE((p_receipt->>'change')::NUMERIC, 0),
    p_receipt->>'cashierName',
    p_receipt->>'cashierEmail',
    p_receipt->>'note',
    'COMPLETED',
    v_now
  );

  RETURN jsonb_build_object('success', true, 'receiptId', v_receipt_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Restrict RPC EXECUTE Privileges
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.deduct_item_stock(TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increase_item_stock(TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_item_stock(TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_pos_sale(JSONB, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.deduct_item_stock(TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increase_item_stock(TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_item_stock(TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_pos_sale(JSONB, JSONB) TO authenticated, service_role;
