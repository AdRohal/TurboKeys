-- Fast thinking (mental math) rounds and their leaderboard.
-- Same rules as typing_tests: row-level security on, users can only add their own rounds, ids and times come from the database.

------------------------------------------------------------------------------------------------
-- math_rounds: one row per finished 60 second round
------------------------------------------------------------------------------------------------
create table public.math_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null check (points between 0 and 3000),
  correct integer not null check (correct between 0 and 120),
  wrong integer not null check (wrong between 0 and 120),
  best_streak integer not null check (best_streak >= 0),
  -- average time to answer, in milliseconds (0 when nothing was answered)
  avg_answer_ms integer not null check (avg_answer_ms between 0 and 60000),
  level integer not null check (level between 1 and 6),
  duration integer not null default 60 check (duration = 60),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- a right answer scores 10 points, plus up to 10 more for a streak: so the totals have to add up
  constraint math_rounds_points_range check (points >= correct * 10 and points <= correct * 20),
  constraint math_rounds_streak_le_correct check (best_streak <= correct),
  -- nobody answers a question in under 0.4 s on average
  constraint math_rounds_pace check (correct + wrong = 0 or avg_answer_ms >= 400)
);

create index math_rounds_user_completed_idx on public.math_rounds (user_id, completed_at desc);
create index math_rounds_board_idx on public.math_rounds (points desc);

------------------------------------------------------------------------------------------------
-- pace limit: a round cannot finish sooner than its own length after the previous one (5 s of slack)
------------------------------------------------------------------------------------------------
create function public.enforce_math_pace() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1
    from public.math_rounds r
    where r.user_id = new.user_id
      and r.completed_at > now() - make_interval(secs => greatest(new.duration - 5, 0))
  ) then
    raise exception 'tests_too_fast'
      using errcode = 'TK429', hint = 'A round cannot finish sooner than its own length after the previous one.';
  end if;
  return new;
end;
$$;

create trigger math_rounds_pace before insert on public.math_rounds
  for each row execute function public.enforce_math_pace();

------------------------------------------------------------------------------------------------
-- row-level security
------------------------------------------------------------------------------------------------
alter table public.math_rounds enable row level security;
revoke all on public.math_rounds from anon, authenticated;

create policy math_rounds_select_own on public.math_rounds for select to authenticated
  using (user_id = (select auth.uid()));
create policy math_rounds_insert_own on public.math_rounds for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy math_rounds_delete_own on public.math_rounds for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.math_rounds to authenticated;
grant insert (user_id, points, correct, wrong, best_streak, avg_answer_ms, level) on public.math_rounds to authenticated;

------------------------------------------------------------------------------------------------
-- public leaderboard: each player's best round. Only usernames and avatars leave the database.
------------------------------------------------------------------------------------------------
create function public.math_leaderboard(p_limit integer default 50)
returns table (
  user_id uuid,
  username text,
  avatar text,
  best_points integer,
  best_correct integer,
  best_accuracy integer,
  best_streak integer,
  round_count integer,
  latest_round timestamptz
)
language sql stable security definer set search_path = public as $$
  with best as (
    select distinct on (r.user_id)
           r.user_id, r.points, r.correct, r.wrong
    from public.math_rounds r
    order by r.user_id, r.points desc, r.correct desc, r.completed_at
  ),
  totals as (
    select r.user_id, max(r.best_streak)::int as best_streak, count(*)::int as round_count, max(r.completed_at) as latest_round
    from public.math_rounds r
    group by r.user_id
  )
  select p.id,
         p.username,
         p.avatar_url,
         b.points,
         b.correct,
         case when b.correct + b.wrong = 0 then 0 else round(100.0 * b.correct / (b.correct + b.wrong))::int end,
         t.best_streak,
         t.round_count,
         t.latest_round
  from best b
  join totals t on t.user_id = b.user_id
  join public.profiles p on p.id = b.user_id
  where p.username is not null
  order by b.points desc, b.correct desc, p.username
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.math_leaderboard(integer) from public, anon, authenticated;
grant execute on function public.math_leaderboard(integer) to anon, authenticated;

-- internal trigger function: nobody calls it directly
revoke all on function public.enforce_math_pace() from public, anon, authenticated;
