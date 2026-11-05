-- Accounts created before the on_auth_user_created trigger existed have no profile row, so "complete profile" found nothing to update.
-- 1) give every such account a profile now, 2) let the app create a missing profile on demand.

insert into public.profiles (id, first_name, last_name, avatar_url)
select
  u.id,
  left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'first_name'), ''), nullif(split_part(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ' ', 1), '')), 50),
  left(nullif(btrim(substr(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), length(split_part(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ' ', 1)) + 1)), ''), 50),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Creates the signed-in user's profile when it is missing (no username yet, so they are sent to finish it). Safe to call any time.
create or replace function public.ensure_my_profile() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := (select auth.uid());
  meta jsonb;
  full_name text;
  first text;
  last text;
begin
  if uid is null then return; end if;
  if exists (select 1 from public.profiles where id = uid) then return; end if;

  select coalesce(raw_user_meta_data, '{}'::jsonb) into meta from auth.users where id = uid;
  if meta is null then return; end if;

  full_name := btrim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));
  first := coalesce(nullif(btrim(meta ->> 'first_name'), ''), nullif(split_part(full_name, ' ', 1), ''));
  last := coalesce(nullif(btrim(meta ->> 'last_name'), ''), nullif(btrim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''));

  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (uid, left(first, 50), left(last, 50), coalesce(meta ->> 'avatar_url', meta ->> 'picture'))
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon, authenticated;
grant execute on function public.ensure_my_profile() to authenticated;
