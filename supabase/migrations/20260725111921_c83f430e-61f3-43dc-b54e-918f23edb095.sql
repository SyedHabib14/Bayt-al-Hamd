
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'scholar', 'editor');

-- Users (CNIC-authorized personnel)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnic TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'editor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_cnic ON public.users(cnic);
GRANT SELECT ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- No public policies for users; only service role reads/writes.

-- Majalis
CREATE TABLE public.majalis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_majalis_published_date ON public.majalis(is_published, date DESC);
GRANT SELECT ON public.majalis TO anon, authenticated;
GRANT ALL ON public.majalis TO service_role;
ALTER TABLE public.majalis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published majalis"
  ON public.majalis FOR SELECT
  USING (is_published = true);

-- Hadiths
CREATE TABLE public.hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  majlis_id UUID NOT NULL REFERENCES public.majalis(id) ON DELETE CASCADE,
  arabic_text TEXT NOT NULL,
  arabic_normalized TEXT,
  translation_en TEXT NOT NULL,
  grade TEXT,
  notes TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hadiths_majlis ON public.hadiths(majlis_id);
CREATE INDEX idx_hadiths_published ON public.hadiths(is_published);
CREATE INDEX idx_hadiths_norm ON public.hadiths USING gin (to_tsvector('simple', coalesce(arabic_normalized,'') || ' ' || translation_en));
GRANT SELECT ON public.hadiths TO anon, authenticated;
GRANT ALL ON public.hadiths TO service_role;
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published hadiths in published majalis"
  ON public.hadiths FOR SELECT
  USING (
    is_published = true
    AND EXISTS (SELECT 1 FROM public.majalis m WHERE m.id = majlis_id AND m.is_published = true)
  );

-- References
CREATE TABLE public.hadith_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id UUID NOT NULL REFERENCES public.hadiths(id) ON DELETE CASCADE,
  book_name TEXT NOT NULL,
  volume TEXT,
  page TEXT,
  hadith_number TEXT,
  reliability_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refs_hadith ON public.hadith_references(hadith_id);
GRANT SELECT ON public.hadith_references TO anon, authenticated;
GRANT ALL ON public.hadith_references TO service_role;
ALTER TABLE public.hadith_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads refs for published hadiths"
  ON public.hadith_references FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hadiths h JOIN public.majalis m ON m.id = h.majlis_id
    WHERE h.id = hadith_id AND h.is_published = true AND m.is_published = true
  ));

-- Tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads tags" ON public.tags FOR SELECT USING (true);

CREATE TABLE public.hadith_tags (
  hadith_id UUID NOT NULL REFERENCES public.hadiths(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (hadith_id, tag_id)
);
GRANT SELECT ON public.hadith_tags TO anon, authenticated;
GRANT ALL ON public.hadith_tags TO service_role;
ALTER TABLE public.hadith_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads hadith_tags"
  ON public.hadith_tags FOR SELECT USING (true);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  user_cnic TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- No public policies; only service role via server.

-- Rate limiting for CNIC login attempts
CREATE TABLE public.cnic_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnic TEXT,
  ip TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_recent ON public.cnic_login_attempts(attempted_at DESC);
CREATE INDEX idx_attempts_ip ON public.cnic_login_attempts(ip, attempted_at DESC);
GRANT ALL ON public.cnic_login_attempts TO service_role;
ALTER TABLE public.cnic_login_attempts ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_majalis_updated BEFORE UPDATE ON public.majalis
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_hadiths_updated BEFORE UPDATE ON public.hadiths
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.majalis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hadiths;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hadith_references;

-- Seed admin
INSERT INTO public.users (cnic, full_name, role, is_active) VALUES
  ('3520276902327', 'Founding Administrator', 'admin', true);

-- Seed majalis + hadiths
WITH m1 AS (
  INSERT INTO public.majalis (title, date, description, is_published)
  VALUES ('Majlis on Sincerity of Intention', '2025-01-17', 'Opening majlis of the year on the foundational hadith of niyyah.', true)
  RETURNING id
), m2 AS (
  INSERT INTO public.majalis (title, date, description, is_published)
  VALUES ('Majlis on the Rights of the Neighbor', '2025-03-04', 'A gathering exploring the Prophetic emphasis on neighborliness.', true)
  RETURNING id
), m3 AS (
  INSERT INTO public.majalis (title, date, description, is_published)
  VALUES ('Majlis on Seeking Knowledge', '2025-06-21', 'On the virtue of ʿilm and the etiquette of the seeker.', true)
  RETURNING id
),
h1 AS (
  INSERT INTO public.hadiths (majlis_id, arabic_text, translation_en, grade, notes, is_published, position)
  SELECT id,
    'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    'Actions are but by intentions, and every man shall have only that which he intended.',
    'Ṣaḥīḥ (Muttafaq ʿalayh)',
    'Reported from ʿUmar ibn al-Khaṭṭāb (may Allah be pleased with him). Considered a cornerstone of Islamic jurisprudence.',
    true, 1
  FROM m1 RETURNING id
),
h2 AS (
  INSERT INTO public.hadiths (majlis_id, arabic_text, translation_en, grade, notes, is_published, position)
  SELECT id,
    'مَا زَالَ جِبْرِيلُ يُوصِينِي بِالْجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُهُ',
    'Jibrīl continued to urge me concerning the neighbor until I thought he would make him an heir.',
    'Ṣaḥīḥ',
    'Narrated by ʿĀʾishah and Ibn ʿUmar (may Allah be pleased with them).',
    true, 1
  FROM m2 RETURNING id
),
h3 AS (
  INSERT INTO public.hadiths (majlis_id, arabic_text, translation_en, grade, notes, is_published, position)
  SELECT id,
    'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    'Whoever treads a path in search of knowledge, Allah will make easy for him a path to Paradise.',
    'Ṣaḥīḥ',
    'Narrated by Abū Hurayrah (may Allah be pleased with him).',
    true, 1
  FROM m3 RETURNING id
)
INSERT INTO public.hadith_references (hadith_id, book_name, volume, page, hadith_number, reliability_note)
SELECT id, 'Ṣaḥīḥ al-Bukhārī', '1', '3', '1', 'Kitāb Badʾ al-Waḥy' FROM h1
UNION ALL SELECT id, 'Ṣaḥīḥ Muslim', '3', '1515', '1907', 'Kitāb al-Imārah' FROM h1
UNION ALL SELECT id, 'Ṣaḥīḥ al-Bukhārī', '8', '10', '6014', 'Kitāb al-Adab' FROM h2
UNION ALL SELECT id, 'Ṣaḥīḥ Muslim', '4', '2025', '2624', 'Kitāb al-Birr wa al-Ṣilah' FROM h2
UNION ALL SELECT id, 'Ṣaḥīḥ Muslim', '4', '2074', '2699', 'Kitāb al-Dhikr wa al-Duʿāʾ' FROM h3;
