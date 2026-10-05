-- ==============================================================================
-- 20261005000000_secure_rls_and_atomic_stock.sql
-- 1. Revoke wide-open anon RLS policies
-- 2. Enforce strict table security (Service role & Authenticated RBAC)
-- 3. Add PostgreSQL Atomic Stock RPC functions to prevent race conditions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Secure items Table
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS items_select_policy ON public.items;
DROP POLICY IF EXISTS items_insert_policy ON public.items;
DROP POLICY IF EXISTS items_update_policy ON public.items;
DROP POLICY IF EXISTS items_delete_policy ON public.items;

-- Authenticated users with valid session can read catalog items
CREATE POLICY items_select_policy ON public.items
  FOR SELECT TO authenticated
  USING (true);

-- Mutations restricted to authenticated users with inventory management privileges
CREATE POLICY items_insert_policy ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.key IN ('inventory:item:create', 'admin:manage_users')
    )
  );

CREATE POLICY items_update_policy ON public.items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.key IN ('inventory:item:update', 'inventory:stock:issue', 'inventory:stock:restock', 'pos:receipt:create')
    )
  );

CREATE POLICY items_delete_policy ON public.items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.key IN ('inventory:item:delete', 'admin:manage_users')
    )
  );

-- ------------------------------------------------------------------------------
-- 2. Secure transactions Table
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactions_all_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_select_policy ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_policy ON public.transactions;

CREATE POLICY transactions_select_policy ON public.transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY transactions_insert_policy ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. Secure receipts Table
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receipts_select_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_insert_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_update_policy ON public.receipts;

CREATE POLICY receipts_select_policy ON public.receipts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY receipts_insert_policy ON public.receipts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY receipts_update_policy ON public.receipts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = auth.uid()::text AND p.key IN ('pos:receipt:void', 'admin:manage_users')
    )
  );

-- ------------------------------------------------------------------------------
-- 4. Secure audit_logs Table
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS audit_logs_all_policy ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_select_policy ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;

    -- Only super_admin / admins can read audit logs
    CREATE POLICY audit_logs_select_policy ON public.audit_logs
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.role_permissions rp ON ur.role_id = rp.role_id
          JOIN public.permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = auth.uid()::text AND p.key = 'admin:audit_logs:read'
        )
      );

    CREATE POLICY audit_logs_insert_policy ON public.audit_logs
      FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. Atomic Stock Management Stored Procedures (Prevents Concurrency Race Conditions)
-- ------------------------------------------------------------------------------

-- 5.1 Deduct Stock (with row lock & balance validation)
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

  -- Lock target row to prevent concurrent modifications
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

-- 5.2 Increase Stock (Restock/Receive)
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

-- 5.3 Adjust Stock
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
