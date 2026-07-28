-- Ensure the hadith reference table exists in the hosted project.
-- This is intentionally idempotent because older environments may already
-- have received the table from the initial schema migration.
CREATE TABLE IF NOT EXISTS public.hadith_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id UUID NOT NULL REFERENCES public.hadiths(id) ON DELETE CASCADE,
  book_name TEXT NOT NULL,
  volume TEXT,
  page TEXT,
  hadith_number TEXT,
  reliability_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refs_hadith ON public.hadith_references(hadith_id);
GRANT SELECT ON public.hadith_references TO anon, authenticated;
GRANT ALL ON public.hadith_references TO service_role;
ALTER TABLE public.hadith_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads refs for published hadiths" ON public.hadith_references;
CREATE POLICY "Public reads refs for published hadiths"
  ON public.hadith_references FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.hadiths h
    JOIN public.majalis m ON m.id = h.majlis_id
    WHERE h.id = hadith_id
      AND h.is_published = true
      AND m.is_published = true
  ));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hadith_references'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hadith_references;
  END IF;
END $$;
