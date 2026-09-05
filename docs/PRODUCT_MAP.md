# Dhikr Challenge — product & architecture map

This document records the audit that preceded the 2.0 evolution and the decisions
it produced. It is the reference for *why* the codebase looks the way it does.

## 1. What existed (audit, September 2026)

| Area | State before 2.0 |
| --- | --- |
| Delivery | Static site on Vercel. `bootstrap.js` loaded React, Babel-standalone and supabase-js from CDNs at runtime, fetched six `.jsx` files and transpiled them **in the browser**. `build.js` only untarred a "verified" snapshot in `.release/`. No type checking, no bundling, no tests. |
| Auth / data | Supabase email+password auth. Postgres with row-level security and `security definer` RPCs (`complete_daily_dhikr`, `my_dhikr_progress`, circles, preferences, reflections, saved items). Sound pattern; server assigns completion eligibility. |
| Content | 8 adhkar with Arabic, transliteration, meaning, source, significance, word-by-word glosses; 5 hadith paraphrases; 6 Qur'an references; human-recorded Arabic audio (MIT-licensed). |
| "Day N" | A global calendar rotation over the 8 adhkar (day-of-year mod 8). There was **no personal 30-day journey**, despite the product identity "30 Days to a Stronger Heart". |
| Today | Cluttered: intention plan, progress card, primary card, second release, privacy card, why-it-matters, hadith, list. |
| Session | Full-screen counter. Played recitation audio on every tap, no undo, no pause, no keep-awake, HUD-style grid and rotating dashed rings. |
| Circles | Create / join by 32-hex code, owner-only daily intention, member list with a completion boolean. No roles, leave, remove, delete, privacy levels, encouragement or events. |
| Knowledge | None beyond reading. No retention, no vocabulary tracking. |
| Progress | 14-day bar chart, fake "practice minutes" (count × 3), client-side streak with UTC/local date mixing. |
| Onboarding | Removed in an earlier commit. Preferences panel only. |
| Design | Drifted from the original emerald/black/gold to navy/teal. Grid overlay, glow, mono uppercase labels: slightly "HUD". Amiri Arabic, Cormorant/Lora/Outfit type — strong. |
| PWA | Manifest, hand-written service worker, offline page. Reasonable. |
| Extras | "Platforms" page advertising unavailable apps with disabled buttons. "Ask" keyword search over the curated library with fiqh guard-rails. |

## 2. What was strong (kept)

* Supabase RLS + `security definer` RPC pattern; duplicate-safe completion primary key.
* Privacy posture: circles share only participation, never counts or scores.
* Curated, referenced content and human audio.
* Visual DNA: prominent Arabic, serif display type, gold accents, geometric motifs.
* Private reflections tied to completions. Trust guard-rails in `.agents/memory`.
* The 30-day identity and the Today → Begin Dhikr → Complete → Why it matters loop.

## 3. What was weak (changed)

* Runtime transpilation → replaced with a Vite + TypeScript build (same static hosting, same `/api/config` function).
* No real journey → personal 30-day journey (`dhikr_user_journeys`, `dhikr_journey_days`) with server-validated day completion.
* Counting without understanding → structured content model, micro-lessons, knowledge questions, spaced review, "What I've learned".
* Thin circles → roles, invites/links, revoke, remove, leave, delete, per-member visibility, encouragement, events, collective progress, small-circle inference protection, all enforced in SQL.
* UTC day boundary → the client's local date is passed to RPCs and validated (±1 day of UTC).
* Streak-only → consistency model (last 7, last 30, current, best) with compassionate return.
* Dark only → light/dark themes from tokens.

## 4. Information architecture

Five destinations: **Today · Journey · Dhikr · Circles · You**. The session, completion, lesson and reflection are overlays, never tabs.

## 5. Data layer

`src/data/backend.ts` defines the `Backend` interface. Two implementations:

* `supabaseBackend.ts` — production. Every write is an RPC; every read goes through RLS.
* `localBackend.ts` — guest mode. Keeps a journey on the device so a visitor can reach Day 1 in under a minute; circles require an account. Guest progress is imported once at sign-up (`import_journey_progress`).

Religious content lives in `src/content/` as typed, reviewable records with `source`, `grade`, `reviewStatus`. Nothing is generated at runtime. Items whose grading the author could not verify are marked `review`, never invented.

## 6. Database

`supabase/schema.sql` is the applied baseline. `supabase/migrations/0002_evolution.sql` is additive: new tables, new columns with defaults, replaced functions. Nothing is dropped or truncated. `npm run db:test` runs the migration and privacy assertions against a local Postgres.
