-- Email subscriptions (tracker page)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_token ON email_subscriptions (token);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions (email);

-- User program reminders (per-subscription)
CREATE TABLE IF NOT EXISTS user_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_token UUID NOT NULL REFERENCES email_subscriptions(token) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  program_name TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT '',
  deadline DATE,
  reminder_days INTEGER[] NOT NULL DEFAULT '{}',
  last_notified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_reminders_token_program
  ON user_reminders (subscription_token, program_id);

-- Reminder send logs
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programs_count INTEGER NOT NULL DEFAULT 0,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users (for admin panel access)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: email_subscriptions — anon can only read own email (for dup check)
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon SELECT email_subscriptions" ON email_subscriptions;
CREATE POLICY "anon SELECT email_subscriptions"
  ON email_subscriptions FOR SELECT TO anon
  USING (true);

-- Note: INSERT/UPDATE/DELETE on email_subscriptions is handled by Netlify functions
-- using service_role key, so no anon write policies are needed.

-- RLS: user_reminders — all access via service_role only
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;

-- RLS: reminder_logs — all access via service_role only
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS: admin_users — anon can SELECT (used by adminClient to verify email)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon SELECT admin_users" ON admin_users;
CREATE POLICY "anon SELECT admin_users"
  ON admin_users FOR SELECT TO anon
  USING (true);

-- Service role full access for all tables
DROP POLICY IF EXISTS "service INSERT email_subscriptions" ON email_subscriptions;
DROP POLICY IF EXISTS "service DELETE email_subscriptions" ON email_subscriptions;

CREATE POLICY "service INSERT email_subscriptions"
  ON email_subscriptions FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service DELETE email_subscriptions"
  ON email_subscriptions FOR DELETE TO service_role USING (true);

DROP POLICY IF EXISTS "service all user_reminders" ON user_reminders;
CREATE POLICY "service all user_reminders"
  ON user_reminders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service all reminder_logs" ON reminder_logs;
CREATE POLICY "service all reminder_logs"
  ON reminder_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service INSERT admin_users" ON admin_users;
DROP POLICY IF EXISTS "service DELETE admin_users" ON admin_users;

CREATE POLICY "service INSERT admin_users"
  ON admin_users FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service DELETE admin_users"
  ON admin_users FOR DELETE TO service_role USING (true);

-- Allow anon INSERT on admin_users (used by admin-users page)
DROP POLICY IF EXISTS "anon INSERT admin_users" ON admin_users;
CREATE POLICY "anon INSERT admin_users"
  ON admin_users FOR INSERT TO anon WITH CHECK (true);

-- Allow anon DELETE on admin_users (used by admin-users page)
DROP POLICY IF EXISTS "anon DELETE admin_users" ON admin_users;
CREATE POLICY "anon DELETE admin_users"
  ON admin_users FOR DELETE TO anon USING (true);
