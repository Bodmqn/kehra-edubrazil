-- EduBrazil Hub + The Kehra — Safe Migration (re-runnable)

-- Universities
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sno INTEGER NOT NULL,
  name TEXT NOT NULL,
  acronym TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  state TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Federal', 'State')),
  sigaa_url TEXT,
  school_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_sno ON universities (sno);
CREATE INDEX IF NOT EXISTS idx_universities_region ON universities (region);
CREATE INDEX IF NOT EXISTS idx_universities_state ON universities (state);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities (type);

-- Programs
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Mestrado', 'Doutorado', 'Ambos')),
  field TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Fechado', 'Em Breve')),
  edital_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_university ON programs (university_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs (status);
CREATE INDEX IF NOT EXISTS idx_programs_deadline ON programs (deadline);
CREATE INDEX IF NOT EXISTS idx_programs_level ON programs (level);

-- University details
CREATE TABLE IF NOT EXISTS university_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  about_text TEXT,
  history TEXT,
  website_description TEXT,
  wikipedia_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uni_details_university ON university_details (university_id);

-- Study guides
CREATE TABLE IF NOT EXISTS study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('cost_of_living', 'housing', 'climate', 'transport', 'visa', 'language')),
  content_json JSONB NOT NULL DEFAULT '{}',
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_guides_state ON study_guides (state);

-- Scrape logs
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  programs_found INTEGER DEFAULT 0,
  errors TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_university ON scrape_logs (university_id);

-- pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS embedding vector(384);
CREATE INDEX IF NOT EXISTS idx_programs_embedding ON programs USING hnsw (embedding vector_cosine_ops);

-- Row-Level Security (safe to re-run)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies (drop & recreate to be re-runnable)
DROP POLICY IF EXISTS "Allow anon SELECT on universities" ON universities;
DROP POLICY IF EXISTS "Allow anon SELECT on programs" ON programs;
DROP POLICY IF EXISTS "Allow anon SELECT on university_details" ON university_details;
DROP POLICY IF EXISTS "Allow anon SELECT on study_guides" ON study_guides;
DROP POLICY IF EXISTS "Allow anon SELECT on scrape_logs" ON scrape_logs;

CREATE POLICY "Allow anon SELECT on universities"
  ON universities FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon SELECT on programs"
  ON programs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon SELECT on university_details"
  ON university_details FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon SELECT on study_guides"
  ON study_guides FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon SELECT on scrape_logs"
  ON scrape_logs FOR SELECT TO anon USING (true);

-- Service role policies
DROP POLICY IF EXISTS "Allow service INSERT on universities" ON universities;
DROP POLICY IF EXISTS "Allow service UPDATE on universities" ON universities;
DROP POLICY IF EXISTS "Allow service INSERT on programs" ON programs;
DROP POLICY IF EXISTS "Allow service UPDATE on programs" ON programs;
DROP POLICY IF EXISTS "Allow service DELETE on programs" ON programs;
DROP POLICY IF EXISTS "Allow service INSERT on university_details" ON university_details;
DROP POLICY IF EXISTS "Allow service UPDATE on university_details" ON university_details;
DROP POLICY IF EXISTS "Allow service INSERT on scrape_logs" ON scrape_logs;

CREATE POLICY "Allow service INSERT on universities"
  ON universities FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service UPDATE on universities"
  ON universities FOR UPDATE TO service_role USING (true);

CREATE POLICY "Allow service INSERT on programs"
  ON programs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service UPDATE on programs"
  ON programs FOR UPDATE TO service_role USING (true);

CREATE POLICY "Allow service DELETE on programs"
  ON programs FOR DELETE TO service_role USING (true);

CREATE POLICY "Allow service INSERT on university_details"
  ON university_details FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service UPDATE on university_details"
  ON university_details FOR UPDATE TO service_role USING (true);

CREATE POLICY "Allow service INSERT on scrape_logs"
  ON scrape_logs FOR INSERT TO service_role WITH CHECK (true);

-- Comments + Direct Messages (chat widget / account)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('general', 'advisory')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_category_created ON comments (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated SELECT comments" ON comments;
CREATE POLICY "authenticated SELECT comments" ON comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated INSERT comments" ON comments;
CREATE POLICY "authenticated INSERT comments" ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND parent_id IS DISTINCT FROM id);

DROP POLICY IF EXISTS "authenticated UPDATE own comments" ON comments;
CREATE POLICY "authenticated UPDATE own comments" ON comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated DELETE own comments" ON comments;
CREATE POLICY "authenticated DELETE own comments" ON comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_user ON direct_messages (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread
  ON direct_messages (is_admin_reply, read_at)
  WHERE is_admin_reply AND read_at IS NULL;

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated SELECT own messages" ON direct_messages;
CREATE POLICY "authenticated SELECT own messages" ON direct_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "authenticated INSERT own messages" ON direct_messages;
CREATE POLICY "authenticated INSERT own messages" ON direct_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND sender_id IS NULL AND NOT is_admin_reply);

DROP POLICY IF EXISTS "authenticated UPDATE own messages read" ON direct_messages;
CREATE POLICY "authenticated UPDATE own messages read" ON direct_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_admin_reply)
  WITH CHECK (user_id = auth.uid() AND is_admin_reply);
