-- Stores each user's tracker programs (synced across devices)
-- Each row holds one TrackerProgram as a jsonb blob

create table if not exists user_tracker_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_data jsonb not null,
  program_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, program_id)
);

-- RLS: users can only see/edit their own rows
alter table user_tracker_programs enable row level security;

create policy "Users manage their own tracker programs"
  on user_tracker_programs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for loading all programs for a user
create index if not exists idx_user_tracker_programs_user on user_tracker_programs(user_id);
