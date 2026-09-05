-- 0002_evolution.sql
-- Dhikr Challenge 2.0: personal 30-day journeys, sessions, knowledge, richer Circles.
--
-- This migration is ADDITIVE and idempotent. It assumes supabase/schema.sql
-- (the baseline) has been applied. It never drops a table or deletes user data.
-- Functions whose signatures change are dropped and recreated so PostgREST
-- never sees two overloads with the same named parameters.
--
-- Privacy rules enforced here (not in the UI):
--   * A user can only read their own completions, sessions, knowledge,
--     reflections and preferences.
--   * Circle members can see another member's daily participation only if that
--     member's activity_visibility is 'completion' or 'shared'.
--   * Free tasbih sessions are never visible to circles.
--   * Aggregates for small circles are suppressed when they would reveal a
--     private member's activity.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- The client sends its local calendar date so the "day" boundary follows the
-- person, not UTC. It may differ from the UTC date by at most one day.
create or replace function public.assert_local_date(p_date date)
returns date
language plpgsql
immutable
as $$
begin
  if p_date is null then raise exception 'A local date is required'; end if;
  if abs(p_date - (timezone('utc', now()))::date) > 1 then
    raise exception 'Local date is out of range';
  end if;
  return p_date;
end;
$$;

create or replace function public.is_circle_member(p_circle_id uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.dhikr_circle_members
    where circle_id = p_circle_id and user_id = p_user
  );
$$;

-- ---------------------------------------------------------------------------
-- Content governance: the server knows which dhikr ids are published.
-- Rich text lives in the client bundle (src/content); this table is the
-- authority on which ids may be recorded.
-- ---------------------------------------------------------------------------
create table if not exists public.dhikr_content_items (
  id text primary key check (id ~ '^[a-z0-9_]{2,64}$'),
  review_status text not null default 'approved'
    check (review_status in ('draft','review','approved','published','archived')),
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.dhikr_content_items (id, review_status) values
  ('subhanallah','approved'), ('alhamdulillah','approved'), ('allahu_akbar','approved'),
  ('la_ilaha_illallah','approved'), ('astaghfirullah','approved'), ('salawat','approved'),
  ('hawqala','approved'), ('quran_reading','approved'),
  ('subhanallahi_wa_bihamdihi','approved'), ('subhanallahi_wa_bihamdihi_azim','approved'),
  ('tahlil_full','approved'), ('sayyid_al_istighfar','approved'), ('ayat_al_kursi','approved'),
  ('hasbunallah','approved'), ('dua_of_yunus','approved'), ('dua_of_distress','approved'),
  ('istirja','approved'), ('radeetu','review'), ('bismillah_protection','approved'),
  ('audhu_bikalimat','approved'), ('sleep_bismika','approved'), ('waking_alhamdulillah','approved'),
  ('leaving_home','approved'), ('bismillah_eating','approved'), ('after_eating','review'),
  ('after_salah_salam','approved'), ('after_salah_help','approved'), ('travel','approved'),
  ('family_dua','approved'), ('sleep_protection','approved'), ('rabbana_atina','approved'),
  ('istighfar_extended','approved'), ('dua_anxiety','approved'), ('salawat_ibrahimiyya','approved'),
  ('afw_afiyah','approved'), ('asbahna','approved'), ('ikhlas','approved'), ('ya_hayyu_ya_qayyum','review')
on conflict (id) do update set review_status = excluded.review_status, updated_at = now();

alter table public.dhikr_content_items enable row level security;
drop policy if exists "content items readable" on public.dhikr_content_items;
create policy "content items readable" on public.dhikr_content_items for select using (true);

-- ---------------------------------------------------------------------------
-- Journeys
-- ---------------------------------------------------------------------------
create table if not exists public.dhikr_journey_days (
  journey_id text not null check (journey_id ~ '^[a-z0-9-]{2,64}$'),
  day_number integer not null check (day_number between 1 and 90),
  dhikr_id text not null references public.dhikr_content_items(id),
  target integer not null check (target between 1 and 1000),
  primary key (journey_id, day_number)
);

insert into public.dhikr_journey_days (journey_id, day_number, dhikr_id, target) values
  ('stronger-heart-30', 1, 'subhanallah', 33),
  ('stronger-heart-30', 2, 'alhamdulillah', 33),
  ('stronger-heart-30', 3, 'allahu_akbar', 33),
  ('stronger-heart-30', 4, 'la_ilaha_illallah', 33),
  ('stronger-heart-30', 5, 'astaghfirullah', 33),
  ('stronger-heart-30', 6, 'salawat', 33),
  ('stronger-heart-30', 7, 'hawqala', 33),
  ('stronger-heart-30', 8, 'subhanallahi_wa_bihamdihi', 100),
  ('stronger-heart-30', 9, 'subhanallahi_wa_bihamdihi_azim', 33),
  ('stronger-heart-30', 10, 'tahlil_full', 33),
  ('stronger-heart-30', 11, 'sayyid_al_istighfar', 3),
  ('stronger-heart-30', 12, 'ayat_al_kursi', 3),
  ('stronger-heart-30', 13, 'hasbunallah', 33),
  ('stronger-heart-30', 14, 'salawat_ibrahimiyya', 10),
  ('stronger-heart-30', 15, 'waking_alhamdulillah', 3),
  ('stronger-heart-30', 16, 'leaving_home', 7),
  ('stronger-heart-30', 17, 'bismillah_eating', 7),
  ('stronger-heart-30', 18, 'dua_anxiety', 3),
  ('stronger-heart-30', 19, 'dua_of_yunus', 33),
  ('stronger-heart-30', 20, 'istirja', 7),
  ('stronger-heart-30', 21, 'sleep_bismika', 3),
  ('stronger-heart-30', 22, 'after_salah_salam', 3),
  ('stronger-heart-30', 23, 'after_salah_help', 3),
  ('stronger-heart-30', 24, 'asbahna', 3),
  ('stronger-heart-30', 25, 'bismillah_protection', 3),
  ('stronger-heart-30', 26, 'tahlil_full', 100),
  ('stronger-heart-30', 27, 'rabbana_atina', 33),
  ('stronger-heart-30', 28, 'family_dua', 10),
  ('stronger-heart-30', 29, 'istighfar_extended', 33),
  ('stronger-heart-30', 30, 'subhanallahi_wa_bihamdihi', 100)
on conflict (journey_id, day_number) do update
  set dhikr_id = excluded.dhikr_id, target = excluded.target;

alter table public.dhikr_journey_days enable row level security;
drop policy if exists "journey days readable" on public.dhikr_journey_days;
create policy "journey days readable" on public.dhikr_journey_days for select using (true);

create table if not exists public.dhikr_user_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id text not null check (journey_id ~ '^[a-z0-9-]{2,64}$'),
  started_on date not null,
  status text not null default 'active' check (status in ('active','completed','paused')),
  completed_on date,
  created_at timestamptz not null default now()
);
create unique index if not exists dhikr_user_journeys_one_active
  on public.dhikr_user_journeys(user_id) where status = 'active';
