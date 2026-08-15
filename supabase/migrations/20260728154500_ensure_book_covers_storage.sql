-- Keep book cover uploads in a clearly named storage folder. Supabase Storage
-- folders are object-key prefixes, so no separate folder table is required.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-covers', 'Book Covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read of book covers" ON storage.objects;
CREATE POLICY "Public read of book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "Service role manages book covers" ON storage.objects;
CREATE POLICY "Service role manages book covers"
  ON storage.objects FOR ALL
  USING (bucket_id = 'book-covers' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'service_role');
