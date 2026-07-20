-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/gjhzuxxexzptldpilfzz/sql/new)
-- It's safe to run multiple times (uses IF NOT EXISTS + DROP POLICY IF EXISTS)

-- ============================================================
-- 1. Email subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can check if their email exists (for duplicate detection)
DROP POLICY IF EXISTS "Allow anon SELECT on email_subscriptions" ON email_subscriptions;
CREATE POLICY "Allow anon SELECT on email_subscriptions"
  ON email_subscriptions FOR SELECT TO anon
  USING (true);

-- Anonymous insert with basic email format validation
DROP POLICY IF EXISTS "Allow anonymous insert" ON email_subscriptions;
CREATE POLICY "Allow anonymous insert" ON email_subscriptions
  FOR INSERT TO anon
  WITH CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ============================================================
-- 2. Admin users
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Authenticated users can check if they are an admin
DROP POLICY IF EXISTS "Allow authenticated SELECT on admin_users" ON admin_users;
CREATE POLICY "Allow authenticated SELECT on admin_users"
  ON admin_users FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 3. General notices (site-wide announcements)
-- ============================================================
CREATE TABLE IF NOT EXISTS general_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert')),
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE general_notices ENABLE ROW LEVEL SECURITY;

-- Anyone can read active notices
DROP POLICY IF EXISTS "Allow anon SELECT on general_notices" ON general_notices;
CREATE POLICY "Allow anon SELECT on general_notices"
  ON general_notices FOR SELECT TO anon
  USING (active = true);

-- Admins can read all notices (including inactive)
DROP POLICY IF EXISTS "Allow authenticated SELECT all on general_notices" ON general_notices;
CREATE POLICY "Allow authenticated SELECT all on general_notices"
  ON general_notices FOR SELECT TO authenticated
  USING (true);

-- Admins can insert/update/delete notices
DROP POLICY IF EXISTS "Allow admin INSERT on general_notices" ON general_notices;
CREATE POLICY "Allow admin INSERT on general_notices"
  ON general_notices FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Allow admin UPDATE on general_notices" ON general_notices;
CREATE POLICY "Allow admin UPDATE on general_notices"
  ON general_notices FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Allow admin DELETE on general_notices" ON general_notices;
CREATE POLICY "Allow admin DELETE on general_notices"
  ON general_notices FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- ============================================================
-- 4. Admin write access to existing tables
-- ============================================================

-- Universities (admin can update URLs)
DROP POLICY IF EXISTS "Allow admin UPDATE on universities" ON universities;
CREATE POLICY "Allow admin UPDATE on universities"
  ON universities FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- University details (admin can edit about, history, etc.)
DROP POLICY IF EXISTS "Allow admin INSERT on university_details" ON university_details;
CREATE POLICY "Allow admin INSERT on university_details"
  ON university_details FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Allow admin UPDATE on university_details" ON university_details;
CREATE POLICY "Allow admin UPDATE on university_details"
  ON university_details FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- Programs (admin can CRUD)
DROP POLICY IF EXISTS "Allow admin INSERT on programs" ON programs;
CREATE POLICY "Allow admin INSERT on programs"
  ON programs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Allow admin UPDATE on programs" ON programs;
CREATE POLICY "Allow admin UPDATE on programs"
  ON programs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Allow admin DELETE on programs" ON programs;
CREATE POLICY "Allow admin DELETE on programs"
  ON programs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- ============================================================
-- 5. Reminder logs (track sent reminders)
-- ============================================================
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  programs_count INTEGER NOT NULL,
  recipients_count INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_subscriptions_updated_at ON email_subscriptions;
CREATE TRIGGER email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email subscriptions (admin can view and delete)
DROP POLICY IF EXISTS "Allow admin SELECT on email_subscriptions" ON email_subscriptions;
CREATE POLICY "Allow admin SELECT on email_subscriptions"
  ON email_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Allow admin DELETE on email_subscriptions" ON email_subscriptions;
CREATE POLICY "Allow admin DELETE on email_subscriptions"
  ON email_subscriptions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));