create index if not exists dhikr_user_journeys_user_idx
  on public.dhikr_user_journeys(user_id, created_at desc);

create table if not exists public.dhikr_journey_completions (
  user_journey_id uuid not null references public.dhikr_user_journeys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 90),
  dhikr_id text not null,
  completion_date date not null,
  count integer not null default 0 check (count between 0 and 10000),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  created_at timestamptz not null default now(),
  primary key (user_journey_id, day_number),
  unique (user_journey_id, completion_date)
);
create index if not exists dhikr_journey_completions_user_idx
  on public.dhikr_journey_completions(user_id, completion_date desc);

alter table public.dhikr_user_journeys enable row level security;
alter table public.dhikr_journey_completions enable row level security;
drop policy if exists "journeys owned by user" on public.dhikr_user_journeys;
create policy "journeys owned by user" on public.dhikr_user_journeys
  for select using ((select auth.uid()) = user_id);
drop policy if exists "journey completions owned by user" on public.dhikr_journey_completions;
create policy "journey completions owned by user" on public.dhikr_journey_completions
  for select using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Sessions (journey, daily rhythm and free tasbih). Private. Never read by circles.
-- ---------------------------------------------------------------------------
create table if not exists public.dhikr_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dhikr_id text not null check (char_length(dhikr_id) between 1 and 120),
  kind text not null check (kind in ('journey','daily','free')),
  target integer not null default 0 check (target between 0 and 10000),
  count integer not null default 0 check (count between 0 and 10000),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  local_date date not null,
  include_in_stats boolean not null default true,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists dhikr_sessions_user_date_idx
  on public.dhikr_sessions(user_id, local_date desc);
alter table public.dhikr_sessions enable row level security;
drop policy if exists "sessions owned by user" on public.dhikr_sessions;
create policy "sessions owned by user" on public.dhikr_sessions
  for select using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Knowledge progress. Private.
-- ---------------------------------------------------------------------------
create table if not exists public.dhikr_knowledge_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null check (item_id ~ '^(dhikr|word|concept|verse|hadith|name):[A-Za-z0-9''_.-]{1,80}$'),
  stage text not null default 'encountered'
    check (stage in ('encountered','learning','understood','reviewed','mastered')),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  streak integer not null default 0 check (streak >= 0),
  first_seen_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.dhikr_knowledge_progress enable row level security;
drop policy if exists "knowledge owned by user" on public.dhikr_knowledge_progress;
create policy "knowledge owned by user" on public.dhikr_knowledge_progress
  for select using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Circles: new columns (defaults keep existing rows valid)
-- ---------------------------------------------------------------------------
alter table public.dhikr_circles add column if not exists purpose text
  check (purpose is null or char_length(purpose) <= 140);
alter table public.dhikr_circles add column if not exists journey_id text not null default 'stronger-heart-30'
  check (journey_id ~ '^[a-z0-9-]{2,64}$');
alter table public.dhikr_circles add column if not exists invite_rotated_at timestamptz not null default now();
alter table public.dhikr_circles drop constraint if exists dhikr_circles_invite_code_check;
alter table public.dhikr_circles add constraint dhikr_circles_invite_code_check
  check (invite_code ~ '^([A-Z0-9]{8}|[A-F0-9]{32})$');

alter table public.dhikr_circle_members add column if not exists role text not null default 'member'
  check (role in ('owner','admin','member'));
alter table public.dhikr_circle_members add column if not exists activity_visibility text not null default 'completion'
  check (activity_visibility in ('private','completion','shared'));
update public.dhikr_circle_members m set role = 'owner'
  from public.dhikr_circles c
  where c.id = m.circle_id and c.owner_id = m.user_id and m.role <> 'owner';

-- Members may read the membership list of circles they belong to (names come
-- through RPC so visibility rules apply; the raw table exposes only ids/roles).
drop policy if exists "members readable by members" on public.dhikr_circle_members;
create policy "members readable by members" on public.dhikr_circle_members
  for select using (public.is_circle_member(circle_id, (select auth.uid())));

create table if not exists public.dhikr_circle_encouragements (
  id bigint generated always as identity primary key,
  circle_id uuid not null references public.dhikr_circles(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('dua','encourage','alhamdulillah','accept')),
  local_date date not null,
  created_at timestamptz not null default now()
);
create unique index if not exists dhikr_circle_encouragements_once_idx
  on public.dhikr_circle_encouragements(circle_id, from_user, coalesce(to_user, '00000000-0000-0000-0000-000000000000'::uuid), kind, local_date);
create index if not exists dhikr_circle_encouragements_circle_idx
  on public.dhikr_circle_encouragements(circle_id, local_date desc);
alter table public.dhikr_circle_encouragements enable row level security;
drop policy if exists "encouragements readable by members" on public.dhikr_circle_encouragements;
create policy "encouragements readable by members" on public.dhikr_circle_encouragements
  for select using (public.is_circle_member(circle_id, (select auth.uid())));

