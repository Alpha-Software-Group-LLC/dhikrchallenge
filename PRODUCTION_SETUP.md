# Production enhancement setup

This branch targets the existing Vercel project for `dhikrchallenge.com`.

## Supabase

1. Open the connected Supabase project's SQL editor.
2. Run `supabase/schema.sql` once.
3. In Authentication settings, add these redirect URLs:
   - `https://dhikrchallenge.com`
   - The Vercel preview URL for this branch

Email/password authentication is enabled. The schema applies row-level security,
keeps progress and reflections private, prevents duplicate daily completions,
and limits circles to member-only participation status without scores, counts,
or last-active timestamps.

## Vercel environment

Add these variables to Preview and Production:

- `SUPABASE_URL`: the project's API URL
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable/anonymous key

Both values are client-public Supabase configuration. The application exposes
them through `/api/config`; never add the Supabase service-role key to Vercel for
this application.

## Release

1. Push `enhancement/supabase-auth`.
2. Validate sign-up, email confirmation, sign-in, completion syncing, duplicate
   prevention, the personalized daily releases, and private circle participation
   on the Vercel preview.
3. Verify direct entry to Today, reflection saving, bookmarks, private circle intentions,
   and the curated Ask boundaries.
4. Merge into `main` only after the preview passes.