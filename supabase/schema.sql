-- Run this once in the Supabase SQL editor for the production project.
create extension if not exists pgcrypto with schema extensions;
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
  using ((select auth.uid()) = user_id);

drop policy if exists "profiles insertable by owner" on public.dhikr_profiles;
create policy "profiles insertable by owner"
  on public.dhikr_profiles for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles updateable by owner" on public.dhikr_profiles;
create policy "profiles updateable by owner"
  on public.dhikr_profiles for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "completions readable by owner" on public.dhikr_completions;
create policy "completions readable by owner"
  on public.dhikr_completions for select
  using ((select auth.uid()) = user_id);

create or replace function public.my_dhikr_progress()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
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
    'practiceMinutes', (
      select count(*)::int * 3
      from mine
      where completion_date between (timezone('utc', now()))::date - 6
                                and (timezone('utc', now()))::date
    ),
    'exploredDhikr', (select count(distinct dhikr_id)::int from mine),
    'weekActiveDays', (
      select count(distinct completion_date)::int
      from mine
      where completion_date between (timezone('utc', now()))::date - 6
                                and (timezone('utc', now()))::date
    ),
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

drop function if exists public.daily_leaderboard();

revoke all on function public.complete_daily_dhikr(text) from public, anon;
revoke all on function public.my_dhikr_progress() from public, anon;
grant execute on function public.complete_daily_dhikr(text) to authenticated;
grant execute on function public.my_dhikr_progress() to authenticated;

-- Private circles let friends and family practice together while sharing only
-- a boolean daily participation signal.
create table if not exists public.dhikr_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  invite_code text not null unique check (invite_code ~ '^([A-F0-9]{8}|[A-F0-9]{32})$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.dhikr_circle_members (
  circle_id uuid not null references public.dhikr_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.dhikr_circle_join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists dhikr_circle_join_attempts_user_time_idx
  on public.dhikr_circle_join_attempts(user_id, attempted_at desc);
create index if not exists dhikr_circles_owner_idx
  on public.dhikr_circles(owner_id);
create index if not exists dhikr_circle_members_user_idx
  on public.dhikr_circle_members(user_id);

alter table public.dhikr_circles
  drop constraint if exists dhikr_circles_invite_code_check;
alter table public.dhikr_circles
  add constraint dhikr_circles_invite_code_check
  check (invite_code ~ '^([A-F0-9]{8}|[A-F0-9]{32})$');

alter table public.dhikr_circles enable row level security;
alter table public.dhikr_circle_members enable row level security;
alter table public.dhikr_circle_join_attempts enable row level security;

drop policy if exists "join attempts inaccessible directly" on public.dhikr_circle_join_attempts;
create policy "join attempts inaccessible directly"
  on public.dhikr_circle_join_attempts for all
  using (false) with check (false);

drop policy if exists "circles readable by members" on public.dhikr_circles;
create policy "circles readable by members"
  on public.dhikr_circles for select
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.dhikr_circle_members m
      where m.circle_id = id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists "members readable by members" on public.dhikr_circle_members;
create policy "members readable by members"
  on public.dhikr_circle_members for select
  using (user_id = (select auth.uid()));

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
    upper(encode(extensions.gen_random_bytes(16), 'hex')),
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
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  if (
    select count(*)
    from public.dhikr_circle_join_attempts
    where user_id = v_user and attempted_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception 'Too many join attempts. Please wait a minute and try again';
  end if;
  insert into public.dhikr_circle_join_attempts(user_id) values (v_user);
  delete from public.dhikr_circle_join_attempts
  where user_id = v_user and attempted_at < now() - interval '1 day';
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

drop function if exists public.circle_engagement(uuid);

revoke all on function public.create_dhikr_circle(text) from public, anon;
revoke all on function public.join_dhikr_circle(text) from public, anon;
revoke all on function public.my_dhikr_circles() from public, anon;
grant execute on function public.create_dhikr_circle(text) to authenticated;
grant execute on function public.join_dhikr_circle(text) to authenticated;
grant execute on function public.my_dhikr_circles() to authenticated;

-- Cross-device experience state. Preferences remain JSON so older clients can
-- add harmless presentation settings without requiring a schema migration.
create table if not exists public.dhikr_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(preferences) = 'object' and octet_length(preferences::text) <= 8192),
  updated_at timestamptz not null default now()
);