create table if not exists public.dhikr_circle_events (
  id bigint generated always as identity primary key,
  circle_id uuid not null references public.dhikr_circles(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('joined','left','completed_day','circle_completed','encouraged','learned','journey_completed','journey_started')),
  payload jsonb not null default '{}'::jsonb check (octet_length(payload::text) <= 1024),
  local_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists dhikr_circle_events_circle_idx
  on public.dhikr_circle_events(circle_id, created_at desc);
alter table public.dhikr_circle_events enable row level security;
drop policy if exists "events readable by members" on public.dhikr_circle_events;
create policy "events readable by members" on public.dhikr_circle_events
  for select using (public.is_circle_member(circle_id, (select auth.uid())));

create table if not exists public.dhikr_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  circle_id uuid references public.dhikr_circles(id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);
alter table public.dhikr_reports enable row level security;
drop policy if exists "reports inaccessible directly" on public.dhikr_reports;
create policy "reports inaccessible directly" on public.dhikr_reports for all using (false) with check (false);

-- Circle intentions: admins may set them too.
drop policy if exists "circle intentions insertable by owner" on public.dhikr_circle_intentions;
drop policy if exists "circle intentions updateable by owner" on public.dhikr_circle_intentions;

-- ---------------------------------------------------------------------------
-- Internal: emit circle events for a user's completion, honouring visibility
-- ---------------------------------------------------------------------------
create or replace function public.emit_completion_events(p_user uuid, p_local_date date, p_day integer)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_total integer;
  v_done integer;
begin
  for r in
    select m.circle_id, m.activity_visibility
    from public.dhikr_circle_members m
    where m.user_id = p_user
  loop
    if r.activity_visibility <> 'private' then
      insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
      select r.circle_id, p_user, 'completed_day', jsonb_build_object('day', p_day), p_local_date
      where not exists (
        select 1 from public.dhikr_circle_events e
        where e.circle_id = r.circle_id and e.actor_id = p_user
          and e.kind = 'completed_day' and e.local_date = p_local_date
      );
    end if;

    select count(*) into v_total from public.dhikr_circle_members where circle_id = r.circle_id;
    select count(distinct m2.user_id) into v_done
      from public.dhikr_circle_members m2
      join public.dhikr_completions c on c.user_id = m2.user_id and c.completion_date = p_local_date
      where m2.circle_id = r.circle_id;
    if v_total >= 2 and v_done = v_total then
      insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
      select r.circle_id, null, 'circle_completed', jsonb_build_object('members', v_total), p_local_date
      where not exists (
        select 1 from public.dhikr_circle_events e
        where e.circle_id = r.circle_id and e.kind = 'circle_completed' and e.local_date = p_local_date
      );
    end if;
  end loop;
end;
$$;
revoke all on function public.emit_completion_events(uuid, date, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Home payload: everything the app needs on load, in one round-trip
-- ---------------------------------------------------------------------------
create or replace function public.my_dhikr_home(p_local_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_journey public.dhikr_user_journeys;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_journey from public.dhikr_user_journeys
  where user_id = v_user and status = 'active' limit 1;
  if v_journey.id is null then
    select * into v_journey from public.dhikr_user_journeys
    where user_id = v_user order by created_at desc limit 1;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'displayName', (select display_name from public.dhikr_profiles where user_id = v_user)
    ),
    'preferences', coalesce((select preferences from public.dhikr_preferences where user_id = v_user), '{}'::jsonb),
    'onboardingCompleted', coalesce((select onboarding_completed from public.dhikr_preferences where user_id = v_user), false),
    'journey', case when v_journey.id is null then null else jsonb_build_object(
      'id', v_journey.id,
      'journeyId', v_journey.journey_id,
      'startedOn', v_journey.started_on::text,
      'status', v_journey.status,
      'completedOn', v_journey.completed_on::text,
      'completedDays', coalesce((
        select jsonb_agg(jsonb_build_object('day', jc.day_number, 'date', jc.completion_date::text, 'dhikrId', jc.dhikr_id) order by jc.day_number)
        from public.dhikr_journey_completions jc where jc.user_journey_id = v_journey.id
      ), '[]'::jsonb)
    ) end,
    'journeyHistory', coalesce((
      select jsonb_agg(jsonb_build_object('journeyId', j.journey_id, 'startedOn', j.started_on::text, 'status', j.status, 'completedOn', j.completed_on::text,
        'daysCompleted', (select count(*) from public.dhikr_journey_completions jc where jc.user_journey_id = j.id)) order by j.created_at desc)
      from public.dhikr_user_journeys j where j.user_id = v_user
    ), '[]'::jsonb),
    'completions', coalesce((
      select jsonb_agg(jsonb_build_object('date', c.completion_date::text, 'dhikrId', c.dhikr_id) order by c.completion_date)
      from public.dhikr_completions c where c.user_id = v_user and c.completion_date >= v_date - 120
    ), '[]'::jsonb),
    'totalCompletionDays', (select count(distinct completion_date) from public.dhikr_completions where user_id = v_user),
    'firstCompletionDate', (select min(completion_date)::text from public.dhikr_completions where user_id = v_user),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'dhikrId', s.dhikr_id, 'kind', s.kind, 'target', s.target, 'count', s.count,
        'durationSeconds', s.duration_seconds, 'date', s.local_date::text, 'includeInStats', s.include_in_stats, 'note', s.note, 'createdAt', s.created_at) order by s.created_at desc)
      from public.dhikr_sessions s where s.user_id = v_user and s.local_date >= v_date - 120
    ), '[]'::jsonb),
    'knowledge', coalesce((
      select jsonb_agg(jsonb_build_object('itemId', k.item_id, 'stage', k.stage, 'correct', k.correct_count, 'incorrect', k.incorrect_count,
        'streak', k.streak, 'firstSeenAt', k.first_seen_at, 'lastReviewedAt', k.last_reviewed_at, 'nextReviewAt', k.next_review_at))
      from public.dhikr_knowledge_progress k where k.user_id = v_user
    ), '[]'::jsonb),
    'reflections', coalesce((
      select jsonb_agg(jsonb_build_object('dhikrId', r.dhikr_id, 'date', r.completion_date::text, 'mood', r.mood, 'note', r.note, 'createdAt', r.created_at) order by r.created_at desc)
      from public.dhikr_reflections r where r.user_id = v_user
    ), '[]'::jsonb),
    'savedItems', coalesce((
      select jsonb_agg(jsonb_build_object('itemType', s.item_type, 'itemId', s.item_id))
      from public.dhikr_saved_items s where s.user_id = v_user
    ), '[]'::jsonb),
    'circles', public.my_dhikr_circles(v_date)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Journeys: start, complete a day, import guest progress
-- ---------------------------------------------------------------------------
create or replace function public.start_journey(p_journey_id text, p_local_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_existing uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.dhikr_journey_days where journey_id = p_journey_id) then
    raise exception 'Unknown journey';
  end if;
  select id into v_existing from public.dhikr_user_journeys where user_id = v_user and status = 'active';
  if v_existing is null then
    insert into public.dhikr_user_journeys(user_id, journey_id, started_on)
    values (v_user, p_journey_id, v_date);
    insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
    select m.circle_id, v_user, 'journey_started', jsonb_build_object('journeyId', p_journey_id), v_date
    from public.dhikr_circle_members m where m.user_id = v_user and m.activity_visibility = 'shared';
  end if;
  return public.my_dhikr_home(v_date);
end;
$$;

create or replace function public.complete_journey_day(
  p_day integer,
  p_local_date date,
  p_count integer default 0,
  p_duration_seconds integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_journey public.dhikr_user_journeys;
  v_next integer;
  v_day public.dhikr_journey_days;
  v_length integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 1));

  select * into v_journey from public.dhikr_user_journeys
  where user_id = v_user and status = 'active' limit 1;
  if v_journey.id is null then raise exception 'No active journey'; end if;

  select coalesce(max(day_number), 0) + 1 into v_next
  from public.dhikr_journey_completions where user_journey_id = v_journey.id;

  -- Idempotent: a repeated submit for an already-completed day is not an error.
  if p_day < v_next then return public.my_dhikr_home(v_date); end if;
  if p_day <> v_next then raise exception 'Day % is not the next day of your journey', p_day; end if;
  if exists (select 1 from public.dhikr_journey_completions where user_journey_id = v_journey.id and completion_date = v_date) then
    raise exception 'Today''s day is already complete. Day % opens tomorrow.', p_day;
  end if;

  select * into v_day from public.dhikr_journey_days
  where journey_id = v_journey.journey_id and day_number = p_day;
  if v_day.dhikr_id is null then raise exception 'Unknown journey day'; end if;

  insert into public.dhikr_completions(user_id, completion_date, dhikr_id, xp)
  values (v_user, v_date, v_day.dhikr_id, greatest(1, v_day.target))
  on conflict do nothing;

  insert into public.dhikr_journey_completions(user_journey_id, user_id, day_number, dhikr_id, completion_date, count, duration_seconds)
  values (v_journey.id, v_user, p_day, v_day.dhikr_id, v_date, least(greatest(coalesce(p_count, 0), 0), 10000), least(greatest(coalesce(p_duration_seconds, 0), 0), 86400));

  insert into public.dhikr_sessions(user_id, dhikr_id, kind, target, count, duration_seconds, local_date)
  values (v_user, v_day.dhikr_id, 'journey', v_day.target, least(greatest(coalesce(p_count, 0), 0), 10000), least(greatest(coalesce(p_duration_seconds, 0), 0), 86400), v_date);

  select max(day_number) into v_length from public.dhikr_journey_days where journey_id = v_journey.journey_id;
  if p_day >= v_length then
    update public.dhikr_user_journeys set status = 'completed', completed_on = v_date where id = v_journey.id;
    insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
    select m.circle_id, v_user, 'journey_completed', jsonb_build_object('journeyId', v_journey.journey_id), v_date
    from public.dhikr_circle_members m where m.user_id = v_user and m.activity_visibility <> 'private';
  end if;

  perform public.emit_completion_events(v_user, v_date, p_day);
  return public.my_dhikr_home(v_date);
