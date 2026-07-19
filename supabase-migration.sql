-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/gjhzuxxexzptldpilfzz/sql/new)

-- 1. Email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Allow anonymous inserts (anyone can subscribe)
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert" ON email_subscriptions
  FOR INSERT TO anon
  WITH CHECK (true);

-- 3. Optional: later, create a Supabase Edge Function to send actual emails
-- via Resend when a new row is inserted. For now, emails are stored and
-- can be viewed in the Supabase Table Editor.
