-- Splash notice (home page modal)
create table if not exists splash_notice (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'General Notice',
  message text not null default '',
  enabled boolean not null default true,
  timer_seconds integer not null default 9,
  dismiss_hours integer not null default 24,
  updated_at timestamptz not null default now()
);

-- Study guide sections (visa, language, housing)
create table if not exists study_guide_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null,
  content text not null default '',
  updated_at timestamptz not null default now()
);

-- Insert default study guide content if empty
insert into study_guide_sections (section_key, title, content) values
  ('visa', 'Visa Process', 'International students need a student visa (VITEM IV) to study in Brazil. Apply at the Brazilian consulate in your home country. Required documents include: passport, acceptance letter, proof of financial means, and health insurance.'),
  ('language', 'Language Requirements', 'Most programs require Portuguese proficiency (CELPE-Bras certificate). Some graduate programs offer courses in English or have English-language tracks. Contact the specific program for their language requirements.'),
  ('housing', 'Housing', 'Options include university housing (when available), shared apartments (república), or private rentals. Websites like QuintoAndar, OLX, and Airbnb are popular for finding accommodation. Start your search 1-2 months before arrival.')
on conflict (section_key) do nothing;
