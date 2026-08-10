-- Tracks when each user last read the community comments feed.
-- The chat badge counts comments created after last_read_at (cross-device).

create table if not exists user_comment_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_read_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- RLS: users can only read/update their own read marker
alter table user_comment_reads enable row level security;

create policy "Users manage their own comment read marker"
  on user_comment_reads
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