create table if not exists public.dhikr_reflections (
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null,
  dhikr_id text not null check (char_length(dhikr_id) between 1 and 120),
  mood text not null check (mood in (
    'peaceful', 'calm', 'grateful', 'grounded', 'hopeful',
    'reflective', 'comforted', 'focused', 'tender', 'heavy',
    'connected', 'uplifted', 'emotional', 'distracted'
  )),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, completion_date, dhikr_id),
  foreign key (user_id, completion_date, dhikr_id)
    references public.dhikr_completions(user_id, completion_date, dhikr_id)
    on delete cascade
);

create table if not exists public.dhikr_saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in (
    'dhikr', 'adhkar', 'quran', 'verse', 'hadith', 'arabic',
    'guidance', 'tool', 'tools'
  )),
  item_id text not null check (char_length(item_id) between 1 and 160),
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table if not exists public.dhikr_circle_intentions (
  circle_id uuid not null references public.dhikr_circles(id) on delete cascade,
  intention_date date not null default (timezone('utc', now()))::date,
  intention text not null check (char_length(intention) between 1 and 280),
  set_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (circle_id, intention_date)
);

create index if not exists dhikr_reflections_user_created_idx
  on public.dhikr_reflections(user_id, created_at desc);
create index if not exists dhikr_saved_items_user_created_idx
  on public.dhikr_saved_items(user_id, created_at desc);
create index if not exists dhikr_circle_intentions_set_by_idx
  on public.dhikr_circle_intentions(set_by);

alter table public.dhikr_preferences enable row level security;
alter table public.dhikr_reflections enable row level security;
alter table public.dhikr_saved_items enable row level security;
alter table public.dhikr_circle_intentions enable row level security;

drop policy if exists "preferences owned by user" on public.dhikr_preferences;
create policy "preferences owned by user" on public.dhikr_preferences
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "reflections owned by user" on public.dhikr_reflections;
create policy "reflections owned by user" on public.dhikr_reflections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "saved items owned by user" on public.dhikr_saved_items;
create policy "saved items owned by user" on public.dhikr_saved_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "circle intentions readable by members" on public.dhikr_circle_intentions;
create policy "circle intentions readable by members"
  on public.dhikr_circle_intentions for select
  using (exists (
    select 1
    from public.dhikr_circle_members m
    where m.circle_id = dhikr_circle_intentions.circle_id
      and m.user_id = (select auth.uid())
  ));

