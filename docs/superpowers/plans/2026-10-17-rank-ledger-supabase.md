# Rank Ledger Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Rank Ledger as a static multi-user SEO rank tracker with Supabase Auth, Postgres+RLS, dashboard chart, tags, and notes.

**Architecture:** Static HTML/CSS/JS hosted on free static hosting; Supabase for auth and data; RLS isolates each user’s rows.

**Tech Stack:** Vanilla JS, Supabase JS CDN (`@supabase/supabase-js`), CSS variables, SVG charts (no chart library required).

## Global Constraints

- Keep brand credit: “Built by Alok Roy, SEO Expert”
- Do not use Inter/Roboto/Arial as primary UI font
- Preserve ledger paper/teal visual identity; improve polish
- No live SERP scraping in v1
- Config keys live in `js/config.js` as placeholders
- No git commits unless the user asks

---

## File structure

| Path | Responsibility |
|------|----------------|
| `index.html` | Shell, mounts `#app`, loads CSS/JS |
| `css/styles.css` | All styles / theme / layout |
| `js/config.js` | Supabase URL + anon key placeholders |
| `js/supabaseClient.js` | Creates shared client |
| `js/helpers.js` | uid, dates, trends, escape HTML |
| `js/db.js` | All Supabase CRUD for keywords, logs, tags |
| `js/auth.js` | Sign in / up / out + session |
| `js/charts.js` | Sparkline + dashboard chart SVG |
| `js/app.js` | State, render, events |
| `sql/schema.sql` | Tables + RLS policies |
| `README.md` | Setup: Supabase + free host |

---

### Task 1: Schema + project skeleton

**Files:**
- Create: `sql/schema.sql`
- Create: `js/config.js`
- Create: `README.md`
- Create: `css/styles.css` (base tokens only)
- Create: `index.html` (empty shell)

- [ ] **Step 1: Write `sql/schema.sql`** with `keywords`, `rank_logs`, `tags`, `keyword_tags`, indexes, and RLS policies (`user_id = auth.uid()` for all ops). Enable RLS on every table.

- [ ] **Step 2: Write `js/config.js`**

```js
window.RANK_LEDGER_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
```

- [ ] **Step 3: Write README** covering create project → run SQL → paste keys → deploy to Cloudflare Pages/Netlify/GitHub Pages → invite 5 teammates.

- [ ] **Step 4: Create `index.html` shell** with `#app`, link to `css/styles.css`, and script tags (config → supabase CDN → modules in order).

**Verify:** Schema file is complete SQL; README has numbered steps; page loads blank `#app` without JS errors when keys are placeholders (client may warn).

---

### Task 2: Helpers, client, CSS foundation

**Files:**
- Create: `js/helpers.js`, `js/supabaseClient.js`, `js/charts.js`
- Modify: `css/styles.css`

- [ ] **Step 1: Port helpers** from old `index.html`: `esc`, `todayISO`, `formatDate`, `sortedHistory`, `getTrend`, `currentPosition`, `bestPosition`.

- [ ] **Step 2: `supabaseClient.js`** — `createClient` from config; export `window.rlClient`. If URL still placeholder, set `window.rlConfigError = true`.

- [ ] **Step 3: CSS foundation** — variables (paper/ink/teal), Source Sans 3 + Fraunces + IBM Plex Mono, paper atmosphere, focus styles, layout utilities for auth and ledger.

- [ ] **Step 4: Charts module** — `renderSparkline(history, direction)`, `renderDashboardChart(series)` returning SVG strings (overall movement: for each date in range, average position across keywords that have a log that day or last-known forward-fill — document choice: **last-known position per keyword per day, then average**).

**Verify:** Open page; no console crash; helpers available on `window` or as module globals.

---

### Task 3: Auth UI + session gate

**Files:**
- Create: `js/auth.js`
- Modify: `js/app.js` (start), `css/styles.css`

- [ ] **Step 1: Auth API** — `signUp(email, password)`, `signIn(email, password)`, `signOut()`, `getSession()`, subscribe `onAuthStateChange`.

- [ ] **Step 2: Render auth screen** — brand Rank Ledger, email/password, toggle Sign in / Sign up, error text, credit line.

- [ ] **Step 3: App boot** — if config error, show setup message pointing to README; else session ? ledger : auth.

**Verify:** With real Supabase keys, can sign up and sign in; without keys, clear setup message.

---

### Task 4: Core ledger CRUD

**Files:**
- Create: `js/db.js`
- Modify: `js/app.js`

- [ ] **Step 1: DB functions** — `listKeywordsWithLogs()`, `createKeyword({keyword, domain, engine, position, date, notes})`, `addRankLog(keywordId, position, date)`, `updateKeywordNotes(id, notes)`, `deleteKeyword(id)`, `listTags()`, `createTag(name)`, `setKeywordTags(keywordId, tagIds)`, `keywordsByTag(tagId)` (filter client-side OK).

- [ ] **Step 2: Ledger UI** — header, profile email + sign out, add form, search, expandable rows with history, log position, delete confirm, sparklines, save-error banner.

- [ ] **Step 3: Wire events** — no `window.storage`; all persist via `db.js`.

**Verify:** Create keyword, log second position, see trend; delete with confirm; refresh keeps data.

---

### Task 5: Dashboard, tags, notes

**Files:**
- Modify: `js/app.js`, `js/charts.js`, `css/styles.css`, `js/db.js`

- [ ] **Step 1: Dashboard strip** — stats + overview chart above the list (only when keywords exist).

- [ ] **Step 2: Tags** — manage tags (create), multi-select on add/edit, filter bar (not rounded-full pill spam — use understated tag buttons).

- [ ] **Step 3: Notes** — textarea in expanded row; save on blur or Save button via `updateKeywordNotes`.

**Verify:** Filter by tag; chart updates after new logs; notes persist after reload.

---

### Task 6: Polish + remove old monolith

**Files:**
- Replace: `index.html` (remove inline app if still present)
- Modify: `css/styles.css` for motion and mobile

- [ ] **Step 1: Responsive layout** — form grid, chart scales down, touch-friendly expand targets.

- [ ] **Step 2: Motion** — row expand, chart path draw, hover on rows.

- [ ] **Step 3: Empty/loading/error states** polished.

- [ ] **Step 4: Manual QA checklist** against success criteria in the spec.

**Verify:** Desktop + narrow mobile; auth → dashboard → tag filter → notes → sign out.
