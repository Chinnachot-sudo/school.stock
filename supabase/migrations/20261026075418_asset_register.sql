-- Persist the real fixed-asset register. No sample records are inserted.
CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  serial TEXT,
  category TEXT,
  location TEXT,
  custodian TEXT,
  purchase_date DATE,
  cost NUMERIC(12, 2),
  status TEXT NOT NULL CHECK (status IN ('IN_USE', 'ON_LOAN', 'MAINTENANCE', 'DISPOSED')),
  created_by TEXT REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assets_code_nonempty CHECK (length(trim(code)) > 0),
  CONSTRAINT assets_name_nonempty CHECK (length(trim(name)) > 0),
  CONSTRAINT assets_cost_nonnegative CHECK (cost IS NULL OR cost >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS assets_code_ci_unique ON public.assets (upper(trim(code)));
CREATE INDEX IF NOT EXISTS assets_status_idx ON public.assets (status);
CREATE INDEX IF NOT EXISTS assets_category_idx ON public.assets (category);

-- The application uses its own signed sessions and permission checks in the
-- server API. Do not expose this table directly to browser roles.
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.assets FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.assets TO service_role;