drop policy if exists "circle intentions insertable by owner" on public.dhikr_circle_intentions;
create policy "circle intentions insertable by owner"
  on public.dhikr_circle_intentions for insert
  with check (
    set_by = (select auth.uid())
    and exists (
      select 1 from public.dhikr_circles c
      where c.id = dhikr_circle_intentions.circle_id
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "circle intentions updateable by owner" on public.dhikr_circle_intentions;
create policy "circle intentions updateable by owner"
  on public.dhikr_circle_intentions for update
  using (exists (
    select 1 from public.dhikr_circles c
    where c.id = dhikr_circle_intentions.circle_id
      and c.owner_id = (select auth.uid())
  ))
  with check (
    set_by = (select auth.uid())
    and exists (
      select 1 from public.dhikr_circles c
      where c.id = dhikr_circle_intentions.circle_id
        and c.owner_id = (select auth.uid())
    )
  );

create or replace function public.my_dhikr_experience()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  return jsonb_build_object(
    'onboardingCompleted', coalesce((
      select onboarding_completed
      from public.dhikr_preferences
      where user_id = v_user
    ), false),
    'preferences', coalesce((
      select preferences
      from public.dhikr_preferences
      where user_id = v_user
    ), '{}'::jsonb),
    'reflections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'dhikrId', r.dhikr_id,
        'date', r.completion_date::text,
        'mood', r.mood,
        'note', r.note,
        'createdAt', r.created_at
      ) order by r.created_at desc)
      from public.dhikr_reflections r
      where r.user_id = v_user
    ), '[]'::jsonb),
    'savedItems', coalesce((
      select jsonb_agg(jsonb_build_object(
        'itemType', s.item_type,
        'itemId', s.item_id,
        'savedAt', s.created_at
      ) order by s.created_at desc)
      from public.dhikr_saved_items s
      where s.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.save_dhikr_preferences(p_preferences jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_preferences is null or jsonb_typeof(p_preferences) <> 'object' then
    raise exception 'Preferences must be a JSON object';
  end if;
  if octet_length(p_preferences::text) > 8192 then
    raise exception 'Preferences are too large';
  end if;
  if p_preferences ? 'recitationMode'
     and p_preferences->>'recitationMode' not in ('arabic', 'english', 'both') then
    raise exception 'Invalid recitation mode';
  end if;
  if p_preferences ? 'audio'
     and p_preferences->>'audio' not in ('arabic', 'english', 'both') then
    raise exception 'Invalid audio preference';
  end if;
  if p_preferences ? 'duration'
     and (jsonb_typeof(p_preferences->'duration') <> 'number'
          or (p_preferences->>'duration')::int not in (1, 3, 5)) then
    raise exception 'Invalid practice duration';
  end if;
  if p_preferences ? 'goals'
     and (jsonb_typeof(p_preferences->'goals') <> 'array'
          or jsonb_array_length(p_preferences->'goals') > 4) then
    raise exception 'Invalid practice goals';
  end if;
  if p_preferences ? 'school'
     and p_preferences->>'school' not in (
       '', 'Hanafi', 'Maliki', 'Shafi''i', 'Hanbali', 'Other / prefer not to say'
     ) then
    raise exception 'Invalid school preference';
  end if;
  if p_preferences ? 'theme'
     and p_preferences->>'theme' not in ('system', 'light', 'dark') then
    raise exception 'Invalid theme';
  end if;
  if p_preferences ? 'reminderTime'
     and p_preferences->>'reminderTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Invalid reminder time';
  end if;
  if p_preferences ? 'reminder'
     and p_preferences->>'reminder' <> ''
     and p_preferences->>'reminder' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Invalid reminder time';
  end if;
  if p_preferences ? 'onboardingCompleted'
     and jsonb_typeof(p_preferences->'onboardingCompleted') <> 'boolean' then
    raise exception 'onboardingCompleted must be a boolean';
  end if;

  insert into public.dhikr_preferences(user_id, onboarding_completed, preferences, updated_at)
  values (
    v_user,
    case when p_preferences ? 'onboardingCompleted'
      then (p_preferences->'onboardingCompleted')::boolean else true end,
    p_preferences - 'onboardingCompleted',
    now()
  )
  on conflict (user_id) do update
    set onboarding_completed = case
          when p_preferences ? 'onboardingCompleted'
            then (p_preferences->'onboardingCompleted')::boolean
          else true
        end,
        preferences = excluded.preferences,
        updated_at = now();
end;
$$;

create or replace function public.save_dhikr_reflection(
  p_dhikr_id text,
  p_mood text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
  v_id text := trim(p_dhikr_id);
  v_mood text := lower(trim(p_mood));
  v_note text := nullif(trim(p_note), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_id is null or char_length(v_id) not between 1 and 120 then
    raise exception 'Invalid dhikr id';
  end if;
  if v_mood is null or v_mood not in (
    'peaceful', 'calm', 'grateful', 'grounded', 'hopeful',
    'reflective', 'comforted', 'focused', 'tender', 'heavy',
    'connected', 'uplifted', 'emotional', 'distracted'
  ) then
    raise exception 'Invalid reflection mood';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'Reflection note must be 1000 characters or fewer';
  end if;
  if not exists (
    select 1 from public.dhikr_completions
    where user_id = v_user and completion_date = v_today and dhikr_id = v_id
  ) then
    raise exception 'Complete this dhikr before reflecting';
  end if;

  insert into public.dhikr_reflections(
    user_id, completion_date, dhikr_id, mood, note
  ) values (v_user, v_today, v_id, v_mood, v_note)
  on conflict (user_id, completion_date, dhikr_id) do update
    set mood = excluded.mood, note = excluded.note, updated_at = now();
end;
$$;

create or replace function public.toggle_saved_item(p_item_type text, p_item_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_type text := lower(trim(p_item_type));
  v_id text := trim(p_item_id);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_type is null or v_type not in (
    'dhikr', 'adhkar', 'quran', 'verse', 'hadith', 'arabic',
    'guidance', 'tool', 'tools'
  ) then
    raise exception 'Invalid saved item type';
  end if;
  if v_id is null or char_length(v_id) not between 1 and 160 then
    raise exception 'Invalid saved item id';
  end if;

  delete from public.dhikr_saved_items
  where user_id = v_user and item_type = v_type and item_id = v_id;
  if found then return false; end if;

  insert into public.dhikr_saved_items(user_id, item_type, item_id)
  values (v_user, v_type, v_id);
  return true;
end;
$$;

create or replace function public.circle_today(p_circle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.dhikr_circle_members
    where circle_id = p_circle_id and user_id = v_user
  ) then
    raise exception 'You are not a member of this circle';
  end if;

  return jsonb_build_object(
    'intention', (
      select i.intention
      from public.dhikr_circle_intentions i
      where i.circle_id = p_circle_id and i.intention_date = v_today
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', x.name,
        'completedToday', x.completed_today,
        'currentUser', x.current_user
      ) order by x.completed_today desc, x.name)
      from (
        select
          coalesce(p.display_name, 'Member')::text as name,
          exists (
            select 1
            from public.dhikr_completions c
            where c.user_id = m.user_id and c.completion_date = v_today
          ) as completed_today,
          m.user_id = v_user as current_user
        from public.dhikr_circle_members m
        left join public.dhikr_profiles p on p.user_id = m.user_id
        where m.circle_id = p_circle_id
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.set_circle_intention(
  p_circle_id uuid,
  p_intention text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
  v_intention text := nullif(trim(p_intention), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.dhikr_circles
    where id = p_circle_id and owner_id = v_user
  ) then
    raise exception 'Only the circle owner can set its intention';
  end if;
  if v_intention is null or char_length(v_intention) > 280 then
    raise exception 'Intention must be between 1 and 280 characters';
  end if;

  insert into public.dhikr_circle_intentions(
    circle_id, intention_date, intention, set_by
  ) values (p_circle_id, v_today, v_intention, v_user)
  on conflict (circle_id, intention_date) do update
    set intention = excluded.intention, set_by = excluded.set_by, updated_at = now();
end;
$$;

revoke all on function public.my_dhikr_experience() from public, anon;
revoke all on function public.save_dhikr_preferences(jsonb) from public, anon;
revoke all on function public.save_dhikr_reflection(text, text, text) from public, anon;
revoke all on function public.toggle_saved_item(text, text) from public, anon;
revoke all on function public.circle_today(uuid) from public, anon;
revoke all on function public.set_circle_intention(uuid, text) from public, anon;
grant execute on function public.my_dhikr_experience() to authenticated;
grant execute on function public.save_dhikr_preferences(jsonb) to authenticated;
grant execute on function public.save_dhikr_reflection(text, text, text) to authenticated;
grant execute on function public.toggle_saved_item(text, text) to authenticated;
grant execute on function public.circle_today(uuid) to authenticated;
grant execute on function public.set_circle_intention(uuid, text) to authenticated;