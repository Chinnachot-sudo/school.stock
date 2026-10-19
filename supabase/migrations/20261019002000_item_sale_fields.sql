-- Ensure every item field saved by the application exists before writes are accepted.
-- Additive and data preserving. Rollback is intentionally not automatic because
-- dropping these columns would discard item prices, costs and images.
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;
