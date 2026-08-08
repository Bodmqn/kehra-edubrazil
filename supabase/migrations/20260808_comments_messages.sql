-- Public comments board (floating chat widget) + private user<->admin messages

-- 1. Comments (visible to all logged-in users, threaded replies)
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

-- Any logged-in user can read all comments
DROP POLICY IF EXISTS "authenticated SELECT comments" ON comments;
CREATE POLICY "authenticated SELECT comments"
  ON comments FOR SELECT TO authenticated
  USING (true);

-- Logged-in users create comments as themselves (no self-parenting)
DROP POLICY IF EXISTS "authenticated INSERT comments" ON comments;
CREATE POLICY "authenticated INSERT comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND parent_id IS DISTINCT FROM id);

-- Users can edit their own comments
DROP POLICY IF EXISTS "authenticated UPDATE own comments" ON comments;
CREATE POLICY "authenticated UPDATE own comments"
  ON comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (replies cascade)
DROP POLICY IF EXISTS "authenticated DELETE own comments" ON comments;
CREATE POLICY "authenticated DELETE own comments"
  ON comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Note: admin edit/delete of any comment is handled via Netlify function
-- (comments-crud.ts) using service_role, which bypasses RLS.

-- 2. Private messages between a user and the admin (single thread per user)
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

-- Users see only their own thread
DROP POLICY IF EXISTS "authenticated SELECT own messages" ON direct_messages;
CREATE POLICY "authenticated SELECT own messages"
  ON direct_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users send messages only for themselves; never admin replies
DROP POLICY IF EXISTS "authenticated INSERT own messages" ON direct_messages;
CREATE POLICY "authenticated INSERT own messages"
  ON direct_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND sender_id IS NULL AND NOT is_admin_reply);

-- Users can only mark their thread's admin replies as read
DROP POLICY IF EXISTS "authenticated UPDATE own messages read" ON direct_messages;
CREATE POLICY "authenticated UPDATE own messages read"
  ON direct_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_admin_reply)
  WITH CHECK (user_id = auth.uid() AND is_admin_reply);

-- Note: admin inbox/replies are handled via Netlify function
-- (admin-messages.ts) using service_role, which bypasses RLS.
