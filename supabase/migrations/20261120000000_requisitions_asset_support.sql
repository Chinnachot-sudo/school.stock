-- Allow requisitions to reference assets from Asset Management for borrowing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'requisitions_item_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.requisitions DROP CONSTRAINT requisitions_item_id_fkey';
  END IF;
  ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS asset_id text REFERENCES public.assets(id) ON DELETE SET NULL;
END $$;

CREATE INDEX IF NOT EXISTS requisitions_asset_id_idx ON public.requisitions (asset_id);
