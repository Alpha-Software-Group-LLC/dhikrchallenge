---
name: Stack and testing
description: How the 2.0 codebase is built and verified.
---

The web app is a Vite + React 18 + TypeScript build (`src/`), deployed as static
files on Vercel with `api/config.js` as the only serverless function. Religious
content is typed and curated in `src/content/`; the data layer is the `Backend`
interface in `src/data/` with Supabase (production) and local guest
implementations. Database changes are additive migrations in
`supabase/migrations/`.

**Why:** The previous runtime-Babel setup had no type checking, tests or code
splitting, and the product identity (30 Days to a Stronger Heart) had no real
per-user journey.

**How to apply:** Before shipping, run `npm run typecheck`, `npm test`,
`npm run db:test` (local PostgreSQL 16 with privacy assertions) and `npm run build`.
For browser walkthroughs build with `VITE_MOCK_BACKEND=1` and run
`tests/e2e/walkthrough.mjs`; the mock backend never ships in production builds.
Never add religious content without a source path; flag uncertain gradings with
`reviewStatus: "review"` instead of inventing a reference.
