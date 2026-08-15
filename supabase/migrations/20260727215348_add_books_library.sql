
-- Books library: public reading list backed by admin-curated entries.
-- Files themselves are hosted externally (Archive.org); only the cover
-- image is stored in Supabase Storage.

CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_url TEXT,
  download_url TEXT NOT NULL,
  archive_url TEXT,
  language TEXT,
  pages INT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_books_published ON public.books(is_published, position);
GRANT SELECT ON public.books TO anon, authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published books"
  ON public.books FOR SELECT
  USING (is_published = true);

CREATE TRIGGER trg_books_updated BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.books;

-- Storage bucket for book cover images (public read, service-role write).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read of book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Service role manages book covers"
  ON storage.objects FOR ALL
  USING (bucket_id = 'book-covers' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'service_role');

-- Seed a few published books so the page is never empty on first run.
INSERT INTO public.books (title, author, description, download_url, archive_url, language, is_published, position)
VALUES
  (
    'Ṣaḥīḥ al-Bukhārī',
    'Imām Muḥammad ibn Ismāʿīl al-Bukhārī',
    'The most authenticated collection of ḥadīth, compiled after rigorous verification of narrators and chains of transmission.',
    'https://archive.org/download/SahihBukhari_English/Sahih%20Bukhari%20English.pdf',
    'https://archive.org/details/SahihBukhari_English',
    'Arabic / English',
    true, 1
  ),
  (
    'Ṣaḥīḥ Muslim',
    'Imām Muslim ibn al-Ḥajjāj',
    'One of the six major ḥadīth collections, renowned for its systematic arrangement and rigorous authentication standards.',
    'https://archive.org/download/SahihMuslimEnglish/Sahih%20Muslim%20English.pdf',
    'https://archive.org/details/SahihMuslimEnglish',
    'Arabic / English',
    true, 2
  ),
  (
    'Riyāḍ al-Ṣāliḥīn',
    'Imām al-Nawawī',
    'A beloved anthology of ḥadīth on faith, character and daily conduct, compiled for the everyday seeker.',
    'https://archive.org/download/RiyadusSaliheenEnglish/Riyad%20us%20Saliheen%20English.pdf',
    'https://archive.org/details/RiyadusSaliheenEnglish',
    'Arabic / English',
    true, 3
  );
