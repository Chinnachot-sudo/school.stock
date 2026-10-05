-- ==============================================================================
-- 20261005000000_secure_rls_and_atomic_stock.sql
-- 1. Standardize Permissions schema & seed aliases
-- 2. Create receipt_returns ledger table for idempotent & tracked returns
-- 3. Revoke wide-open anon/authenticated RLS policies on ALL public tables
-- 4. Restrict user_roles, roles, permissions, role_permissions modifications
-- 5. Secure audit_logs (Strict service_role inserts only)
-- 6. Production Atomic PostgreSQL RPCs:
--    - create_pos_sale (Receipt + Stock Deductions + Transaction Logs)
--    - create_stock_movement_batch (Stock Mutations + Budget Deductions + Transaction Logs)
--    - void_receipt_with_stock_restore (Void Receipt + Return-Aware Net Stock Restorations + Void Logs)
--    - process_receipt_return (Return Ledger + Duplicate/Over-return Prevention + Server-Verified Refund Calculation)
-- 7. Enforce SET search_path = public, pg_temp and exclusive service_role EXECUTE permissions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Standardize & Seed Permissions Aliases
-- ------------------------------------------------------------------------------
INSERT INTO public.permissions (id, name, module, description) VALUES
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
  ('pos:receipt:refund', 'คืนเงิน/คืนสินค้า (Return)', 'Finance', 'สิทธิ์ในการทำรายการคืนสินค้า'),
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

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'SUPER_ADMIN', id FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'ADMIN', id FROM public.permissions
WHERE id NOT IN ('inventory:item:delete', 'inventory.items.delete', 'audit:log:read', 'audit.logs.read')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Create Receipt Returns Ledger Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipt_returns (
  id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  items JSONB NOT NULL,
  total_refund NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  reason_detail TEXT,
  cashier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_returns_receipt_id ON public.receipt_returns(receipt_id);

-- ------------------------------------------------------------------------------
-- 3. Drop Insecure Old Policies Across All Public Tables
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

DROP POLICY IF EXISTS receipt_returns_select_policy ON public.receipt_returns;

DROP POLICY IF EXISTS customers_all_policy ON public.customers;
DROP POLICY IF EXISTS customers_select_policy ON public.customers;
DROP POLICY IF EXISTS customers_modify_policy ON public.customers;
DROP POLICY IF EXISTS customers_read_policy ON public.customers;
DROP POLICY IF EXISTS customers_write_policy ON public.customers;

DROP POLICY IF EXISTS user_roles_modify_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_read_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_all_policy ON public.user_roles;
DROP POLICY IF EXISTS permissions_read_policy ON public.permissions;
DROP POLICY IF EXISTS roles_read_policy ON public.roles;
DROP POLICY IF EXISTS role_permissions_read_policy ON public.role_permissions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_all_policy ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_select_policy ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Apply Strict RLS Policies
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receipt_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY items_select_policy ON public.items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY transactions_select_policy ON public.transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY receipts_select_policy ON public.receipts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY receipt_returns_select_policy ON public.receipt_returns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY customers_select_policy ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY permissions_select_policy ON public.permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY roles_select_policy ON public.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_permissions_select_policy ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_roles_select_policy ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('users.manage', 'iam:user:read', 'iam:user:update')
    )
  );

CREATE POLICY user_roles_insert_policy ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('users.manage', 'iam:user:update')
    )
  );

CREATE POLICY user_roles_delete_policy ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.id IN ('users.manage', 'iam:user:update')
    )
  );

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
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. Production Atomic PostgreSQL Stored Procedures
-- ------------------------------------------------------------------------------

