-- Minimal stand-in for the Supabase platform: auth schema, auth.uid(), roles.
create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, auth, extensions to anon, authenticated;
grant select on auth.users to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
-- Test helpers
create or replace function public.t_assert(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin if not coalesce(p_ok, false) then raise exception 'ASSERTION FAILED: %', p_msg; end if; end $$;
create or replace function public.t_as(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), false);
$$;
create or replace function public.t_raises(p_sql text, p_msg text) returns void language plpgsql as $$
begin
  begin execute p_sql; exception when others then return; end;
  raise exception 'ASSERTION FAILED (expected error): %', p_msg;
end $$;
grant execute on function public.t_assert(boolean, text), public.t_as(uuid), public.t_raises(text, text) to anon, authenticated;
