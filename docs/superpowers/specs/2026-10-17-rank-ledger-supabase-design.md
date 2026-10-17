# Rank Ledger — Supabase Multi-User Design

**Date:** 2026-10-17  
**Status:** Approved (user: Approach 1, email/password, features D, “just make it”)

## Goal

Turn the single-file Rank Ledger into a professional, free-hosted SEO rank tracker for a small team (~5). Each person has email/password auth and fully isolated data. Add dashboard chart, tags/projects, and keyword notes.

## Architecture

- **Frontend:** Static HTML/CSS/JS (split into focused files). Host on Cloudflare Pages, Netlify, or GitHub Pages.
- **Backend:** Supabase only — Auth (email/password), Postgres, Row Level Security (RLS).
- **No custom server.** Browser talks to Supabase via the JS client and the anon key.
- **Config:** `js/config.js` holds `SUPABASE_URL` and `SUPABASE_ANON_KEY` (placeholders until the owner creates a project).

## Auth

- Replace name + PIN + `window.storage` with Supabase email/password.
- Screens: Sign in, Sign up, Sign out.
- After login, load only that user’s keywords, logs, tags.
- Optional: email confirmation per Supabase project settings (document in README; default assume enabled or disable for small private team).

## Data model

All tables include `user_id uuid references auth.users not null`. RLS: `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE.

### `keywords`
- `id` uuid PK  
- `user_id` uuid  
- `keyword` text not null  
- `domain` text not null  
- `engine` text not null default `'Google'`  
- `notes` text default `''`  
- `created_at` timestamptz default now()

### `rank_logs`
- `id` uuid PK  
- `user_id` uuid  
- `keyword_id` uuid references keywords on delete cascade  
- `logged_on` date not null  
- `position` integer not null check (position >= 1)  
- `created_at` timestamptz default now()

### `tags`
- `id` uuid PK  
- `user_id` uuid  
- `name` text not null  
- unique (`user_id`, `name`)

### `keyword_tags`
- `keyword_id` uuid references keywords on delete cascade  
- `tag_id` uuid references tags on delete cascade  
- `user_id` uuid  
- primary key (`keyword_id`, `tag_id`)

## Features (build order)

1. **Auth + core ledger** — add keyword, log position, expand history, sparkline, search, delete with confirm, persist via Supabase.
2. **Dashboard** — stats (tracked / up / down / flat) + one overview chart of average (or median) best-available position trend across keywords over recent dates.
3. **Tags** — create tags, assign on keyword form / expand panel, filter list by tag.
4. **Notes** — editable notes field on each keyword (in expand panel).

## UI / visual direction

- Keep the existing **ledger** identity: paper/ink/teal palette, Fraunces display + monospace for ranks — professional tool, not a generic SaaS dashboard.
- Replace Inter with a non-default UI font (e.g. Source Sans 3 or similar).
- Atmosphere: subtle paper grain or soft gradient wash on `--paper` (not flat single color).
- First screen after login: brand (Rank Ledger) + short line + dashboard strip + CTA to track keyword — not a dense admin panel.
- Auth: centered composition, brand-first, sign-in / sign-up toggle.
- Motion: expand/collapse of rows, chart draw-in, soft hover on ledger rows (2–3 intentional motions).
- Avoid: purple gradients, cream+terracotta cliché, broadsheet density, emoji, heavy multi-shadow cards.

Credit line remains: “Built by Alok Roy, SEO Expert”.

## Data flow

1. App boot → Supabase `getSession()` → auth UI or ledger.
2. `onAuthStateChange` keeps UI in sync.
3. Mutations: optimistic local update optional; always await Supabase and show save error banner if fail.
4. Dashboard aggregates from loaded keywords + rank_logs (client-side for v1; enough for ~5 users).

## Error handling

- Auth errors: show Supabase message (invalid login, weak password, email taken).
- Network/save failures: non-blocking banner; keep last known UI state.
- Empty states: clear CTA to add first keyword / create first tag.
- Delete keyword: confirm dialog before cascade delete.

## Out of scope (v1)

- Live SERP scraping / automated rank checks  
- Shared team ledgers / admin view of all users  
- Mobile native apps  
- CSV import/export (can add later)  
- Real-time multi-tab sync beyond reload/refetch  

## Hosting & setup (owner steps)

1. Create free Supabase project.  
2. Run `sql/schema.sql` in SQL editor.  
3. Put URL + anon key in `js/config.js`.  
4. Deploy folder to Cloudflare Pages / Netlify / GitHub Pages.  
5. Invite teammates to sign up with email.

## Success criteria

- 5 users can each sign up, sign in, and only see their own data.  
- Dashboard, tags, and notes work end-to-end.  
- UI looks cohesive and professional on desktop and mobile.  
- README explains free hosting + Supabase setup in under 10 minutes.
