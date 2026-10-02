-- ==============================================================================
-- 20260923000001_fix_rls_and_transactions.sql
-- Fix RLS policies for Next.js API Routes and sync columns on transactions
-- ==============================================================================

-- 1. Ensure transactions table has all columns expected by the backend
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS department_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS issued_to_user_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS issued_to_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS budget_deducted BOOLEAN DEFAULT false;

-- 2. Items table RLS: Allow anon and authenticated so server route handlers (guarded by Next.js RBAC) can execute
DROP POLICY IF EXISTS items_select_policy ON public.items;
DROP POLICY IF EXISTS items_insert_policy ON public.items;
DROP POLICY IF EXISTS items_update_policy ON public.items;
DROP POLICY IF EXISTS items_delete_policy ON public.items;

CREATE POLICY items_select_policy ON public.items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY items_insert_policy ON public.items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY items_update_policy ON public.items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY items_delete_policy ON public.items FOR DELETE TO anon, authenticated USING (true);

-- 3. Transactions table RLS: Allow recording and viewing transaction logs
DROP POLICY IF EXISTS transactions_all_policy ON public.transactions;
CREATE POLICY transactions_all_policy ON public.transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Receipts table RLS: Allow POS sales, retrieval, and voiding
DROP POLICY IF EXISTS receipts_select_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_insert_policy ON public.receipts;
DROP POLICY IF EXISTS receipts_update_policy ON public.receipts;

CREATE POLICY receipts_select_policy ON public.receipts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY receipts_insert_policy ON public.receipts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY receipts_update_policy ON public.receipts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Customers table RLS: Allow student and customer lookups and updates
DROP POLICY IF EXISTS customers_select_policy ON public.customers;
DROP POLICY IF EXISTS customers_modify_policy ON public.customers;

CREATE POLICY customers_select_policy ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY customers_modify_policy ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Audit logs policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_all_policy ON public.audit_logs;
    CREATE POLICY audit_logs_all_policy ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 7. RBAC tables read policies
CREATE POLICY permissions_read_policy ON public.permissions FOR SELECT TO public USING (true);
CREATE POLICY roles_read_policy ON public.roles FOR SELECT TO public USING (true);
CREATE POLICY role_permissions_read_policy ON public.role_permissions FOR SELECT TO public USING (true);
CREATE POLICY user_roles_read_policy ON public.user_roles FOR SELECT TO public USING (true);
