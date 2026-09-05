# Production setup

Dhikr Challenge is a static Vite build on Vercel (`dhikrchallenge.com`) backed by
Supabase (auth + Postgres with row-level security). `api/config.js` is the only
serverless function; it serves the public Supabase URL and publishable key.

## Build

```
npm ci
npm run typecheck   # tsc
npm test            # vitest unit tests
npm run db:test     # migration + privacy assertions on a local PostgreSQL 16
npm run build       # typecheck + vite build → dist/
```

`vercel.json` sets the build command, SPA rewrites (everything except `/api/*`
falls back to `index.html`), no-cache for the service worker and baseline
security headers.

## Database

1. `supabase/schema.sql` is the baseline already applied to production.
2. Apply `supabase/migrations/0002_evolution.sql` as a **named Supabase
   migration**. It is additive and idempotent: new tables (journeys, sessions,
   knowledge, circle encouragements/events/reports, content items), new columns
   with defaults on circles and members, and replaced functions. No table is
   dropped, no rows deleted.
3. After applying, check the advisor output. Every new table has RLS enabled;
   every function is `security definer` with `search_path` pinned; execute is
   revoked from `public`/`anon` and granted to `authenticated` (the invite
   preview is also granted to `anon` so a link shows the circle name before
   sign-up).
4. `delete_my_account()` deletes from `auth.users`; confirm the function owner
   has that privilege in your project (the default `postgres` owner does).

Function signatures that changed (old overloads are dropped by the migration):
`complete_daily_dhikr`, `create_dhikr_circle`, `join_dhikr_circle`,
`my_dhikr_circles`, `set_circle_intention`, `save_dhikr_reflection`.
`circle_today` is replaced by `circle_home`. Deploy the database migration and
the client in the same release window.

## Vercel environment

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`)

Both are client-public. Never add the service-role key.

## Auth settings

Add the production and preview URLs to Supabase Auth redirect URLs. Invite links
are `https://dhikrchallenge.com/join/<CODE>`; they work signed-out (preview only)
and complete after sign-in.

## Release checklist

1. `npm run build`, `npm test`, `npm run db:test` are green.
2. Apply the migration on a preview branch database, then open the Vercel
   preview: sign up, Day 1 → completion → lesson → reflection, create a Circle,
   join it from a second account with **Private** visibility and confirm the
   first account cannot see that member's status.
3. Merge to `main`; Vercel deploys from there.

## Browser walkthrough (optional)

```
VITE_MOCK_BACKEND=1 npx vite build --outDir dist-mock
npx vite preview --outDir dist-mock --port 4173 &
CHROMIUM_PATH=/path/to/chrome node tests/e2e/walkthrough.mjs http://localhost:4173
```

The mock backend is compiled in only with `VITE_MOCK_BACKEND=1`; production
builds do not contain it.
