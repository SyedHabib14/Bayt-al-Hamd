-- Articles are curated by the editorial team and publicly visible only when
-- explicitly published.
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  article_link TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_path TEXT,
  short_description TEXT,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_publish_date ON public.articles(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON public.articles(is_published);

GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE, SELECT ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published articles" ON public.articles;
CREATE POLICY "Public reads published articles"
  ON public.articles FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated editors manage articles" ON public.articles;
CREATE POLICY "Authenticated editors manage articles"
  ON public.articles FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_articles_updated ON public.articles;
CREATE TRIGGER trg_articles_updated
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-covers',
  'article-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

DROP POLICY IF EXISTS "Public read of article covers" ON storage.objects;
CREATE POLICY "Public read of article covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-covers');

DROP POLICY IF EXISTS "Authenticated editors upload article covers" ON storage.objects;
CREATE POLICY "Authenticated editors upload article covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'article-covers');

DROP POLICY IF EXISTS "Authenticated editors update article covers" ON storage.objects;
CREATE POLICY "Authenticated editors update article covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'article-covers')
  WITH CHECK (bucket_id = 'article-covers');

DROP POLICY IF EXISTS "Authenticated editors delete article covers" ON storage.objects;
CREATE POLICY "Authenticated editors delete article covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'article-covers');