end;
$$;

-- Daily rhythm after the journey (or alongside it): records "remembered today"
-- for any published dhikr. Counts toward circles.
drop function if exists public.complete_daily_dhikr(text);
create or replace function public.complete_daily_dhikr(
  p_dhikr_id text,
  p_local_date date,
  p_count integer default 0,
  p_duration_seconds integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.dhikr_content_items where id = p_dhikr_id and published) then
    raise exception 'This dhikr is not available';
  end if;
  insert into public.dhikr_completions(user_id, completion_date, dhikr_id, xp)
  values (v_user, v_date, p_dhikr_id, greatest(1, coalesce(p_count, 1)))
  on conflict do nothing;
  insert into public.dhikr_sessions(user_id, dhikr_id, kind, target, count, duration_seconds, local_date)
  values (v_user, p_dhikr_id, 'daily', least(greatest(coalesce(p_count, 0), 0), 10000), least(greatest(coalesce(p_count, 0), 0), 10000), least(greatest(coalesce(p_duration_seconds, 0), 0), 86400), v_date);
  perform public.emit_completion_events(v_user, v_date, 0);
  return public.my_dhikr_home(v_date);
end;
$$;

-- Free tasbih. Private. Never emits circle events.
create or replace function public.save_free_session(
  p_dhikr_id text,
  p_target integer,
  p_count integer,
  p_duration_seconds integer,
  p_local_date date,
  p_include_in_stats boolean default true,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_id uuid;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_dhikr_id is null or char_length(p_dhikr_id) not between 1 and 120 then raise exception 'Invalid dhikr'; end if;
  if v_note is not null and char_length(v_note) > 500 then raise exception 'Note is too long'; end if;
  insert into public.dhikr_sessions(user_id, dhikr_id, kind, target, count, duration_seconds, local_date, include_in_stats, note)
  values (v_user, p_dhikr_id, 'free', least(greatest(coalesce(p_target, 0), 0), 10000), least(greatest(coalesce(p_count, 0), 0), 10000),
          least(greatest(coalesce(p_duration_seconds, 0), 0), 86400), v_date, coalesce(p_include_in_stats, true), v_note)
  returning id into v_id;
  return v_id;
end;
$$;

-- Guest progress import, once, for accounts with no journey yet.
create or replace function public.import_journey_progress(p_journey_id text, p_days jsonb, p_local_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_journey_id uuid;
  v_row jsonb;
  v_expected integer := 1;
  v_day integer;
  v_day_date date;
  v_min date;
  v_length integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.dhikr_user_journeys where user_id = v_user) then
    return public.my_dhikr_home(v_date);
  end if;
  if p_days is null or jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) > 90 then
    raise exception 'Invalid import';
  end if;
  if not exists (select 1 from public.dhikr_journey_days where journey_id = p_journey_id) then
    raise exception 'Unknown journey';
  end if;
  select max(day_number) into v_length from public.dhikr_journey_days where journey_id = p_journey_id;

  select min((d->>'date')::date) into v_min from jsonb_array_elements(p_days) d;
  insert into public.dhikr_user_journeys(user_id, journey_id, started_on)
  values (v_user, p_journey_id, coalesce(v_min, v_date)) returning id into v_journey_id;

  for v_row in select * from jsonb_array_elements(p_days) loop
    v_day := (v_row->>'day')::integer;
    v_day_date := (v_row->>'date')::date;
    if v_day <> v_expected then raise exception 'Days must be sequential'; end if;
    if v_day_date > v_date + 1 or v_day_date < v_date - 365 then raise exception 'Invalid date'; end if;
    insert into public.dhikr_journey_completions(user_journey_id, user_id, day_number, dhikr_id, completion_date)
    select v_journey_id, v_user, v_day, jd.dhikr_id, v_day_date
    from public.dhikr_journey_days jd where jd.journey_id = p_journey_id and jd.day_number = v_day
    on conflict do nothing;
    insert into public.dhikr_completions(user_id, completion_date, dhikr_id, xp)
    select v_user, v_day_date, jd.dhikr_id, greatest(1, jd.target)
    from public.dhikr_journey_days jd where jd.journey_id = p_journey_id and jd.day_number = v_day
    on conflict do nothing;
    v_expected := v_expected + 1;
  end loop;

  if v_expected - 1 >= v_length then
    update public.dhikr_user_journeys set status = 'completed', completed_on = v_date where id = v_journey_id;
  end if;
  return public.my_dhikr_home(v_date);
end;
$$;

