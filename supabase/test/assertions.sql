\set ON_ERROR_STOP on
-- After the migration, tables created by the baseline get default grants; the
-- migration's tables need the same grants the Supabase platform applies.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

insert into auth.users(id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test'),
  ('22222222-2222-2222-2222-222222222222', 'b@test'),
  ('33333333-3333-3333-3333-333333333333', 'c@test'),
  ('44444444-4444-4444-4444-444444444444', 'd@test');
insert into public.dhikr_profiles(user_id, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'Amina'),
  ('22222222-2222-2222-2222-222222222222', 'Bilal'),
  ('33333333-3333-3333-3333-333333333333', 'Cara'),
  ('44444444-4444-4444-4444-444444444444', 'Dawud');

set role authenticated;
\set A '''11111111-1111-1111-1111-111111111111'''
\set B '''22222222-2222-2222-2222-222222222222'''
\set C '''33333333-3333-3333-3333-333333333333'''
\set D '''44444444-4444-4444-4444-444444444444'''
\set today 'current_date'

-- ---------------------------------------------------------------- journeys
select t_as(:A);
select t_assert((my_dhikr_home(:today)->'journey') is null or jsonb_typeof(my_dhikr_home(:today)->'journey') = 'null', 'no journey before start');
select start_journey('stronger-heart-30', :today);
select t_assert(my_dhikr_home(:today)->'journey'->>'status' = 'active', 'journey active after start');
select t_raises($$select start_journey('nope', current_date)$$, 'unknown journey rejected');
select t_raises($$select complete_journey_day(2, current_date, 33, 60)$$, 'cannot skip to day 2');
select complete_journey_day(1, :today, 33, 60);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'journey'->'completedDays') = 1, 'day 1 recorded');
-- idempotent re-submit of day 1 is not an error
select complete_journey_day(1, :today, 33, 60);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'journey'->'completedDays') = 1, 'day 1 not duplicated');
select t_raises($$select complete_journey_day(2, current_date, 33, 60)$$, 'one journey day per calendar date');
select complete_journey_day(2, :today + 1, 33, 60);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'journey'->'completedDays') = 2, 'day 2 recorded tomorrow');
select t_raises($$select complete_journey_day(3, current_date + 5, 33, 60)$$, 'local date far from utc rejected');
select t_assert((my_dhikr_home(:today)->>'totalCompletionDays')::int = 2, 'completion days counted');
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'sessions') = 2, 'journey sessions recorded');

-- free sessions are private and do not count as participation
select save_free_session('subhanallah', 100, 100, 200, :today, true, 'quiet');
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'sessions') = 3, 'free session saved');

-- ---------------------------------------------------------------- RLS: B cannot read A's rows
select t_as(:B);
select t_assert((select count(*) from public.dhikr_sessions) = 0, 'B sees no sessions of A');
select t_assert((select count(*) from public.dhikr_completions) = 0, 'B sees no completions of A');
select t_assert((select count(*) from public.dhikr_journey_completions) = 0, 'B sees no journey completions of A');
select t_assert((select count(*) from public.dhikr_knowledge_progress) = 0, 'B sees no knowledge of A');
select t_assert((select count(*) from public.dhikr_reflections) = 0, 'B sees no reflections of A');
select t_raises($$insert into public.dhikr_sessions(user_id, dhikr_id, kind, local_date) values ('11111111-1111-1111-1111-111111111111','subhanallah','free',current_date)$$, 'B cannot insert sessions for A');
select t_raises($$insert into public.dhikr_completions(user_id, completion_date, dhikr_id, xp) values ('22222222-2222-2222-2222-222222222222', current_date, 'subhanallah', 1)$$, 'direct completion insert blocked');

-- ---------------------------------------------------------------- knowledge
select t_as(:A);
select save_knowledge_progress('[{"itemId":"word:subhana","stage":"understood","correct":2,"incorrect":0,"streak":2,"label":"subhana"}]'::jsonb, :today);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'knowledge') = 1, 'knowledge saved');
select t_raises($$select save_knowledge_progress('[{"itemId":"word:x","stage":"guru"}]'::jsonb, current_date)$$, 'invalid stage rejected');
select t_raises($$select save_knowledge_progress('[{"itemId":"evil:x","stage":"learning"}]'::jsonb, current_date)$$, 'invalid item id rejected');

