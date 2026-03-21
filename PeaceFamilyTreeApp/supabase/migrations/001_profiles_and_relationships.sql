-- ============================================================
-- 001_profiles_and_relationships.sql
-- Run this against your Supabase project via the SQL editor or
-- the Supabase CLI: supabase db push
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  full_name     text not null,
  date_of_birth date,
  date_of_death date,
  birth_place   text,
  avatar_url    text,
  is_living     boolean not null default true,
  visibility    text not null default 'family',
  gender        text check (gender in ('male', 'female')),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Extend existing table if it already exists (idempotent adds)
do $$ begin
  begin alter table public.profiles add column user_id       uuid references auth.users(id) on delete set null; exception when duplicate_column then null; end;
  begin alter table public.profiles add column date_of_death date;                                                                                         exception when duplicate_column then null; end;
  begin alter table public.profiles add column avatar_url    text;                                                                                         exception when duplicate_column then null; end;
  begin alter table public.profiles add column is_living     boolean not null default true;                                                                 exception when duplicate_column then null; end;
  begin alter table public.profiles add column visibility    text not null default 'family';                                                                exception when duplicate_column then null; end;
  begin alter table public.profiles add column gender        text check (gender in ('male', 'female'));                                                     exception when duplicate_column then null; end;
  begin alter table public.profiles add column created_by    uuid references auth.users(id) on delete set null;                                             exception when duplicate_column then null; end;
  begin alter table public.profiles add column created_at    timestamptz not null default now();                                                            exception when duplicate_column then null; end;
end $$;

alter table public.profiles enable row level security;

-- Authenticated users can read all profiles within a family
create policy if not exists "profiles: authenticated read"
  on public.profiles for select
  to authenticated
  using (true);

-- Only the creator (or admin) can insert
create policy if not exists "profiles: authenticated insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Creator can update their own member records
create policy if not exists "profiles: creator update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);


-- ─────────────────────────────────────────────
-- 2. RELATIONSHIPS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.relationships (
  id                  uuid primary key default gen_random_uuid(),
  from_profile_id     uuid not null references public.profiles(id) on delete cascade,
  to_profile_id       uuid not null references public.profiles(id) on delete cascade,
  relationship_type   text not null check (relationship_type in ('parent', 'child', 'spouse')),
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  unique (from_profile_id, to_profile_id, relationship_type)
);

alter table public.relationships enable row level security;

create policy if not exists "relationships: authenticated read"
  on public.relationships for select
  to authenticated
  using (true);

create policy if not exists "relationships: authenticated insert"
  on public.relationships for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy if not exists "relationships: creator delete"
  on public.relationships for delete
  to authenticated
  using (auth.uid() = created_by);


-- ─────────────────────────────────────────────
-- 3. FAMILY_MEMBERS TABLE (referenced by auth-context)
-- Ties auth users to the family with a role
-- ─────────────────────────────────────────────
create table if not exists public.family_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role       text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.family_members enable row level security;

create policy if not exists "family_members: authenticated read"
  on public.family_members for select
  to authenticated
  using (true);

create policy if not exists "family_members: self insert"
  on public.family_members for insert
  to authenticated
  with check (auth.uid() = user_id);
