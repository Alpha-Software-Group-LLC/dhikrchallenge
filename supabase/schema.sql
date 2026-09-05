-- Run this once in the Supabase SQL editor for the production project.
create table if not exists public.dhikr_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.dhikr_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null default (timezone('utc', now()))::date,
  dhikr_id text not null,
  xp integer not null check (xp > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, completion_date, dhikr_id)
);

alter table public.dhikr_profiles enable row level security;
alter table public.dhikr_completions enable row level security;

drop policy if exists "profiles readable by owner" on public.dhikr_profiles;
create policy "profiles readable by owner"
  on public.dhikr_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles insertable by owner" on public.dhikr_profiles;
create policy "profiles insertable by owner"
  on public.dhikr_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles updateable by owner" on public.dhikr_profiles;
create policy "profiles updateable by owner"
  on public.dhikr_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "completions readable by owner" on public.dhikr_completions;
create policy "completions readable by owner"
  on public.dhikr_completions for select
  using (auth.uid() = user_id);

create or replace function public.my_dhikr_progress()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with mine as (
    select * from public.dhikr_completions where user_id = auth.uid()
  ),
  days as (
    select completion_date, count(*)::int completions, sum(xp)::int xp
    from mine group by completion_date order by completion_date
  )
  select jsonb_build_object(
    'completedToday', coalesce((
      select jsonb_agg(dhikr_id) from mine
      where completion_date = (timezone('utc', now()))::date
    ), '[]'::jsonb),
    'totalCompletions', (select count(*)::int from mine),
    'xp', coalesce((select sum(xp)::int from mine), 0),
    'lastActiveDate', (select max(completion_date)::text from mine),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', completion_date::text,
        'completions', completions,
        'xp', xp
      )) from days
    ), '[]'::jsonb)
  );
$$;

-- XP and eligibility are assigned in this database function, never by the browser.
create or replace function public.complete_daily_dhikr(p_dhikr_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
  v_ids text[] := array[
    'astaghfirullah','la_ilaha_illallah','subhanallah','alhamdulillah',
    'allahu_akbar','quran_reading','salawat','hawqala'
  ];
  v_xp integer[] := array[60,50,65,65,65,100,70,55];
  v_start integer;
  v_index integer;
  v_award integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  v_start := mod(v_today - date '2026-01-01', array_length(v_ids, 1)) + 1;
  v_index := array_position(v_ids, p_dhikr_id);
  if v_index is null or p_dhikr_id not in (
    v_ids[v_start],
    v_ids[mod(v_start, array_length(v_ids, 1)) + 1]
  ) then
    raise exception 'This dhikr is not released today';
  end if;
  v_award := v_xp[v_index];
  insert into public.dhikr_completions(user_id, completion_date, dhikr_id, xp)
  values (v_user, v_today, p_dhikr_id, v_award)
  on conflict do nothing;
  return public.my_dhikr_progress();
end;
$$;

create or replace function public.daily_leaderboard()
returns table(rank bigint, name text, xp bigint, "current_user" boolean)
language sql
security definer
set search_path = public
stable
as $$
  select
    row_number() over (order by sum(c.xp) desc, min(c.created_at)),
    p.display_name,
    sum(c.xp),
    p.user_id = auth.uid()
  from public.dhikr_completions c
  join public.dhikr_profiles p on p.user_id = c.user_id
  where c.completion_date = (timezone('utc', now()))::date
  group by p.user_id, p.display_name
  order by sum(c.xp) desc, min(c.created_at)
  limit 25;
$$;

revoke all on function public.complete_daily_dhikr(text) from public, anon;
revoke all on function public.my_dhikr_progress() from public, anon;
grant execute on function public.complete_daily_dhikr(text) to authenticated;
grant execute on function public.my_dhikr_progress() to authenticated;
revoke all on function public.daily_leaderboard() from public, anon;
grant execute on function public.daily_leaderboard() to authenticated;