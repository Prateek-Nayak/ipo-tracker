-- IPO Ledger cloud sync schema for Supabase.
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('accounts','ipos','transfers','trash')),
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.user_data enable row level security;

drop policy if exists "Users can read their own data" on public.user_data;
create policy "Users can read their own data"
on public.user_data for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own data" on public.user_data;
create policy "Users can insert their own data"
on public.user_data for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own data" on public.user_data;
create policy "Users can update their own data"
on public.user_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_data_user_id_idx on public.user_data(user_id);

-- Deleted records are kept rather than removed, and sync like any other table.
-- Safe to re-run: it only widens what `kind` accepts.
alter table public.user_data drop constraint if exists user_data_kind_check;
alter table public.user_data add constraint user_data_kind_check
  check (kind in ('accounts','ipos','transfers','trash'));

-- ---------------------------------------------------------------------------
-- Web Push subscriptions for listing-day reminders (approach B).
-- One row per browser/device endpoint. Users manage only their own rows; the
-- scheduled server job reads all of them with the service role (bypasses RLS).
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  last_sent_date text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users read own push subs" on public.push_subscriptions;
create policy "Users read own push subs"
on public.push_subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Users insert own push subs" on public.push_subscriptions;
create policy "Users insert own push subs"
on public.push_subscriptions for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own push subs" on public.push_subscriptions;
create policy "Users update own push subs"
on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own push subs" on public.push_subscriptions;
create policy "Users delete own push subs"
on public.push_subscriptions for delete using (auth.uid() = user_id);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
