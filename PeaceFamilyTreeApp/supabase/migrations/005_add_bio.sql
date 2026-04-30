-- ============================================================
-- 005_add_bio.sql
-- Run this in your Supabase dashboard SQL editor
-- ============================================================

-- Add bio column to profiles table if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='bio') then
    alter table public.profiles add column bio text;
  end if;
end $$;
