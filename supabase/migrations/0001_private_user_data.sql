-- The Orrery: private journal entries and saved natal-chart details.
-- Run this migration in the Supabase SQL Editor before enabling browser access.

create extension if not exists pgcrypto;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  entry_date date not null,
  notes text not null check (char_length(notes) between 1 and 5000),
  body_name text check (body_name is null or body_name in ('Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn')),
  placement text check (placement is null or char_length(placement) <= 80),
  observed_at timestamptz,
  observed_time_zone text check (observed_time_zone is null or char_length(observed_time_zone) between 1 and 80),
  local_entry_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.journal_entries add column if not exists local_entry_id text;
alter table public.journal_entries add column if not exists observed_at timestamptz;
alter table public.journal_entries add column if not exists observed_time_zone text;

create table if not exists public.saved_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  birth_date date not null,
  birth_time time not null,
  time_zone text not null check (char_length(time_zone) between 1 and 80),
  time_occurrence text check (time_occurrence is null or time_occurrence in ('earlier','later')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);
create unique index if not exists journal_entries_user_local_entry_unique on public.journal_entries (user_id, local_entry_id);
create index if not exists saved_charts_user_updated_idx on public.saved_charts (user_id, updated_at desc);

alter table public.journal_entries enable row level security;
alter table public.saved_charts enable row level security;

revoke all on public.journal_entries from public, anon, authenticated;
revoke all on public.saved_charts from public, anon, authenticated;
grant select, insert, update, delete on public.journal_entries to authenticated;
grant select, insert, update, delete on public.saved_charts to authenticated;

drop policy if exists "Users read their own journal entries" on public.journal_entries;
create policy "Users read their own journal entries" on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their own journal entries" on public.journal_entries;
create policy "Users create their own journal entries" on public.journal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own journal entries" on public.journal_entries;
create policy "Users update their own journal entries" on public.journal_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their own journal entries" on public.journal_entries;
create policy "Users delete their own journal entries" on public.journal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read their own saved charts" on public.saved_charts;
create policy "Users read their own saved charts" on public.saved_charts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their own saved charts" on public.saved_charts;
create policy "Users create their own saved charts" on public.saved_charts
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own saved charts" on public.saved_charts;
create policy "Users update their own saved charts" on public.saved_charts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their own saved charts" on public.saved_charts;
create policy "Users delete their own saved charts" on public.saved_charts
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists journal_entries_updated_at on public.journal_entries;
create trigger journal_entries_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();
drop trigger if exists saved_charts_updated_at on public.saved_charts;
create trigger saved_charts_updated_at before update on public.saved_charts
  for each row execute function public.set_updated_at();
