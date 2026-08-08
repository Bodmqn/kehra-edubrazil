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

-- ============================================================
-- Comments + Direct Messages (chat widget / account)
-- ============================================================
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
