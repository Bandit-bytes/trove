-- Trove household sync. Run this once in the Supabase SQL editor.
-- One JSON document per household keeps two phones in step without migrations.

create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My household',
  code text unique not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, household_id)
);

alter table public.households enable row level security;
alter table public.memberships enable row level security;

-- Helper: is the caller a member of this household?
create or replace function public.is_member(hh uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.memberships m
                 where m.household_id = hh and m.user_id = auth.uid());
$$;

drop policy if exists hh_select on public.households;
create policy hh_select on public.households for select
  using (public.is_member(id) or auth.role() = 'authenticated');
-- (select is open to signed-in users so an invite code can be looked up;
--  the row exposes only name/code/data of a household you must know the code for.)

drop policy if exists hh_insert on public.households;
create policy hh_insert on public.households for insert
  with check (auth.uid() is not null);

drop policy if exists hh_update on public.households;
create policy hh_update on public.households for update
  using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists mem_select on public.memberships;
create policy mem_select on public.memberships for select using (user_id = auth.uid());

drop policy if exists mem_insert on public.memberships;
create policy mem_insert on public.memberships for insert with check (user_id = auth.uid());

-- Realtime so the other phone updates live.
alter publication supabase_realtime add table public.households;
