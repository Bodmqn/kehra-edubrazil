-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/gjhzuxxexzptldpilfzz/sql/new)
-- It's safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================
-- 1. Email subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert" ON email_subscriptions
  FOR INSERT TO anon
  WITH CHECK (true);

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
CREATE POLICY "Allow anon SELECT on general_notices"
  ON general_notices FOR SELECT TO anon
  USING (active = true);

-- Admins can read all notices (including inactive)
CREATE POLICY "Allow authenticated SELECT all on general_notices"
  ON general_notices FOR SELECT TO authenticated
  USING (true);

-- Admins can insert/update/delete notices
CREATE POLICY "Allow admin INSERT on general_notices"
  ON general_notices FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Allow admin UPDATE on general_notices"
  ON general_notices FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Allow admin DELETE on general_notices"
  ON general_notices FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- ============================================================
-- 4. Admin write access to existing tables
-- ============================================================

-- Universities (admin can update URLs)
CREATE POLICY "Allow admin UPDATE on universities"
  ON universities FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- University details (admin can edit about, history, etc.)
CREATE POLICY "Allow admin INSERT on university_details"
  ON university_details FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Allow admin UPDATE on university_details"
  ON university_details FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- Programs (admin can CRUD)
CREATE POLICY "Allow admin INSERT on programs"
  ON programs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Allow admin UPDATE on programs"
  ON programs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Allow admin DELETE on programs"
  ON programs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

-- Email subscriptions (admin can view and delete)
CREATE POLICY "Allow admin SELECT on email_subscriptions"
  ON email_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));

CREATE POLICY "Allow admin DELETE on email_subscriptions"
  ON email_subscriptions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email()));
