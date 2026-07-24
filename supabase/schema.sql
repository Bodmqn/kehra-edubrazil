-- EduBrazil Hub + The Kehra — Supabase Schema

-- Universities (seeded from CSV)
CREATE TABLE universities (
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

CREATE UNIQUE INDEX idx_universities_sno ON universities (sno);
CREATE INDEX idx_universities_region ON universities (region);
CREATE INDEX idx_universities_state ON universities (state);
CREATE INDEX idx_universities_type ON universities (type);

-- Programs (scraped from SIGAA / edital pages)
CREATE TABLE programs (
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

CREATE INDEX idx_programs_university ON programs (university_id);
CREATE INDEX idx_programs_status ON programs (status);
CREATE INDEX idx_programs_deadline ON programs (deadline);
CREATE INDEX idx_programs_level ON programs (level);

-- University details (from Wikipedia)
CREATE TABLE university_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  about_text TEXT,
  history TEXT,
  website_description TEXT,
  wikipedia_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_uni_details_university ON university_details (university_id);

-- Study guides (per city / state)
CREATE TABLE study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('cost_of_living', 'housing', 'climate', 'transport', 'visa', 'language')),
  content_json JSONB NOT NULL DEFAULT '{}',
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_guides_state ON study_guides (state);

-- Scrape logs
CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  programs_found INTEGER DEFAULT 0,
  errors TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scrape_logs_university ON scrape_logs (university_id);

-- Enable pgvector for semantic program matching
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS embedding vector(384);
CREATE INDEX IF NOT EXISTS idx_programs_embedding ON programs USING hnsw (embedding vector_cosine_ops);

-- Row-Level Security
-- Anon key (client-side): SELECT only on public tables
-- Service role (scraper): full access

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies
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

-- Service role full access (scraper)
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
