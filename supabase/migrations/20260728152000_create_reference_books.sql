CREATE TABLE IF NOT EXISTS public.reference_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  volume_count INT NOT NULL CHECK (volume_count BETWEEN 1 AND 999),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reference_books_active ON public.reference_books(is_active, position);
GRANT SELECT ON public.reference_books TO anon, authenticated;
GRANT ALL ON public.reference_books TO service_role;
ALTER TABLE public.reference_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active reference books" ON public.reference_books;
CREATE POLICY "Public reads active reference books" ON public.reference_books FOR SELECT USING (is_active = true);
INSERT INTO public.reference_books (name, volume_count, description, position) VALUES
  ('al-Kāfī', 8, 'One of the Four Books of Twelver Shia hadith.', 1),
  ('Man Lā Yaḥḍuruhu al-Faqīh', 4, 'One of the Four Books, compiled by al-Shaykh al-Ṣadūq.', 2),
  ('Tahdhīb al-Aḥkām', 10, 'One of the Four Books, compiled by Shaykh al-Ṭūsī.', 3),
  ('al-Istibṣār', 4, 'One of the Four Books, compiled by Shaykh al-Ṭūsī.', 4),
  ('Biḥār al-Anwār', 110, 'The contemporary printed edition; other editions use different numbering.', 5),
  ('Wasāʾil al-Shīʿa', 30, 'A major later compilation of legal traditions.', 6)
ON CONFLICT (name) DO UPDATE SET volume_count = EXCLUDED.volume_count, description = EXCLUDED.description, position = EXCLUDED.position;
