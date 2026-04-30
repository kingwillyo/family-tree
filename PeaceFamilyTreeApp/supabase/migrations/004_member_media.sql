-- ============================================================
-- 004_member_media.sql
-- Run this in your Supabase dashboard SQL editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. MEMBER-AVATARS STORAGE BUCKET
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('member-avatars', 'member-avatars', true)
  on conflict (id) do nothing;

create policy if not exists "member-avatars: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-avatars');

create policy if not exists "member-avatars: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'member-avatars');

create policy if not exists "member-avatars: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-avatars');

create policy if not exists "member-avatars: authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-avatars');


-- ─────────────────────────────────────────────
-- 3. MEMBER-MEDIA STORAGE BUCKET
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('member-media', 'member-media', true)
  on conflict (id) do nothing;

create policy if not exists "member-media: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-media');

create policy if not exists "member-media: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'member-media');

create policy if not exists "member-media: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-media');
