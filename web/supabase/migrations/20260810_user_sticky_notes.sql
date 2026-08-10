-- Stores each user's sticky notes (floating notes in My Tracker)
-- Each row holds one StickyNote as a jsonb blob

create table if not exists user_sticky_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_data jsonb not null,
  note_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, note_id)
);

-- RLS: users can only see/edit their own rows
alter table user_sticky_notes enable row level security;

create policy "Users manage their own sticky notes"
  on user_sticky_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for loading all notes for a user
create index if not exists idx_user_sticky_notes_user on user_sticky_notes(user_id);
