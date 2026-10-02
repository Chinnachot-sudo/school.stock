-- ==============================================================================
-- 20260923000002_user_roles_policies.sql
-- Allow server-side API handlers to sync user role assignments in user_roles
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    DROP POLICY IF EXISTS user_roles_modify_policy ON public.user_roles;
    CREATE POLICY user_roles_modify_policy ON public.user_roles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
