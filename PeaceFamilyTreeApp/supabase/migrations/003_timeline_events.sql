-- ============================================================
-- 003_timeline_events.sql
-- Run this in your Supabase dashboard SQL editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TIMELINE_EVENTS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.timeline_events (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  icon         text not null default 'circle',
  year         text not null,
  title        text not null,
  date_label   text,
  description  text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.timeline_events enable row level security;

create policy if not exists "timeline_events: authenticated read"
  on public.timeline_events for select
  to authenticated
  using (true);

create policy if not exists "timeline_events: authenticated insert"
  on public.timeline_events for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy if not exists "timeline_events: creator update"
  on public.timeline_events for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy if not exists "timeline_events: creator delete"
  on public.timeline_events for delete
  to authenticated
  using (auth.uid() = created_by);
