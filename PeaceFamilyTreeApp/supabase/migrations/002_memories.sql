-- ============================================================
-- 002_memories.sql
-- Run this in your Supabase dashboard SQL editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. MEMORIES TABLE
-- ─────────────────────────────────────────────
create table if not exists public.memories (
  id                uuid primary key default gen_random_uuid(),
  author_profile_id uuid references public.profiles(id) on delete set null,
  created_by        uuid references auth.users(id) on delete set null,
  type              text not null check (type in ('story', 'photo', 'audio')),
  title             text,
  body              text,
  location          text,
  image_urls        text[] default '{}',
  audio_url         text,
  created_at        timestamptz not null default now()
);

alter table public.memories enable row level security;

-- All authenticated users can read memories
create policy if not exists "memories: authenticated read"
  on public.memories for select
  to authenticated
  using (true);

-- Only the creator can insert
create policy if not exists "memories: authenticated insert"
  on public.memories for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Creator can update their own memories
create policy if not exists "memories: creator update"
  on public.memories for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Creator can delete their own memories
create policy if not exists "memories: creator delete"
  on public.memories for delete
  to authenticated
  using (auth.uid() = created_by);

-- ─────────────────────────────────────────────
-- 2. STORAGE BUCKET FOR MEMORY IMAGES
-- Run this separately if the SQL editor doesn't
-- support storage.create_bucket, or create the
-- bucket manually in Supabase Dashboard > Storage
-- ─────────────────────────────────────────────

-- Create the public bucket (idempotent)
insert into storage.buckets (id, name, public)
  values ('memory-images', 'memory-images', true)
  on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy if not exists "memory-images: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public reads
create policy if not exists "memory-images: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'memory-images');

-- Allow creators to delete their own files
create policy if not exists "memory-images: creator delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);
