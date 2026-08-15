CREATE TABLE IF NOT EXISTS public.monthly_unique_visitors (
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  unique_visitors INTEGER NOT NULL DEFAULT 0 CHECK (unique_visitors >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monthly_unique_visitors_pkey PRIMARY KEY (year, month)
);

CREATE TABLE IF NOT EXISTS public.monthly_visitor_keys (
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  visitor_hash TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monthly_visitor_keys_pkey PRIMARY KEY (year, month, visitor_hash)
);

REVOKE ALL ON public.monthly_unique_visitors, public.monthly_visitor_keys FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.record_monthly_unique_visitor(
  p_year INTEGER,
  p_month INTEGER,
  p_visitor_hash TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO public.monthly_unique_visitors (year, month)
  VALUES (p_year, p_month)
  ON CONFLICT (year, month) DO NOTHING;

  INSERT INTO public.monthly_visitor_keys (year, month, visitor_hash)
  VALUES (p_year, p_month, p_visitor_hash)
  ON CONFLICT (year, month, visitor_hash) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 1 THEN
    UPDATE public.monthly_unique_visitors
    SET unique_visitors = unique_visitors + 1, updated_at = now()
    WHERE year = p_year AND month = p_month;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_monthly_visitor_keys(p_retention_months INTEGER DEFAULT 15)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.monthly_visitor_keys
  WHERE make_date(year, month, 1) < (date_trunc('month', now()) - make_interval(months => p_retention_months));
$$;

REVOKE ALL ON FUNCTION public.record_monthly_unique_visitor(INTEGER, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_monthly_visitor_keys(INTEGER) FROM PUBLIC;