-- 5.1 Atomic POS Sale (Receipt + Stock Deductions + Transaction Logs)
CREATE OR REPLACE FUNCTION public.create_pos_sale(
  p_receipt JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

    UPDATE public.items
    SET current_stock = current_stock - v_qty,
        updated_at = v_now
    WHERE id = v_item_id
    RETURNING current_stock INTO v_new_stock;

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

-- 5.2 Atomic Stock Movements + Budget Deductions + Transactions Batch RPC
CREATE OR REPLACE FUNCTION public.create_stock_movement_batch(
  p_type TEXT,
  p_items JSONB,
  p_metadata JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item JSONB;
  v_item_id TEXT;
  v_item_code TEXT;
  v_item_name TEXT;
  v_qty INT;
  v_unit_cost NUMERIC;
  v_current_stock INT;
  v_new_stock INT;
  v_tx_id TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_dept TEXT;
  v_dept_id TEXT;
  v_req_name TEXT;
  v_issued_user_id TEXT;
  v_issued_name TEXT;
  v_note TEXT;
  v_budget_deducted BOOLEAN := false;
  v_override_budget BOOLEAN;
  v_total_batch_cost NUMERIC := 0;
  v_alloc_budget NUMERIC := 0;
  v_spent_budget NUMERIC := 0;
  v_remaining_budget NUMERIC := 0;
  v_created_txs JSONB := '[]'::JSONB;
BEGIN
  v_dept := COALESCE(p_metadata->>'department', 'General Academic Dept');
  v_dept_id := p_metadata->>'departmentId';
  v_req_name := p_metadata->>'requesterName';
  v_issued_user_id := p_metadata->>'issuedToUserId';
  v_issued_name := p_metadata->>'issuedToName';
  v_note := p_metadata->>'note';
  v_override_budget := COALESCE((p_metadata->>'overrideBudget')::BOOLEAN, false);

  -- 1. Pre-calculate total cost
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    v_unit_cost := COALESCE((v_item->>'unitCost')::NUMERIC, 0);
    v_total_batch_cost := v_total_batch_cost + (v_qty * v_unit_cost);
  END LOOP;

  -- 2. Atomic Budget Verification and Deduction inside DB Transaction
  IF p_type = 'OUT' AND (v_dept_id IS NOT NULL OR (v_dept IS NOT NULL AND v_dept != 'ALL')) THEN
    IF v_dept_id IS NOT NULL THEN
      SELECT allocated_budget, spent_budget INTO v_alloc_budget, v_spent_budget
      FROM public.departments
      WHERE id = v_dept_id
      FOR UPDATE;
    ELSE
      SELECT id, allocated_budget, spent_budget INTO v_dept_id, v_alloc_budget, v_spent_budget
      FROM public.departments
      WHERE LOWER(name) = LOWER(v_dept)
      FOR UPDATE
      LIMIT 1;
    END IF;

    IF FOUND THEN
      v_alloc_budget := COALESCE(v_alloc_budget, 0);
      v_spent_budget := COALESCE(v_spent_budget, 0);
      v_remaining_budget := v_alloc_budget - v_spent_budget;

      IF v_total_batch_cost > v_remaining_budget AND NOT v_override_budget THEN
        RAISE EXCEPTION 'Department budget exceeded! Available: %, Required: %', v_remaining_budget, v_total_batch_cost;
      END IF;

      UPDATE public.departments
      SET spent_budget = spent_budget + v_total_batch_cost,
          updated_at = v_now
      WHERE id = v_dept_id;

      v_budget_deducted := true;
    END IF;
  END IF;

  -- 3. Atomic Stock Mutations and Transaction Inserts
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := v_item->>'itemId';
    v_qty := (v_item->>'quantity')::INT;
    v_unit_cost := COALESCE((v_item->>'unitCost')::NUMERIC, 0);

    IF p_type != 'ADJUST' AND v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity for item % must be positive', v_item_id;
    END IF;

    IF p_type = 'ADJUST' AND v_qty < 0 THEN
      RAISE EXCEPTION 'New stock quantity cannot be negative';
    END IF;

    -- Row Lock
    SELECT current_stock, code, name INTO v_current_stock, v_item_code, v_item_name
    FROM public.items
    WHERE id = v_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item % not found in database', v_item_id;
    END IF;

    IF p_type = 'OUT' THEN
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for "%": available %, requested %', v_item_name, v_current_stock, v_qty;
      END IF;
      v_new_stock := v_current_stock - v_qty;
    ELSIF p_type = 'IN' THEN
      v_new_stock := v_current_stock + v_qty;
    ELSIF p_type = 'ADJUST' THEN
      v_new_stock := v_qty;
    ELSE
      RAISE EXCEPTION 'Invalid transaction type %', p_type;
    END IF;

    UPDATE public.items
    SET current_stock = v_new_stock,
        updated_at = v_now
    WHERE id = v_item_id;

    v_tx_id := 'tx-' || floor(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 10000)::text;

    INSERT INTO public.transactions (
      id, item_id, item_name, item_code, type, quantity,
      balance_after, department, department_id, issued_to_user_id,
      issued_to_name, requester_name, unit_cost, total_cost,
      budget_deducted, note, created_at
    ) VALUES (
      v_tx_id,
      v_item_id,
      v_item_name,
      v_item_code,
      p_type,
      v_qty,
      v_new_stock,
      v_dept,
      v_dept_id,
      v_issued_user_id,
      v_issued_name,
      COALESCE(v_req_name, v_issued_name),
      v_unit_cost,
      v_qty * v_unit_cost,
      v_budget_deducted,
      v_note,
      v_now
    );

    v_created_txs := v_created_txs || jsonb_build_object(
      'id', v_tx_id,
      'itemId', v_item_id,
      'itemName', v_item_name,
      'itemCode', v_item_code,
      'type', p_type,
      'quantity', v_qty,
      'balanceAfter', v_new_stock,
      'department', v_dept,
      'createdAt', v_now
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'count', jsonb_array_length(v_created_txs),
    'transactions', v_created_txs,
    'totalCost', v_total_batch_cost,
    'budgetDeducted', v_budget_deducted
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5.3 Return-Aware Atomic Void Receipt (Restores only Net Unreturned Inventory)
CREATE OR REPLACE FUNCTION public.void_receipt_with_stock_restore(
  p_receipt_id TEXT,
  p_void_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rc RECORD;
  v_item JSONB;
  v_ret_rec RECORD;
  v_ret_item JSONB;
  v_item_id TEXT;
  v_item_code TEXT;
  v_item_name TEXT;
  v_purchased_qty INT;
  v_returned_qty INT;
  v_net_restore_qty INT;
  v_current_stock INT;
  v_new_stock INT;
  v_now TIMESTAMPTZ := NOW();
  v_items_json JSONB;
BEGIN
  -- 1. Lock receipt row
  SELECT * INTO v_rc
  FROM public.receipts
  WHERE id = p_receipt_id OR receipt_number = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt % not found in database', p_receipt_id;
  END IF;

  IF v_rc.status = 'VOIDED' THEN
    RAISE EXCEPTION 'Receipt #% has already been voided', v_rc.receipt_number;
  END IF;

  -- 2. Mark receipt as VOIDED
  UPDATE public.receipts
  SET status = 'VOIDED',
      void_reason = p_void_reason
  WHERE id = v_rc.id;

  -- 3. Parse items and restore net unreturned stock atomically
  IF jsonb_typeof(v_rc.items::jsonb) = 'array' THEN
    v_items_json := v_rc.items::jsonb;
  ELSE
    v_items_json := '[]'::jsonb;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items_json)
  LOOP
    v_item_id := v_item->>'itemId';
    v_purchased_qty := (v_item->>'quantity')::INT;

    -- Calculate previously returned quantity for this item
    v_returned_qty := 0;
    FOR v_ret_rec IN SELECT items FROM public.receipt_returns WHERE receipt_id = v_rc.id
    LOOP
      IF jsonb_typeof(v_ret_rec.items::jsonb) = 'array' THEN
        FOR v_ret_item IN SELECT * FROM jsonb_array_elements(v_ret_rec.items::jsonb)
        LOOP
          IF v_ret_item->>'itemId' = v_item_id THEN
            v_returned_qty := v_returned_qty + COALESCE((v_ret_item->>'quantity')::INT, 0);
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    -- Net quantity to restore (only items not already returned and restocked)
    v_net_restore_qty := GREATEST(0, v_purchased_qty - v_returned_qty);

    IF v_net_restore_qty > 0 THEN
      SELECT current_stock, code, name INTO v_current_stock, v_item_code, v_item_name
      FROM public.items
      WHERE id = v_item_id
      FOR UPDATE;

      IF FOUND THEN
        v_new_stock := COALESCE(v_current_stock, 0) + v_net_restore_qty;

        UPDATE public.items
        SET current_stock = v_new_stock,
            updated_at = v_now
        WHERE id = v_item_id;

        INSERT INTO public.transactions (
          id, item_id, item_name, item_code, type, quantity,
          balance_after, department, requester_name, note,
          receipt_id, created_at
        ) VALUES (
          'tx-void-' || floor(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 1000)::text,
          v_item_id,
          v_item_name,
          v_item_code,
          'VOID_SALE',
          v_net_restore_qty,
          v_new_stock,
          'School Store & Co-op',
          'System (Void Transaction)',
          'Restocked net unreturned items from voided receipt #' || v_rc.receipt_number || ' (' || p_void_reason || ')',
          v_rc.id,
          v_now
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'receiptId', v_rc.id,
    'receiptNumber', v_rc.receipt_number,
    'message', 'Receipt voided and unreturned inventory restored successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5.4 Production Atomic Process Receipt Return (With Cumulative Return Ledger & True Price Calculation)
DROP FUNCTION IF EXISTS public.process_receipt_return(TEXT, JSONB, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.process_receipt_return(
  p_return_id TEXT,
  p_receipt_id TEXT,
  p_items JSONB,
  p_reason TEXT,
  p_reason_detail TEXT,
  p_cashier_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rc RECORD;
  v_ret_rec RECORD;
  v_prev_item JSONB;
  v_item JSONB;
  v_orig_item JSONB;
  v_item_id TEXT;
  v_item_code TEXT;
  v_item_name TEXT;
  v_return_qty INT;
  v_orig_qty INT;
  v_prev_returned_qty INT;
  v_remaining_returnable INT;
  v_current_stock INT;
  v_new_stock INT;
  v_total_refund NUMERIC := 0;
  v_server_unit_price NUMERIC := 0;
  v_line_refund NUMERIC := 0;
  v_now TIMESTAMPTZ := NOW();
  v_orig_items_json JSONB;
  v_validated_return_items JSONB := '[]'::JSONB;
  v_matched BOOLEAN;
  v_req_aggregated JSONB := '{}'::JSONB;
  v_agg_key TEXT;
  v_agg_qty INT;
BEGIN
  -- 1. Check Idempotency (Prevent Duplicate Processing)
  IF EXISTS (SELECT 1 FROM public.receipt_returns WHERE id = p_return_id) THEN
    SELECT * INTO v_rc FROM public.receipt_returns WHERE id = p_return_id;
    RETURN jsonb_build_object(
      'success', true,
      'receiptId', v_rc.receipt_id,
      'receiptNumber', v_rc.receipt_number,
      'totalRefund', v_rc.total_refund,
      'message', 'Return already processed (idempotent)'
    );
  END IF;

  -- 2. Lock receipt row
  SELECT * INTO v_rc
  FROM public.receipts
  WHERE id = p_receipt_id OR receipt_number = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt % not found in database', p_receipt_id;
  END IF;

  IF v_rc.status = 'VOIDED' THEN
    RAISE EXCEPTION 'Cannot return items from a voided receipt #%', v_rc.receipt_number;
  END IF;

  IF jsonb_typeof(v_rc.items::jsonb) = 'array' THEN
    v_orig_items_json := v_rc.items::jsonb;
  ELSE
    v_orig_items_json := '[]'::jsonb;
  END IF;

  -- 3. Pre-aggregate requested items by itemId to prevent duplicate line bypass
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := v_item->>'itemId';
    v_return_qty := (v_item->>'quantity')::INT;

    IF v_return_qty <= 0 THEN
      RAISE EXCEPTION 'Return quantity must be greater than zero for item %', v_item_id;
    END IF;

    IF v_req_aggregated ? v_item_id THEN
      v_agg_qty := (v_req_aggregated->>v_item_id)::INT + v_return_qty;
    ELSE
      v_agg_qty := v_return_qty;
    END IF;
    v_req_aggregated := jsonb_set(v_req_aggregated, ARRAY[v_item_id], to_jsonb(v_agg_qty));
  END LOOP;

  -- 4. Validate return quantities against Cumulative Return Ledger & True Database Prices
  FOR v_agg_key IN SELECT jsonb_object_keys(v_req_aggregated)
  LOOP
    v_item_id := v_agg_key;
    v_return_qty := (v_req_aggregated->>v_item_id)::INT;
    v_matched := false;

    -- Find original line on receipt
    FOR v_orig_item IN SELECT * FROM jsonb_array_elements(v_orig_items_json)
    LOOP
      IF (v_orig_item->>'itemId' = v_item_id) OR (v_orig_item->>'itemCode' = v_item_id) THEN
        v_orig_qty := (v_orig_item->>'quantity')::INT;
        v_item_name := v_orig_item->>'itemName';
        v_item_code := v_orig_item->>'itemCode';
        -- Use Server-Stored Price from Receipt (Never trust client pricing)
        v_server_unit_price := COALESCE((v_orig_item->>'unitPrice')::NUMERIC, 0);
        v_matched := true;
        EXIT;
      END IF;
    END LOOP;

    IF NOT v_matched THEN
      RAISE EXCEPTION 'Item % was not found on receipt #%', v_item_id, v_rc.receipt_number;
    END IF;

    -- Calculate previously returned quantity across all historical returns for this receipt
    v_prev_returned_qty := 0;
    FOR v_ret_rec IN SELECT items FROM public.receipt_returns WHERE receipt_id = v_rc.id
    LOOP
      IF jsonb_typeof(v_ret_rec.items::jsonb) = 'array' THEN
        FOR v_prev_item IN SELECT * FROM jsonb_array_elements(v_ret_rec.items::jsonb)
        LOOP
          IF v_prev_item->>'itemId' = v_item_id THEN
            v_prev_returned_qty := v_prev_returned_qty + COALESCE((v_prev_item->>'quantity')::INT, 0);
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    v_remaining_returnable := v_orig_qty - v_prev_returned_qty;

    IF v_return_qty > v_remaining_returnable THEN
      RAISE EXCEPTION 'Cannot return % units of "%": only % units remaining returnable (Purchased: %, Previously Returned: %)',
        v_return_qty, v_item_name, v_remaining_returnable, v_orig_qty, v_prev_returned_qty;
    END IF;

    -- Compute line refund securely from database unit price
    v_line_refund := v_return_qty * v_server_unit_price;
    v_total_refund := v_total_refund + v_line_refund;

    v_validated_return_items := v_validated_return_items || jsonb_build_object(
      'itemId', v_item_id,
      'itemCode', v_item_code,
      'itemName', v_item_name,
      'quantity', v_return_qty,
      'unitPrice', v_server_unit_price,
      'refundAmount', v_line_refund
    );

    -- Lock item row and restock
    SELECT current_stock INTO v_current_stock
    FROM public.items
    WHERE id = v_item_id
    FOR UPDATE;

    IF FOUND THEN
      v_new_stock := COALESCE(v_current_stock, 0) + v_return_qty;

      UPDATE public.items
      SET current_stock = v_new_stock,
          updated_at = v_now
      WHERE id = v_item_id;

      INSERT INTO public.transactions (
        id, item_id, item_name, item_code, type, quantity,
        balance_after, department, requester_name, note,
        receipt_id, created_at
      ) VALUES (
        'tx-ret-' || floor(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 1000)::text,
        v_item_id,
        v_item_name,
        v_item_code,
        'RETURN_RESTOCK',
        v_return_qty,
        v_new_stock,
        'School Store & Co-op',
        'Return (Receipt #' || v_rc.receipt_number || ')',
        'Item returned & restocked: ' || p_reason || ' - ' || COALESCE(p_reason_detail, 'No remarks'),
        v_rc.id,
        v_now
      );
    END IF;
  END LOOP;

  -- 5. Record Return in Persistent Ledger
  INSERT INTO public.receipt_returns (
    id, receipt_id, receipt_number, items, total_refund,
    reason, reason_detail, cashier_name, created_at
  ) VALUES (
    p_return_id,
    v_rc.id,
    v_rc.receipt_number,
    v_validated_return_items,
    v_total_refund,
    p_reason,
    p_reason_detail,
    p_cashier_name,
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'returnId', p_return_id,
    'receiptId', v_rc.id,
    'receiptNumber', v_rc.receipt_number,
    'totalRefund', v_total_refund,
    'items', v_validated_return_items,
    'message', 'Return processed and stock restored successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Restrict All RPC EXECUTE Privileges to service_role and postgres ONLY
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.create_pos_sale(JSONB, JSONB) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_stock_movement_batch(TEXT, JSONB, JSONB) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.void_receipt_with_stock_restore(TEXT, TEXT) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_receipt_return(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.create_pos_sale(JSONB, JSONB) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.create_stock_movement_batch(TEXT, JSONB, JSONB) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.void_receipt_with_stock_restore(TEXT, TEXT) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.process_receipt_return(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO service_role, postgres;
