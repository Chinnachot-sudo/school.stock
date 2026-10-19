-- Persistent, privacy-preserving login throttling.
-- Forward-only migration. Rollback (if absolutely required): drop the three
-- functions below, then drop public.login_rate_limits. Existing application
-- behavior falls back to process-local throttling when these RPCs are absent.

CREATE TABLE IF NOT EXISTS public.login_rate_limits (
  identifier_hash TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.login_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.login_rate_limits TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_identifier_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_locked_until TIMESTAMPTZ;
  v_minutes INTEGER;
BEGIN
  SELECT locked_until INTO v_locked_until
  FROM public.login_rate_limits
  WHERE identifier_hash = p_identifier_hash;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    v_minutes := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_locked_until - now())) / 60.0)::INTEGER);
    RETURN jsonb_build_object('isLocked', true, 'remainingMinutes', v_minutes);
  END IF;

  RETURN jsonb_build_object('isLocked', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_failed_login(p_identifier_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.login_rate_limits%ROWTYPE;
  v_attempts INTEGER;
  v_now TIMESTAMPTZ := now();
BEGIN
  INSERT INTO public.login_rate_limits(identifier_hash, failed_attempts, first_attempt_at, updated_at)
  VALUES (p_identifier_hash, 0, v_now, v_now)
  ON CONFLICT (identifier_hash) DO NOTHING;

  SELECT * INTO v_row
  FROM public.login_rate_limits
  WHERE identifier_hash = p_identifier_hash
  FOR UPDATE;

  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > v_now THEN
    RETURN jsonb_build_object('isNowLocked', true, 'attemptsLeft', 0);
  END IF;

  IF v_row.first_attempt_at < v_now - interval '15 minutes' THEN
    v_attempts := 1;
    UPDATE public.login_rate_limits
    SET failed_attempts = v_attempts,
        first_attempt_at = v_now,
        locked_until = NULL,
        updated_at = v_now
    WHERE identifier_hash = p_identifier_hash;
  ELSE
    v_attempts := v_row.failed_attempts + 1;
    UPDATE public.login_rate_limits
    SET failed_attempts = v_attempts,
        locked_until = CASE WHEN v_attempts >= 5 THEN v_now + interval '15 minutes' ELSE NULL END,
        updated_at = v_now
    WHERE identifier_hash = p_identifier_hash;
  END IF;

  RETURN jsonb_build_object(
    'isNowLocked', v_attempts >= 5,
    'attemptsLeft', GREATEST(0, 5 - v_attempts)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_identifier_hash TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.login_rate_limits WHERE identifier_hash = p_identifier_hash;
$$;

REVOKE EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_failed_login(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(TEXT) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.record_failed_login(TEXT) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.clear_login_attempts(TEXT) TO service_role, postgres;

CREATE INDEX IF NOT EXISTS idx_login_rate_limits_updated_at
  ON public.login_rate_limits(updated_at);
