-- ============================================================
-- 008_secure_profile_deletion.sql
-- Admin-only deletion for unclaimed family profiles.
-- ============================================================

-- A profile may have reviewed historical proposals. Preserve those records
-- while allowing the reviewing profile to be deleted.
alter table public.edit_proposals
  drop constraint if exists edit_proposals_reviewed_by_fkey;

alter table public.edit_proposals
  add constraint edit_proposals_reviewed_by_fkey
  foreign key (reviewed_by)
  references public.profiles(id)
  on delete set null;

create or replace function public.delete_family_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete a profile.'
      using errcode = '42501';
  end if;

  select *
    into v_target
    from public.profiles
   where id = p_profile_id
     for update;

  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;

  if v_target.user_id is not null
     or exists (
       select 1
         from public.family_members
        where profile_id = p_profile_id
     ) then
    raise exception 'Profiles linked to an account cannot be deleted.'
      using errcode = '23503';
  end if;

  if not exists (
    select 1
      from public.family_members
     where user_id = auth.uid()
       and family_id = v_target.family_id
       and role = 'admin'
  ) then
    raise exception 'Only a family administrator can delete this profile.'
      using errcode = '42501';
  end if;

  delete from public.profiles where id = p_profile_id;
end;
$$;

revoke all on function public.delete_family_profile(uuid) from public;
grant execute on function public.delete_family_profile(uuid) to authenticated;

comment on function public.delete_family_profile(uuid) is
  'Deletes an unclaimed profile when called by an admin in the same family.';
