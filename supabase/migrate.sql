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
