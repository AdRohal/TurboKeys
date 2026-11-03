-- TurboKeys: profiles, typing tests, stats, leaderboard.
-- Replaces the Express + MongoDB backend that ran on Render.
-- Auth is Supabase Auth (email/password, Google, GitHub). Every table has row-level security on.

------------------------------------------------------------------------------------------------
-- profiles: one row per auth user (username, name, preferences, running stats)
------------------------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- null until an OAuth user picks one on /complete-profile
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  profile_completed boolean not null default false,
  role text not null default 'user' check (role in ('user', 'admin')),
  theme text not null default 'dark' check (theme in ('light', 'dark')),
  language text not null default 'english' check (language in ('english', 'french')),
  -- running stats, kept by the trigger below; users cannot write them
  total_tests integer not null default 0,
  best_wpm integer not null default 0,
  average_wpm integer not null default 0,
  best_accuracy integer not null default 0,
  average_accuracy integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or (char_length(username) between 3 and 30 and username ~ '^[A-Za-z0-9_.-]+$')
  ),
  constraint profiles_first_name_len check (first_name is null or char_length(first_name) <= 50),
  constraint profiles_last_name_len check (last_name is null or char_length(last_name) <= 50)
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

------------------------------------------------------------------------------------------------
-- typing_tests: one row per finished test
------------------------------------------------------------------------------------------------
create table public.typing_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  wpm integer not null check (wpm between 0 and 400),
  accuracy integer not null check (accuracy between 0 and 100),
  duration integer not null check (duration in (15, 30, 60, 120)),
  mode text not null default 'time' check (mode in ('time', 'words', 'quote')),
  language text not null default 'english' check (language in ('english', 'french', 'spanish', 'german')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  characters_typed integer not null check (characters_typed >= 0),
  errors_count integer not null default 0 check (errors_count >= 0),
  correct_characters integer not null check (correct_characters >= 0),
  total_characters integer not null check (total_characters >= 0),
  test_text text not null check (char_length(test_text) <= 20000),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index typing_tests_user_completed_idx on public.typing_tests (user_id, completed_at desc);
create index typing_tests_board_idx on public.typing_tests (duration, mode, language, wpm desc);

------------------------------------------------------------------------------------------------
-- housekeeping triggers
------------------------------------------------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

-- profile_completed follows the username, so a client cannot mark itself complete
create function public.sync_profile_completed() returns trigger
language plpgsql as $$
begin
  new.profile_completed := new.username is not null;
  return new;
end;
$$;

create trigger profiles_sync_completed before insert or update of username on public.profiles
  for each row execute function public.sync_profile_completed();

-- a profile is created for every new auth user (email sign-up carries the username in its metadata)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  uname text := nullif(btrim(meta ->> 'username'), '');
  full_name text := btrim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));
  first text := coalesce(nullif(btrim(meta ->> 'first_name'), ''), nullif(split_part(full_name, ' ', 1), ''));
  last text := coalesce(
    nullif(btrim(meta ->> 'last_name'), ''),
    nullif(btrim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')
  );
begin
  insert into public.profiles (id, username, first_name, last_name, avatar_url)
  values (
    new.id,
    uname,
    left(first, 50),
    left(last, 50),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------------------------
-- running stats: recomputed from the tests after every insert or delete
------------------------------------------------------------------------------------------------
create function public.refresh_profile_stats() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles p
  set total_tests = s.total,
      best_wpm = s.best_wpm,
      average_wpm = s.avg_wpm,
      best_accuracy = s.best_acc,
      average_accuracy = s.avg_acc
  from (
    select count(*)::int as total,
           coalesce(max(wpm), 0)::int as best_wpm,
           coalesce(round(avg(wpm)), 0)::int as avg_wpm,
           coalesce(max(accuracy), 0)::int as best_acc,
           coalesce(round(avg(accuracy)), 0)::int as avg_acc
    from public.typing_tests
    where user_id = uid
  ) s
  where p.id = uid;
  return null;
end;
$$;

create trigger typing_tests_refresh_stats after insert or delete on public.typing_tests
  for each row execute function public.refresh_profile_stats();


------------------------------------------------------------------------------------------------
-- pace limit: a test cannot finish sooner than its own length after the previous one.
-- A 30 s test takes 30 s to type, so a script that posts results faster than that is not a person.
-- (5 s of slack covers clock and network jitter.)
------------------------------------------------------------------------------------------------
create function public.enforce_test_pace() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1
    from public.typing_tests t
    where t.user_id = new.user_id
      and t.completed_at > now() - make_interval(secs => greatest(new.duration - 5, 0))
  ) then
    raise exception 'tests_too_fast'
      using errcode = 'TK429', hint = 'A test cannot finish sooner than its own length after the previous one.';
  end if;
  return new;
end;
$$;

create trigger typing_tests_pace before insert on public.typing_tests
  for each row execute function public.enforce_test_pace();

------------------------------------------------------------------------------------------------
-- row-level security
------------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.typing_tests enable row level security;

-- Supabase grants new tables to anon/authenticated by default: start from nothing, then grant what is needed.
revoke all on public.profiles from anon, authenticated;
revoke all on public.typing_tests from anon, authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.profiles to authenticated;
-- stats, role and ids are not writable by a client
grant update (username, first_name, last_name, avatar_url, theme, language) on public.profiles to authenticated;

create policy typing_tests_select_own on public.typing_tests for select to authenticated
  using (user_id = (select auth.uid()));
create policy typing_tests_insert_own on public.typing_tests for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy typing_tests_delete_own on public.typing_tests for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.typing_tests to authenticated;
-- completed_at, created_at and id always come from the database
grant insert (user_id, wpm, accuracy, duration, mode, language, difficulty, characters_typed, errors_count,
              correct_characters, total_characters, test_text)
  on public.typing_tests to authenticated;

------------------------------------------------------------------------------------------------
-- functions the app calls
------------------------------------------------------------------------------------------------

-- Public leaderboard: each user's best result for one category. Only usernames and avatars leave the database.
create function public.leaderboard(p_duration integer, p_mode text, p_language text, p_limit integer default 50)
returns table (
  user_id uuid,
  username text,
  avatar text,
  best_wpm integer,
  best_accuracy integer,
  best_score integer,
  test_count integer,
  latest_test timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id,
         p.username,
         p.avatar_url,
         max(t.wpm)::int,
         max(t.accuracy)::int,
         round(max(t.wpm * t.accuracy / 100.0))::int,
         count(*)::int,
         max(t.completed_at)
  from public.typing_tests t
  join public.profiles p on p.id = t.user_id
  where t.duration = p_duration
    and t.mode = p_mode
    and t.language = p_language
    and p.username is not null
  group by p.id, p.username, p.avatar_url
  order by max(t.wpm) desc, max(t.wpm * t.accuracy / 100.0) desc, p.username
  limit least(greatest(p_limit, 1), 100);
$$;

-- The signed-in user's best result per category (security invoker: row-level security applies).
create function public.my_best_scores()
returns table (
  duration integer,
  mode text,
  language text,
  best_wpm integer,
  best_accuracy integer,
  best_score integer,
  test_count integer,
  latest_test timestamptz
)
language sql stable security invoker set search_path = public as $$
  select t.duration,
         t.mode,
         t.language,
         max(t.wpm)::int,
         max(t.accuracy)::int,
         round(max(t.wpm * t.accuracy / 100.0))::int,
         count(*)::int,
         max(t.completed_at)
  from public.typing_tests t
  where t.user_id = (select auth.uid())
  group by t.duration, t.mode, t.language
  order by t.duration, t.mode, t.language;
$$;

-- Totals for the signed-in user.
create function public.my_typing_stats()
returns table (
  total_tests integer,
  average_wpm integer,
  average_accuracy integer,
  best_wpm integer,
  best_accuracy integer,
  total_characters_typed bigint,
  total_errors bigint,
  total_time_minutes integer
)
language sql stable security invoker set search_path = public as $$
  select count(*)::int,
         coalesce(round(avg(t.wpm)), 0)::int,
         coalesce(round(avg(t.accuracy)), 0)::int,
         coalesce(max(t.wpm), 0)::int,
         coalesce(max(t.accuracy), 0)::int,
         coalesce(sum(t.characters_typed), 0)::bigint,
         coalesce(sum(t.errors_count), 0)::bigint,
         coalesce(round(sum(t.duration) / 60.0), 0)::int
  from public.typing_tests t
  where t.user_id = (select auth.uid());
$$;

-- Is this username free? Usernames are public on the leaderboard, so anyone may ask.
-- A signed-in user's own current username counts as free.
create function public.username_available(p_username text)
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(btrim(p_username))
      and p.id is distinct from (select auth.uid())
  );
$$;

-- Deletes the signed-in user. Their profile and every test go with them (cascade).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

-- functions are executable by everyone by default: close that, then open only what each one needs
revoke all on function public.leaderboard(integer, text, text, integer) from public, anon, authenticated;
revoke all on function public.my_best_scores() from public, anon, authenticated;
revoke all on function public.my_typing_stats() from public, anon, authenticated;
revoke all on function public.username_available(text) from public, anon, authenticated;
revoke all on function public.delete_my_account() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.refresh_profile_stats() from public, anon, authenticated;
revoke all on function public.enforce_test_pace() from public, anon, authenticated;

grant execute on function public.leaderboard(integer, text, text, integer) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.my_best_scores() to authenticated;
grant execute on function public.my_typing_stats() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
