-- Per-card reminder settings synced from My Tracker
-- Each row links a subscriber's tracker program to its reminder config

create table if not exists user_reminders (
  id uuid primary key default gen_random_uuid(),
  subscription_token uuid not null references email_subscriptions(token) on delete cascade,
  program_id text not null,
  program_name text not null,
  university text not null default '',
  deadline date,
  reminder_days integer[] not null default '{}',
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subscription_token, program_id)
);

-- Index for looking up due reminders by deadline
create index if not exists idx_user_reminders_deadline on user_reminders(deadline);

-- Index for querying by subscription token
create index if not exists idx_user_reminders_token on user_reminders(subscription_token);
