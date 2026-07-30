-- User Activity Tracking (minimal, privacy-conscious)
-- One row per user per active day. No IPs, no geolocation.

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, active_date)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_active_date ON user_activity (active_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_active ON user_activity (last_active_at);

-- RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can upsert their own activity rows
CREATE POLICY "Users can insert own activity"
  ON user_activity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activity"
  ON user_activity FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all activity (via service_role in Netlify Functions)
CREATE POLICY "Admins can view all activity"
  ON user_activity FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE email = auth.email()
    )
  );
