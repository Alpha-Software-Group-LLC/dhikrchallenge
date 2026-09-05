---
name: Production release path
description: The required production path for code and database releases.
---

Publish production code atomically through GitHub `main`; Vercel deploys from that branch. Apply database changes as named Supabase migrations and verify the resulting privileges, RLS, and advisor output.

**Why:** This keeps the public site, repository history, and database migration history auditable and aligned.

**How to apply:** Do not substitute a Replit deployment for the production release path, and do not run untracked production SQL outside a named migration.