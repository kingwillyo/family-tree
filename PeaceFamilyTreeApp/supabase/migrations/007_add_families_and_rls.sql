-- ============================================================
-- 007_add_families_and_rls.sql
-- ============================================================

-- 1. Create families table
create table if not exists public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Policy creation moved to Step 4 after family_members is updated with family_id

drop policy if exists "families: self insert" on public.families;
create policy "families: self insert"
  on public.families for insert
  to authenticated
  with check (auth.uid() = created_by);

-- 2. Add family_id to profiles and family_members
do $$ begin
  alter table public.profiles add column family_id uuid references public.families(id) on delete cascade;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table public.family_members add column family_id uuid references public.families(id) on delete cascade;
exception when duplicate_column then null; end $$;

-- Drop the old unique constraint on user_id if they want to be part of multiple trees eventually 
-- We replace it with unique(user_id, family_id)
alter table public.family_members drop constraint if exists family_members_user_id_key;
do $$ begin
  alter table public.family_members add constraint family_members_user_id_family_id_key unique (user_id, family_id);
exception when duplicate_table then null; end $$;

-- 3. Data Migration for existing records (Create a default family for any existing profiles safely)
do $$ 
declare 
  default_family_id uuid;
begin
  -- Only do this if there are profiles WITHOUT a family_id
  if exists (select 1 from public.profiles where family_id is null) then
    insert into public.families (name) values ('Legacy Family Album') returning id into default_family_id;
    
    update public.profiles set family_id = default_family_id where family_id is null;
    update public.family_members set family_id = default_family_id where family_id is null;
  end if;
end $$;

-- Now make them not null
alter table public.profiles alter column family_id set not null;
alter table public.family_members alter column family_id set not null;

-- Families
drop policy if exists "families: members read" on public.families;
create policy "families: members read" on public.families for select to authenticated
using (
  created_by = auth.uid() OR
  id in (
    select family_id from public.family_members where user_id = auth.uid()
  )
);

-- Profiles
drop policy if exists "profiles: authenticated read" on public.profiles;
drop policy if exists "profiles: family read" on public.profiles;
create policy "profiles: family read" on public.profiles for select to authenticated
using (
  user_id = auth.uid() OR
  created_by = auth.uid() OR
  family_id in (select family_id from public.family_members where user_id = auth.uid())
);

-- Family Members
drop policy if exists "family_members: authenticated read" on public.family_members;
drop policy if exists "family_members: family read" on public.family_members;
create policy "family_members: family read" on public.family_members for select to authenticated
using (user_id = auth.uid());

-- Relationships (linked via from_profile_id)
drop policy if exists "relationships: authenticated read" on public.relationships;
drop policy if exists "relationships: family read" on public.relationships;
create policy "relationships: family read" on public.relationships for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    join public.family_members fm on fm.family_id = p.family_id
    where p.id = relationships.from_profile_id
    and fm.user_id = auth.uid()
  )
);

-- Memories
drop policy if exists "memories: authenticated read" on public.memories;
drop policy if exists "memories: family read" on public.memories;
create policy "memories: family read" on public.memories for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    join public.family_members fm on fm.family_id = p.family_id
    where p.id = memories.author_profile_id
    and fm.user_id = auth.uid()
  )
);

-- Timeline Events
drop policy if exists "timeline_events: authenticated read" on public.timeline_events;
drop policy if exists "timeline_events: family read" on public.timeline_events;
create policy "timeline_events: family read" on public.timeline_events for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    join public.family_members fm on fm.family_id = p.family_id
    where p.id = timeline_events.profile_id
    and fm.user_id = auth.uid()
  )
);

-- Edit Proposals
drop policy if exists "edit_proposals: authenticated read all" on public.edit_proposals;
drop policy if exists "edit_proposals: family read" on public.edit_proposals;
create policy "edit_proposals: family read" on public.edit_proposals for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    join public.family_members fm on fm.family_id = p.family_id
    where p.id = edit_proposals.target_profile_id
    and fm.user_id = auth.uid()
  )
);