-- ---------------------------------------------------------------------------
-- Knowledge: the client computes the next state with the same pure function
-- used in guest mode; the server validates shape and ownership.
-- ---------------------------------------------------------------------------
create or replace function public.save_knowledge_progress(p_items jsonb, p_local_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_row jsonb;
  v_stage text;
  v_label text;
  v_prev text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then
    raise exception 'Invalid knowledge payload';
  end if;
  for v_row in select * from jsonb_array_elements(p_items) loop
    v_stage := coalesce(v_row->>'stage', 'encountered');
    if v_stage not in ('encountered','learning','understood','reviewed','mastered') then
      raise exception 'Invalid stage';
    end if;
    select stage into v_prev from public.dhikr_knowledge_progress where user_id = v_user and item_id = v_row->>'itemId';
    insert into public.dhikr_knowledge_progress(user_id, item_id, stage, correct_count, incorrect_count, streak, last_reviewed_at, next_review_at, updated_at)
    values (
      v_user, v_row->>'itemId', v_stage,
      least(greatest(coalesce((v_row->>'correct')::integer, 0), 0), 100000),
      least(greatest(coalesce((v_row->>'incorrect')::integer, 0), 0), 100000),
      least(greatest(coalesce((v_row->>'streak')::integer, 0), 0), 100000),
      nullif(v_row->>'lastReviewedAt', '')::timestamptz,
      nullif(v_row->>'nextReviewAt', '')::timestamptz,
      now()
    )
    on conflict (user_id, item_id) do update set
      stage = excluded.stage,
      correct_count = excluded.correct_count,
      incorrect_count = excluded.incorrect_count,
      streak = excluded.streak,
      last_reviewed_at = excluded.last_reviewed_at,
      next_review_at = excluded.next_review_at,
      updated_at = now();

    -- "Learned the meaning of X" is shared only with circles where the member chose 'shared'.
    v_label := left(coalesce(v_row->>'label', ''), 80);
    if v_stage in ('understood','mastered') and coalesce(v_prev, '') not in ('understood','reviewed','mastered') and v_label <> '' then
      insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
      select m.circle_id, v_user, 'learned', jsonb_build_object('label', v_label), v_date
      from public.dhikr_circle_members m where m.user_id = v_user and m.activity_visibility = 'shared';
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Preferences: widened validation
-- ---------------------------------------------------------------------------
create or replace function public.save_dhikr_preferences(p_preferences jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_w text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_preferences is null or jsonb_typeof(p_preferences) <> 'object' then
    raise exception 'Preferences must be a JSON object';
  end if;
  if octet_length(p_preferences::text) > 8192 then raise exception 'Preferences are too large'; end if;
  if p_preferences ? 'audio' and p_preferences->>'audio' not in ('arabic','english','both','off') then raise exception 'Invalid audio preference'; end if;
  if p_preferences ? 'duration' and (jsonb_typeof(p_preferences->'duration') <> 'number' or (p_preferences->>'duration')::int not between 1 and 30) then raise exception 'Invalid practice duration'; end if;
  if p_preferences ? 'goals' and (jsonb_typeof(p_preferences->'goals') <> 'array' or jsonb_array_length(p_preferences->'goals') > 6) then raise exception 'Invalid practice goals'; end if;
  if p_preferences ? 'routine' and p_preferences->>'routine' not in ('starting','occasionally','most-days','consistent') then raise exception 'Invalid routine'; end if;
  if p_preferences ? 'theme' and p_preferences->>'theme' not in ('system','light','dark') then raise exception 'Invalid theme'; end if;
  if p_preferences ? 'reminderWindows' then
    if jsonb_typeof(p_preferences->'reminderWindows') <> 'array' or jsonb_array_length(p_preferences->'reminderWindows') > 8 then raise exception 'Invalid reminder windows'; end if;
    for v_w in select jsonb_array_elements_text(p_preferences->'reminderWindows') loop
      if v_w not in ('morning','after-fajr','midday','after-maghrib','evening','before-sleep','custom') then raise exception 'Invalid reminder window'; end if;
    end loop;
  end if;
  if p_preferences ? 'customReminderTime' and p_preferences->>'customReminderTime' <> '' and p_preferences->>'customReminderTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid reminder time'; end if;
  if p_preferences ? 'reminder' and p_preferences->>'reminder' <> '' and p_preferences->>'reminder' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid reminder time'; end if;
  if p_preferences ? 'school' and p_preferences->>'school' not in ('', 'Hanafi', 'Maliki', 'Shafi''i', 'Hanbali', 'Other / prefer not to say') then raise exception 'Invalid school preference'; end if;
  if p_preferences ? 'onboardingCompleted' and jsonb_typeof(p_preferences->'onboardingCompleted') <> 'boolean' then raise exception 'onboardingCompleted must be a boolean'; end if;
  if p_preferences ? 'pathwayId' and p_preferences->>'pathwayId' !~ '^[a-z0-9-]{0,64}$' then raise exception 'Invalid pathway'; end if;

  insert into public.dhikr_preferences(user_id, onboarding_completed, preferences, updated_at)
  values (
    v_user,
    case when p_preferences ? 'onboardingCompleted' then (p_preferences->'onboardingCompleted')::boolean else true end,
    p_preferences - 'onboardingCompleted',
    now()
  )
  on conflict (user_id) do update
    set onboarding_completed = case when p_preferences ? 'onboardingCompleted' then (p_preferences->'onboardingCompleted')::boolean else dhikr_preferences.onboarding_completed end,
        preferences = excluded.preferences,
        updated_at = now();
end;
$$;

-- Reflections use the local date
drop function if exists public.save_dhikr_reflection(text, text, text);
create or replace function public.save_dhikr_reflection(p_dhikr_id text, p_mood text, p_note text, p_local_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_id text := trim(p_dhikr_id);
  v_mood text := lower(trim(p_mood));
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_id is null or char_length(v_id) not between 1 and 120 then raise exception 'Invalid dhikr id'; end if;
  if v_mood is null or v_mood not in ('peaceful','calm','grateful','grounded','hopeful','reflective','comforted','focused','tender','heavy','connected','uplifted','emotional','distracted') then
    raise exception 'Invalid reflection mood';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then raise exception 'Reflection note must be 1000 characters or fewer'; end if;
  if not exists (select 1 from public.dhikr_completions where user_id = v_user and completion_date = v_date and dhikr_id = v_id) then
    raise exception 'Complete this dhikr before reflecting';
  end if;
  insert into public.dhikr_reflections(user_id, completion_date, dhikr_id, mood, note)
  values (v_user, v_date, v_id, v_mood, v_note)
  on conflict (user_id, completion_date, dhikr_id) do update set mood = excluded.mood, note = excluded.note, updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Circles
-- ---------------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  bytes bytea := extensions.gen_random_bytes(8);
  i integer;
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;
revoke all on function public.generate_invite_code() from public, anon, authenticated;

drop function if exists public.create_dhikr_circle(text);
create or replace function public.create_dhikr_circle(p_name text, p_purpose text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_circle public.dhikr_circles;
  v_purpose text := nullif(trim(coalesce(p_purpose, '')), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 60 then raise exception 'Circle name must be between 2 and 60 characters'; end if;
  if v_purpose is not null and char_length(v_purpose) > 140 then raise exception 'Purpose must be 140 characters or fewer'; end if;
  if (select count(*) from public.dhikr_circles where owner_id = v_user) >= 20 then raise exception 'You already own the maximum number of circles'; end if;
  insert into public.dhikr_circles(name, purpose, invite_code, owner_id)
  values (trim(p_name), v_purpose, public.generate_invite_code(), v_user)
  returning * into v_circle;
  insert into public.dhikr_circle_members(circle_id, user_id, role)
  values (v_circle.id, v_user, 'owner');
  return jsonb_build_object('id', v_circle.id, 'name', v_circle.name, 'purpose', v_circle.purpose, 'inviteCode', v_circle.invite_code, 'ownerId', v_circle.owner_id);
end;
$$;

-- Invite preview: name, purpose and size only. Never members or activity.
create or replace function public.preview_circle_invite(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_circle public.dhikr_circles;
  v_code text := upper(regexp_replace(coalesce(p_invite_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if char_length(v_code) not in (8, 32) then return null; end if;
  select * into v_circle from public.dhikr_circles where invite_code = v_code;
  if v_circle.id is null then return null; end if;
  return jsonb_build_object(
    'name', v_circle.name,
    'purpose', v_circle.purpose,
    'journeyId', v_circle.journey_id,
    'memberCount', (select count(*) from public.dhikr_circle_members where circle_id = v_circle.id),
    'alreadyMember', coalesce(auth.uid() is not null and public.is_circle_member(v_circle.id, auth.uid()), false)
  );
end;
$$;

drop function if exists public.join_dhikr_circle(text);
create or replace function public.join_dhikr_circle(p_invite_code text, p_visibility text default 'completion')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_circle public.dhikr_circles;
  v_code text := upper(regexp_replace(coalesce(p_invite_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_vis text := coalesce(p_visibility, 'completion');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_vis not in ('private','completion','shared') then raise exception 'Invalid visibility'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  if (select count(*) from public.dhikr_circle_join_attempts where user_id = v_user and attempted_at > now() - interval '1 minute') >= 10 then
    raise exception 'Too many join attempts. Please wait a minute and try again';
  end if;
  insert into public.dhikr_circle_join_attempts(user_id) values (v_user);
  delete from public.dhikr_circle_join_attempts where user_id = v_user and attempted_at < now() - interval '1 day';
  select * into v_circle from public.dhikr_circles where invite_code = v_code;
  if v_circle.id is null then raise exception 'That invite is not valid. Ask for a fresh link.'; end if;
  if (select count(*) from public.dhikr_circle_members where circle_id = v_circle.id) >= 100 then raise exception 'This circle is full'; end if;
  insert into public.dhikr_circle_members(circle_id, user_id, role, activity_visibility)
  values (v_circle.id, v_user, 'member', v_vis)
  on conflict (circle_id, user_id) do nothing;
  if found then
    insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
    values (v_circle.id, v_user, 'joined', '{}'::jsonb, (timezone('utc', now()))::date);
  end if;
  return jsonb_build_object('id', v_circle.id, 'name', v_circle.name, 'purpose', v_circle.purpose, 'ownerId', v_circle.owner_id);
end;
$$;

create or replace function public.rotate_circle_invite(p_circle_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.dhikr_circle_members where circle_id = p_circle_id and user_id = v_user and role in ('owner','admin')) then
    raise exception 'Only the circle owner or an admin can change the invite';
  end if;
  v_code := public.generate_invite_code();
  update public.dhikr_circles set invite_code = v_code, invite_rotated_at = now() where id = p_circle_id;
  return v_code;
end;
$$;

create or replace function public.update_dhikr_circle(p_circle_id uuid, p_name text, p_purpose text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_purpose text := nullif(trim(coalesce(p_purpose, '')), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.dhikr_circle_members where circle_id = p_circle_id and user_id = v_user and role in ('owner','admin')) then
    raise exception 'Only the circle owner or an admin can edit the circle';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 60 then raise exception 'Circle name must be between 2 and 60 characters'; end if;
  if v_purpose is not null and char_length(v_purpose) > 140 then raise exception 'Purpose must be 140 characters or fewer'; end if;
  update public.dhikr_circles set name = trim(p_name), purpose = v_purpose where id = p_circle_id;
end;
$$;

create or replace function public.set_my_circle_visibility(p_circle_id uuid, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_visibility not in ('private','completion','shared') then raise exception 'Invalid visibility'; end if;
  update public.dhikr_circle_members set activity_visibility = p_visibility
  where circle_id = p_circle_id and user_id = v_user;
  if not found then raise exception 'You are not a member of this circle'; end if;
end;
$$;

create or replace function public.leave_dhikr_circle(p_circle_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.dhikr_circles where id = p_circle_id and owner_id = v_user) then
    raise exception 'Transfer ownership or delete the circle before leaving';
  end if;
  delete from public.dhikr_circle_members where circle_id = p_circle_id and user_id = v_user;
  if not found then raise exception 'You are not a member of this circle'; end if;
  delete from public.dhikr_circle_events where circle_id = p_circle_id and actor_id = v_user;
  delete from public.dhikr_circle_encouragements where circle_id = p_circle_id and (from_user = v_user or to_user = v_user);
  insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
  values (p_circle_id, null, 'left', '{}'::jsonb, (timezone('utc', now()))::date);
end;
$$;

create or replace function public.remove_circle_member(p_circle_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_my_role text;
  v_their_role text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select role into v_my_role from public.dhikr_circle_members where circle_id = p_circle_id and user_id = v_user;
  select role into v_their_role from public.dhikr_circle_members where circle_id = p_circle_id and user_id = p_user_id;
  if v_my_role not in ('owner','admin') then raise exception 'Only the circle owner or an admin can remove members'; end if;
  if v_their_role is null then raise exception 'That person is not a member'; end if;
  if v_their_role = 'owner' then raise exception 'The owner cannot be removed'; end if;
  if v_my_role = 'admin' and v_their_role = 'admin' then raise exception 'Admins cannot remove other admins'; end if;
  delete from public.dhikr_circle_members where circle_id = p_circle_id and user_id = p_user_id;
  delete from public.dhikr_circle_events where circle_id = p_circle_id and actor_id = p_user_id;
  delete from public.dhikr_circle_encouragements where circle_id = p_circle_id and (from_user = p_user_id or to_user = p_user_id);
end;
$$;

create or replace function public.set_circle_member_role(p_circle_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_role not in ('admin','member') then raise exception 'Invalid role'; end if;
  if not exists (select 1 from public.dhikr_circles where id = p_circle_id and owner_id = v_user) then
    raise exception 'Only the circle owner can change roles';
  end if;
  if p_user_id = v_user then raise exception 'The owner role cannot be changed here'; end if;
  update public.dhikr_circle_members set role = p_role where circle_id = p_circle_id and user_id = p_user_id and role <> 'owner';
  if not found then raise exception 'That person is not a member'; end if;
end;
$$;

create or replace function public.transfer_circle_ownership(p_circle_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.dhikr_circles where id = p_circle_id and owner_id = v_user) then
    raise exception 'Only the circle owner can transfer ownership';
  end if;
  if not public.is_circle_member(p_circle_id, p_user_id) then raise exception 'That person is not a member'; end if;
  update public.dhikr_circles set owner_id = p_user_id where id = p_circle_id;
  update public.dhikr_circle_members set role = 'admin' where circle_id = p_circle_id and user_id = v_user;
  update public.dhikr_circle_members set role = 'owner' where circle_id = p_circle_id and user_id = p_user_id;
end;
$$;

create or replace function public.delete_dhikr_circle(p_circle_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  delete from public.dhikr_circles where id = p_circle_id and owner_id = v_user;
  if not found then raise exception 'Only the circle owner can delete the circle'; end if;
end;
$$;

create or replace function public.send_encouragement(p_circle_id uuid, p_kind text, p_to_user uuid, p_local_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_kind not in ('dua','encourage','alhamdulillah','accept') then raise exception 'Invalid encouragement'; end if;
  if not public.is_circle_member(p_circle_id, v_user) then raise exception 'You are not a member of this circle'; end if;
  if p_to_user is not null and (p_to_user = v_user or not public.is_circle_member(p_circle_id, p_to_user)) then
    raise exception 'That person is not a member of this circle';
  end if;
  if (select count(*) from public.dhikr_circle_encouragements where circle_id = p_circle_id and from_user = v_user and local_date = v_date) >= 40 then
    raise exception 'That is plenty of encouragement for today';
  end if;
  insert into public.dhikr_circle_encouragements(circle_id, from_user, to_user, kind, local_date)
  values (p_circle_id, v_user, p_to_user, p_kind, v_date)
  on conflict do nothing;
  if found then
    insert into public.dhikr_circle_events(circle_id, actor_id, kind, payload, local_date)
    values (p_circle_id, v_user, 'encouraged', jsonb_build_object('kind', p_kind, 'toUser', p_to_user), v_date);
  end if;
end;
$$;

create or replace function public.report_circle(p_circle_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(v_reason) not between 3 and 500 then raise exception 'Please describe the problem in a few words'; end if;
  if not public.is_circle_member(p_circle_id, v_user) then raise exception 'You are not a member of this circle'; end if;
  insert into public.dhikr_reports(reporter_id, circle_id, reason) values (v_user, p_circle_id, v_reason);
end;
$$;

drop function if exists public.set_circle_intention(uuid, text);
create or replace function public.set_circle_intention(p_circle_id uuid, p_intention text, p_local_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_intention text := nullif(trim(coalesce(p_intention, '')), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.dhikr_circle_members where circle_id = p_circle_id and user_id = v_user and role in ('owner','admin')) then
    raise exception 'Only the circle owner or an admin can set its intention';
  end if;
  if v_intention is null or char_length(v_intention) > 280 then raise exception 'Intention must be between 1 and 280 characters'; end if;
  insert into public.dhikr_circle_intentions(circle_id, intention_date, intention, set_by)
  values (p_circle_id, v_date, v_intention, v_user)
  on conflict (circle_id, intention_date) do update set intention = excluded.intention, set_by = excluded.set_by, updated_at = now();
end;
$$;

-- Circle list with today's aggregate. Aggregates never expose a private member:
-- when any member is private and the circle is small (< 4), the count is null.
drop function if exists public.my_dhikr_circles();
create or replace function public.my_dhikr_circles(p_local_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'purpose', c.purpose,
      'journeyId', c.journey_id,
      'ownerId', c.owner_id,
      'role', m.role,
      'myVisibility', m.activity_visibility,
      'inviteCode', case when m.role in ('owner','admin') then c.invite_code else null end,
      'memberCount', s.total,
      'participatedToday', case when s.has_private and s.total < 4 then null else s.done end,
      'iCompletedToday', exists (select 1 from public.dhikr_completions x where x.user_id = v_user and x.completion_date = v_date)
    ) order by c.created_at desc)
    from public.dhikr_circles c
    join public.dhikr_circle_members m on m.circle_id = c.id and m.user_id = v_user
    cross join lateral (
      select count(*)::int as total,
             bool_or(m2.activity_visibility = 'private') as has_private,
             count(*) filter (where exists (select 1 from public.dhikr_completions x where x.user_id = m2.user_id and x.completion_date = v_date))::int as done
      from public.dhikr_circle_members m2 where m2.circle_id = c.id
    ) s
  ), '[]'::jsonb);
end;
$$;

drop function if exists public.circle_today(uuid);
create or replace function public.circle_home(p_circle_id uuid, p_local_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_user uuid := auth.uid();
  v_date date := public.assert_local_date(p_local_date);
  v_circle public.dhikr_circles;
  v_me public.dhikr_circle_members;
  v_total integer;
  v_done integer;
  v_has_private boolean;
  v_suppress boolean;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_me from public.dhikr_circle_members where circle_id = p_circle_id and user_id = v_user;
  if v_me.user_id is null then raise exception 'You are not a member of this circle'; end if;
  select * into v_circle from public.dhikr_circles where id = p_circle_id;

  select count(*), bool_or(activity_visibility = 'private') into v_total, v_has_private
  from public.dhikr_circle_members where circle_id = p_circle_id;
  select count(*) into v_done
  from public.dhikr_circle_members m2
  where m2.circle_id = p_circle_id
    and exists (select 1 from public.dhikr_completions x where x.user_id = m2.user_id and x.completion_date = v_date);
  v_suppress := coalesce(v_has_private, false) and v_total < 4;

  return jsonb_build_object(
    'id', v_circle.id,
    'name', v_circle.name,
    'purpose', v_circle.purpose,
    'journeyId', v_circle.journey_id,
    'ownerId', v_circle.owner_id,
    'createdAt', v_circle.created_at,
    'role', v_me.role,
    'myVisibility', v_me.activity_visibility,
    'inviteCode', case when v_me.role in ('owner','admin') then v_circle.invite_code else null end,
    'intention', (select i.intention from public.dhikr_circle_intentions i where i.circle_id = p_circle_id and i.intention_date = v_date),
    'memberCount', v_total,
    'participatedToday', case when v_suppress then null else v_done end,
    'togetherDays', (
      -- days in the last 30 where at least half the current members completed
      select count(*) from (
        select c.completion_date
        from public.dhikr_completions c
        join public.dhikr_circle_members m3 on m3.user_id = c.user_id and m3.circle_id = p_circle_id
        where c.completion_date between v_date - 29 and v_date
        group by c.completion_date
        having count(distinct c.user_id) * 2 >= v_total
      ) d
    ),
    'momentsTogether', (
      select count(*) from public.dhikr_completions c
      join public.dhikr_circle_members m4 on m4.user_id = c.user_id and m4.circle_id = p_circle_id
      where c.completion_date >= v_circle.created_at::date
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', case when m.activity_visibility = 'private' and m.user_id <> v_user then null else m.user_id end,
        'name', coalesce(p.display_name, 'Member'),
        'role', m.role,
        'isMe', m.user_id = v_user,
        'visibility', case when m.user_id = v_user or v_me.role in ('owner','admin') then m.activity_visibility else null end,
        'completedToday', case
          when m.activity_visibility = 'private' and m.user_id <> v_user then null
          else exists (select 1 from public.dhikr_completions x where x.user_id = m.user_id and x.completion_date = v_date)
        end,
        'journeyDay', case
          when m.activity_visibility = 'shared' or m.user_id = v_user then (
            select coalesce(max(jc.day_number), 0)
            from public.dhikr_user_journeys j
            left join public.dhikr_journey_completions jc on jc.user_journey_id = j.id
            where j.user_id = m.user_id and j.status = 'active'
          )
          else null
        end,
        'encouragedByMeToday', exists (
          select 1 from public.dhikr_circle_encouragements e
          where e.circle_id = p_circle_id and e.from_user = v_user and e.to_user = m.user_id and e.local_date = v_date
        )
      ) order by (m.role = 'owner') desc, p.display_name)
      from public.dhikr_circle_members m
      left join public.dhikr_profiles p on p.user_id = m.user_id
      where m.circle_id = p_circle_id
    ), '[]'::jsonb),
    'encouragementsForMe', coalesce((
      select jsonb_agg(jsonb_build_object('kind', e.kind, 'fromName', coalesce(p.display_name, 'A member'), 'date', e.local_date::text) order by e.created_at desc)
      from public.dhikr_circle_encouragements e
      left join public.dhikr_profiles p on p.user_id = e.from_user
      where e.circle_id = p_circle_id and (e.to_user = v_user or e.to_user is null) and e.from_user <> v_user and e.local_date >= v_date - 1
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'kind', e.kind,
        'actorName', case when e.actor_id is null then null else coalesce(p.display_name, 'A member') end,
        'actorIsMe', e.actor_id = v_user,
        'payload', e.payload,
        'date', e.local_date::text,
        'createdAt', e.created_at
      ) order by e.created_at desc)
      from (
        select * from public.dhikr_circle_events x
        where x.circle_id = p_circle_id
        order by x.created_at desc limit 10
      ) e
      left join public.dhikr_profiles p on p.user_id = e.actor_id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Account: export and delete
-- ---------------------------------------------------------------------------
create or replace function public.export_my_data()
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
    'exportedAt', now(),
    'profile', (select to_jsonb(p) - 'user_id' from public.dhikr_profiles p where p.user_id = v_user),
    'preferences', (select to_jsonb(p) - 'user_id' from public.dhikr_preferences p where p.user_id = v_user),
    'completions', coalesce((select jsonb_agg(to_jsonb(c) - 'user_id') from public.dhikr_completions c where c.user_id = v_user), '[]'::jsonb),
    'journeys', coalesce((select jsonb_agg(to_jsonb(j) - 'user_id') from public.dhikr_user_journeys j where j.user_id = v_user), '[]'::jsonb),
    'journeyCompletions', coalesce((select jsonb_agg(to_jsonb(j) - 'user_id') from public.dhikr_journey_completions j where j.user_id = v_user), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(to_jsonb(s) - 'user_id') from public.dhikr_sessions s where s.user_id = v_user), '[]'::jsonb),
    'knowledge', coalesce((select jsonb_agg(to_jsonb(k) - 'user_id') from public.dhikr_knowledge_progress k where k.user_id = v_user), '[]'::jsonb),
    'reflections', coalesce((select jsonb_agg(to_jsonb(r) - 'user_id') from public.dhikr_reflections r where r.user_id = v_user), '[]'::jsonb),
    'savedItems', coalesce((select jsonb_agg(to_jsonb(s) - 'user_id') from public.dhikr_saved_items s where s.user_id = v_user), '[]'::jsonb),
    'circles', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'role', m.role, 'joinedAt', m.joined_at)) from public.dhikr_circle_members m join public.dhikr_circles c on c.id = m.circle_id where m.user_id = v_user), '[]'::jsonb)
  );
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  -- Circles owned by this user are deleted (members lose the circle); all other
  -- rows cascade from auth.users.
  delete from public.dhikr_circles where owner_id = v_user;
  delete from auth.users where id = v_user;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on function public.assert_local_date(date) from public, anon;
revoke all on function public.is_circle_member(uuid, uuid) from public, anon;
revoke all on function public.my_dhikr_home(date) from public, anon;
revoke all on function public.start_journey(text, date) from public, anon;
revoke all on function public.complete_journey_day(integer, date, integer, integer) from public, anon;
revoke all on function public.complete_daily_dhikr(text, date, integer, integer) from public, anon;
revoke all on function public.save_free_session(text, integer, integer, integer, date, boolean, text) from public, anon;
revoke all on function public.import_journey_progress(text, jsonb, date) from public, anon;
revoke all on function public.save_knowledge_progress(jsonb, date) from public, anon;
revoke all on function public.save_dhikr_preferences(jsonb) from public, anon;
revoke all on function public.save_dhikr_reflection(text, text, text, date) from public, anon;
revoke all on function public.create_dhikr_circle(text, text) from public, anon;
revoke all on function public.preview_circle_invite(text) from public;
revoke all on function public.join_dhikr_circle(text, text) from public, anon;
revoke all on function public.rotate_circle_invite(uuid) from public, anon;
revoke all on function public.update_dhikr_circle(uuid, text, text) from public, anon;
revoke all on function public.set_my_circle_visibility(uuid, text) from public, anon;
revoke all on function public.leave_dhikr_circle(uuid) from public, anon;
revoke all on function public.remove_circle_member(uuid, uuid) from public, anon;
revoke all on function public.set_circle_member_role(uuid, uuid, text) from public, anon;
revoke all on function public.transfer_circle_ownership(uuid, uuid) from public, anon;
revoke all on function public.delete_dhikr_circle(uuid) from public, anon;
revoke all on function public.send_encouragement(uuid, text, uuid, date) from public, anon;
revoke all on function public.report_circle(uuid, text) from public, anon;
revoke all on function public.set_circle_intention(uuid, text, date) from public, anon;
revoke all on function public.my_dhikr_circles(date) from public, anon;
revoke all on function public.circle_home(uuid, date) from public, anon;
revoke all on function public.export_my_data() from public, anon;
revoke all on function public.delete_my_account() from public, anon;

grant execute on function public.assert_local_date(date) to authenticated;
grant execute on function public.is_circle_member(uuid, uuid) to authenticated;
grant execute on function public.my_dhikr_home(date) to authenticated;
grant execute on function public.start_journey(text, date) to authenticated;
grant execute on function public.complete_journey_day(integer, date, integer, integer) to authenticated;
grant execute on function public.complete_daily_dhikr(text, date, integer, integer) to authenticated;
grant execute on function public.save_free_session(text, integer, integer, integer, date, boolean, text) to authenticated;
grant execute on function public.import_journey_progress(text, jsonb, date) to authenticated;
grant execute on function public.save_knowledge_progress(jsonb, date) to authenticated;
grant execute on function public.save_dhikr_preferences(jsonb) to authenticated;
grant execute on function public.save_dhikr_reflection(text, text, text, date) to authenticated;
grant execute on function public.create_dhikr_circle(text, text) to authenticated;
grant execute on function public.preview_circle_invite(text) to anon, authenticated;
grant execute on function public.join_dhikr_circle(text, text) to authenticated;
grant execute on function public.rotate_circle_invite(uuid) to authenticated;
grant execute on function public.update_dhikr_circle(uuid, text, text) to authenticated;
grant execute on function public.set_my_circle_visibility(uuid, text) to authenticated;
grant execute on function public.leave_dhikr_circle(uuid) to authenticated;
grant execute on function public.remove_circle_member(uuid, uuid) to authenticated;
grant execute on function public.set_circle_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.transfer_circle_ownership(uuid, uuid) to authenticated;
grant execute on function public.delete_dhikr_circle(uuid) to authenticated;
grant execute on function public.send_encouragement(uuid, text, uuid, date) to authenticated;
grant execute on function public.report_circle(uuid, text) to authenticated;
grant execute on function public.set_circle_intention(uuid, text, date) to authenticated;
grant execute on function public.my_dhikr_circles(date) to authenticated;
grant execute on function public.circle_home(uuid, date) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
