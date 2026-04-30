-- ============================================================
-- 006_add_roles_and_proposals.sql
-- Run this in your Supabase dashboard SQL editor
-- ============================================================

-- 1. Add role column to profiles if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='role') then
    alter table public.profiles add column role text not null default 'member' check (role in ('admin', 'member'));
  end if;
end $$;

-- 2. Create edit_proposals table
create table if not exists public.edit_proposals (
  id                uuid primary key default gen_random_uuid(),
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  proposed_by       uuid not null references public.profiles(id) on delete cascade,
  change_type       text not null, -- 'profile_update', 'timeline_add', 'media_add'
  proposed_data     jsonb not null,
  original_data     jsonb,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by       uuid references public.profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- Enable RLS
alter table public.edit_proposals enable row level security;

-- Policies
create policy "edit_proposals: authenticated read all"
  on public.edit_proposals for select
  to authenticated
  using (true);

create policy "edit_proposals: authenticated insert"
  on public.edit_proposals for insert
  to authenticated
  with check (true);

create policy "edit_proposals: admin update status"
  on public.edit_proposals for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.family_members fm on fm.profile_id = p.id
      where fm.user_id = auth.uid()
      and p.role = 'admin'
    )
  );

-- 3. Make the first user an admin (optional helper for testing)
-- update public.profiles set role = 'admin' where id in (select profile_id from public.family_members limit 1);
