# Production enhancement setup

This branch targets the existing Vercel project for `dhikrchallenge.com`.

## Supabase

1. Open the connected Supabase project's SQL editor.
2. Run `supabase/schema.sql` once.
3. In Authentication settings, add these redirect URLs:
   - `https://dhikrchallenge.com`
   - `https://www.dhikrchallenge.com`
   - The Vercel preview URL for this branch

   Sign-up confirmation emails redirect to whichever origin the person signed up
   from (`window.location.origin`), so every hostname that serves the app must be
   in this list. The Site URL is only a fallback and should point at the
   canonical hostname.

Email/password authentication is enabled. The schema applies row-level security,
keeps progress private, assigns XP inside PostgreSQL, prevents duplicate daily
completions, and exposes only display names and today's XP to authenticated
people on the leaderboard.

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
   prevention, the two daily releases, and the leaderboard on the Vercel preview.
3. Merge into `main` only after the preview passes.