-- ---------------------------------------------------------------- preferences & reflections
select save_dhikr_preferences('{"duration":3,"routine":"starting","reminderWindows":["morning","before-sleep"],"theme":"system","onboardingCompleted":true}'::jsonb);
select t_assert((my_dhikr_home(:today)->>'onboardingCompleted')::boolean, 'onboarding flag saved');
select t_raises($$select save_dhikr_preferences('{"reminderWindows":["midnight-rave"]}'::jsonb)$$, 'invalid reminder window rejected');
select save_dhikr_reflection('subhanallah', 'grateful', 'a note', :today);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'reflections') = 1, 'reflection saved');
select t_raises($$select save_dhikr_reflection('ayat_al_kursi', 'grateful', 'x', current_date)$$, 'reflection requires completion');

-- ---------------------------------------------------------------- circles
select t_as(:A);
select create_dhikr_circle('Qureshi Family', 'Remember Allah together every day.')->>'id' as circle_id \gset
select set_config('test.circle', :'circle_id', false);
select t_assert(jsonb_array_length(my_dhikr_circles(:today)) = 1, 'A sees her circle');
select (my_dhikr_circles(:today)->0->>'inviteCode') as code \gset
select t_assert(length(:'code') = 8, 'short invite code generated');
select t_assert(preview_circle_invite(:'code')->>'name' = 'Qureshi Family', 'invite preview shows name');
select t_assert((preview_circle_invite(:'code')->>'memberCount')::int = 1, 'invite preview shows size only');
select t_assert(preview_circle_invite('ZZZZZZZZ') is null, 'bad invite previews null');

-- B joins with completion visibility, C joins private, D not a member
select t_as(:B); select join_dhikr_circle(:'code', 'completion');
select t_as(:C); select join_dhikr_circle(:'code', 'private');
select t_as(:D);
select t_raises($$select circle_home(current_setting('test.circle')::uuid, current_date)$$, 'non-member cannot open circle');
select t_assert(jsonb_array_length(my_dhikr_circles(:today)) = 0, 'D has no circles');
select t_assert((select count(*) from public.dhikr_circle_members) = 0, 'D cannot read membership rows');
select t_assert((select count(*) from public.dhikr_circle_events) = 0, 'D cannot read events');
select t_raises($$select send_encouragement(current_setting('test.circle')::uuid, 'dua', null, current_date)$$, 'non-member cannot encourage');
select t_raises($$select join_dhikr_circle('NOPE1234', 'completion')$$, 'bad code rejected');

-- membership visible to members; private member hidden appropriately
select t_as(:B);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert((:'home'::jsonb->>'memberCount')::int = 3, 'three members');
select t_assert((:'home'::jsonb->>'participatedToday') is null, 'small circle with a private member suppresses the aggregate');
select t_assert((select bool_and(m->>'completedToday' is null) from jsonb_array_elements(:'home'::jsonb->'members') m where m->>'name' = 'Cara'), 'private member completion hidden from B');
select t_assert((select bool_and(m->>'userId' is null) from jsonb_array_elements(:'home'::jsonb->'members') m where m->>'name' = 'Cara'), 'private member id hidden from B');
select t_assert((select bool_and(m->>'completedToday' = 'true') from jsonb_array_elements(:'home'::jsonb->'members') m where m->>'name' = 'Amina'), 'A visible as completed today');
select t_assert(:'home'::jsonb->>'inviteCode' is null, 'plain member cannot see invite code');
select t_assert(:'home'::jsonb->>'role' = 'member', 'B is a member');

-- C (private) still sees her own status
select t_as(:C);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert((select bool_and(m->>'completedToday' = 'false') from jsonb_array_elements(:'home'::jsonb->'members') m where m->>'name' = 'Cara'), 'private member sees own status');

-- D joins so the circle reaches 4 members: aggregate is shown again
select t_as(:D); select join_dhikr_circle(:'code', 'completion');
select t_as(:B);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert((:'home'::jsonb->>'participatedToday')::int = 1, 'aggregate shown for 4+ members');

-- encouragement rules
select t_as(:B);
select send_encouragement(:'circle_id'::uuid, 'dua', :A::uuid, :today);
select send_encouragement(:'circle_id'::uuid, 'dua', :A::uuid, :today); -- duplicate silently ignored
select t_assert((select count(*) from public.dhikr_circle_encouragements) = 1, 'duplicate encouragement ignored');
select t_raises($$select send_encouragement(current_setting('test.circle')::uuid, 'hug', null, current_date)$$, 'unknown kind rejected');
select t_raises($$select send_encouragement(current_setting('test.circle')::uuid, 'dua', '22222222-2222-2222-2222-222222222222', current_date)$$, 'cannot encourage yourself');
select t_as(:A);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert(jsonb_array_length(:'home'::jsonb->'encouragementsForMe') = 1, 'A received encouragement');
select t_assert(:'home'::jsonb->>'inviteCode' = :'code', 'owner sees invite code');

