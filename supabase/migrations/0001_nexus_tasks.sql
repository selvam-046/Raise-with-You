-- Nexus Tasks: owner-isolated tasks, encrypted browser endpoints, and reminder idempotency.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_at timestamptz not null,
  is_completed boolean not null default false,
  streak_count integer not null default 0 check (streak_count >= 0),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Task owners manage their own tasks"
  on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Subscription owners manage their own endpoints"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists tasks_open_by_user_due_idx on public.tasks (user_id, due_at) where is_completed = false;
create index if not exists tasks_reminder_scan_idx on public.tasks (due_at) where is_completed = false and reminder_sent_at is null;
create index if not exists push_subscriptions_by_user_idx on public.push_subscriptions (user_id);
