-- The previous recovery migration was recorded during history repair; ensure
-- the table is present in databases where that migration was not executed.
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
CREATE POLICY "Public reads refs for published hadiths" ON public.hadith_references FOR SELECT
USING (EXISTS (SELECT 1 FROM public.hadiths h JOIN public.majalis m ON m.id = h.majlis_id
  WHERE h.id = hadith_id AND h.is_published = true AND m.is_published = true));