-- events: B's completion emitted (visibility completion); C's is not
select t_as(:B);
select complete_daily_dhikr('alhamdulillah', :today, 33, 60);
select t_as(:A);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert(exists (select 1 from jsonb_array_elements(:'home'::jsonb->'events') e where e->>'kind' = 'completed_day' and e->>'actorName' = 'Bilal'), 'completion event visible');
select t_assert((select bool_and(m->>'completedToday' = 'true') from jsonb_array_elements(:'home'::jsonb->'members') m where m->>'name' = 'Bilal'), 'B shown as completed');
select t_as(:C);
select complete_daily_dhikr('subhanallah', :today, 33, 60);
select t_as(:A);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert(not exists (select 1 from jsonb_array_elements(:'home'::jsonb->'events') e where e->>'kind' = 'completed_day' and e->>'actorName' = 'Cara'), 'private member emits no completion event');

-- roles & admin
select t_as(:B);
select t_raises($$select remove_circle_member(current_setting('test.circle')::uuid, '33333333-3333-3333-3333-333333333333')$$, 'member cannot remove');
select t_raises($$select rotate_circle_invite(current_setting('test.circle')::uuid)$$, 'member cannot rotate invite');
select t_raises($$select delete_dhikr_circle(current_setting('test.circle')::uuid)$$, 'member cannot delete');
select t_as(:A);
select set_circle_member_role(:'circle_id'::uuid, :B::uuid, 'admin');
select t_as(:B);
select rotate_circle_invite(:'circle_id'::uuid) as newcode \gset
select t_assert(:'newcode' <> :'code', 'invite rotated');
select t_assert(preview_circle_invite(:'code') is null, 'old invite revoked');
select remove_circle_member(:'circle_id'::uuid, :D::uuid);
select t_raises($$select remove_circle_member(current_setting('test.circle')::uuid, '11111111-1111-1111-1111-111111111111')$$, 'admin cannot remove owner');
select t_as(:A);
select t_raises($$select leave_dhikr_circle(current_setting('test.circle')::uuid)$$, 'owner cannot leave without transfer');
select t_as(:C);
select leave_dhikr_circle(:'circle_id'::uuid);
select t_assert(jsonb_array_length(my_dhikr_circles(:today)) = 0, 'C left');
select t_as(:A);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert((:'home'::jsonb->>'memberCount')::int = 2, 'two members remain');
select report_circle(:'circle_id'::uuid, 'test report');
select t_assert((select count(*) from public.dhikr_reports) = 0, 'reports are not readable by users');
select set_circle_intention(:'circle_id'::uuid, 'Remember Allah before the day begins.', :today);
select t_assert(circle_home(:'circle_id'::uuid, :today)->>'intention' like 'Remember%', 'intention saved');
select transfer_circle_ownership(:'circle_id'::uuid, :B::uuid);
select t_assert(circle_home(:'circle_id'::uuid, :today)->>'role' = 'admin', 'A demoted to admin after transfer');
select t_as(:B);
select t_assert(circle_home(:'circle_id'::uuid, :today)->>'role' = 'owner', 'B is now owner');

-- ---------------------------------------------------------------- guest import
select t_as(:D);
select import_journey_progress('stronger-heart-30', ('[{"day":1,"date":"' || (current_date - 2)::text || '"},{"day":2,"date":"' || (current_date - 1)::text || '"}]')::jsonb, :today);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'journey'->'completedDays') = 2, 'guest import created two days');
select import_journey_progress('stronger-heart-30', '[{"day":1,"date":"2020-01-01"}]'::jsonb, :today);
select t_assert(jsonb_array_length(my_dhikr_home(:today)->'journey'->'completedDays') = 2, 'second import ignored');

-- ---------------------------------------------------------------- export & delete
select t_as(:A);
select t_assert(jsonb_array_length(export_my_data()->'sessions') = 3, 'export contains sessions');
select delete_my_account();
select t_as(:B);
select circle_home(:'circle_id'::uuid, :today) as home \gset
select t_assert((:'home'::jsonb->>'memberCount')::int = 1, 'deleted account removed from circle');
reset role;
select t_assert((select count(*) from auth.users where id = '11111111-1111-1111-1111-111111111111') = 0, 'auth user deleted');
select t_assert((select count(*) from public.dhikr_sessions where user_id = '11111111-1111-1111-1111-111111111111') = 0, 'sessions cascaded');
