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

-- Private circles let friends and family practice together without exposing
-- the global leaderboard to anonymous visitors.
create table if not exists public.dhikr_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{8}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.dhikr_circle_members (
  circle_id uuid not null references public.dhikr_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

alter table public.dhikr_circles enable row level security;
alter table public.dhikr_circle_members enable row level security;

drop policy if exists "circles readable by members" on public.dhikr_circles;
create policy "circles readable by members"
  on public.dhikr_circles for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.dhikr_circle_members m
      where m.circle_id = id and m.user_id = auth.uid()
    )
  );

drop policy if exists "members readable by members" on public.dhikr_circle_members;
create policy "members readable by members"
  on public.dhikr_circle_members for select
  using (user_id = auth.uid());

create or replace function public.create_dhikr_circle(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_circle public.dhikr_circles;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_name)) < 2 then raise exception 'Circle name is too short'; end if;
  insert into public.dhikr_circles(name, invite_code, owner_id)
  values (
    trim(p_name),
    upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
    v_user
  )
  returning * into v_circle;
  insert into public.dhikr_circle_members(circle_id, user_id)
  values (v_circle.id, v_user);
  return jsonb_build_object(
    'id', v_circle.id,
    'name', v_circle.name,
    'inviteCode', v_circle.invite_code,
    'ownerId', v_circle.owner_id
  );
end;
$$;

create or replace function public.join_dhikr_circle(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_circle public.dhikr_circles;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_circle
  from public.dhikr_circles
  where invite_code = upper(trim(p_invite_code));
  if v_circle.id is null then raise exception 'Circle code not found'; end if;
  insert into public.dhikr_circle_members(circle_id, user_id)
  values (v_circle.id, v_user)
  on conflict do nothing;
  return jsonb_build_object(
    'id', v_circle.id,
    'name', v_circle.name,
    'inviteCode', v_circle.invite_code,
    'ownerId', v_circle.owner_id
  );
end;
$$;

create or replace function public.my_dhikr_circles()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'inviteCode', c.invite_code,
    'ownerId', c.owner_id,
    'memberCount', (
      select count(*) from public.dhikr_circle_members m2
      where m2.circle_id = c.id
    )
  ) order by c.created_at desc), '[]'::jsonb)
  from public.dhikr_circles c
  where c.owner_id = auth.uid()
     or exists (
       select 1 from public.dhikr_circle_members m
       where m.circle_id = c.id and m.user_id = auth.uid()
     );
$$;

create or replace function public.circle_engagement(p_circle_id uuid)
returns table(name text, completed_today bigint, xp_today bigint, last_active timestamptz, "current_user" boolean)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (
    select 1 from public.dhikr_circle_members
    where circle_id = p_circle_id and user_id = auth.uid()
  ) then
    raise exception 'You are not a member of this circle';
  end if;
  return query
    select
      coalesce(p.display_name, 'Member')::text,
      count(c.dhikr_id)::bigint,
      coalesce(sum(c.xp), 0)::bigint,
      max(c.created_at),
      m.user_id = auth.uid()
    from public.dhikr_circle_members m
    left join public.dhikr_profiles p on p.user_id = m.user_id
    left join public.dhikr_completions c
      on c.user_id = m.user_id
      and c.completion_date = (timezone('utc', now()))::date
    where m.circle_id = p_circle_id
    group by m.user_id, p.display_name
    order by count(c.dhikr_id) desc, max(c.created_at) desc nulls last, p.display_name;
end;
$$;

revoke all on function public.create_dhikr_circle(text) from public, anon;
revoke all on function public.join_dhikr_circle(text) from public, anon;
revoke all on function public.my_dhikr_circles() from public, anon;
revoke all on function public.circle_engagement(uuid) from public, anon;
grant execute on function public.create_dhikr_circle(text) to authenticated;
grant execute on function public.join_dhikr_circle(text) to authenticated;
grant execute on function public.my_dhikr_circles() to authenticated;
grant execute on function public.circle_engagement(uuid) to authenticated;