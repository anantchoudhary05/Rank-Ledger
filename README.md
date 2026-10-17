# Rank Ledger

Manual SEO keyword rank tracker for a small team. Each person signs in with email/password and only sees their own data.

**Stack:** static HTML/CSS/JS + free [Supabase](https://supabase.com) (Auth + Postgres).  
**Host for free on:** [Cloudflare Pages](https://pages.cloudflare.com), [Netlify](https://www.netlify.com), or [GitHub Pages](https://pages.github.com).

Built by Alok Roy, SEO Expert.

---

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **SQL Editor** → New query.
3. Paste everything from [`sql/schema.sql`](sql/schema.sql) and run it.
4. Open **Project Settings → API**.
5. Copy **Project URL** and **anon public** key.

## 2. Connect the app

Edit [`js/config.js`](js/config.js):

```js
window.RANK_LEDGER_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY"
};
```

### Email confirmation (recommended for a private team of ~5)

In Supabase: **Authentication → Providers → Email**.

- For fastest setup while testing: turn **off** “Confirm email”.
- For production: leave confirmation **on**; teammates confirm once via email.

## 3. Free hosting

Deploy this whole folder (not only `index.html`):

| Host | Quick path |
|------|------------|
| **Cloudflare Pages** | Connect repo or drag-and-drop upload |
| **Netlify** | Drag folder to Netlify Drop, or connect repo |
| **GitHub Pages** | Push repo → Settings → Pages → deploy from root / `main` |

Open the live URL → **Sign up** → start tracking keywords.

## Features

- Email/password accounts (isolated per user via Row Level Security)
- Keyword tracking with rank history + sparklines
- Dashboard: up/down stats + 30-day average movement chart
- Tags / projects to group keywords (e.g. by client)
- Notes on each keyword
- Search and delete with confirmation

## Local preview

Open `index.html` via a simple static server (not always required, but recommended):

```bash
npx --yes serve .
```

Then visit the URL shown in the terminal.

## Privacy note

PINs from the old local version are gone. Use real Supabase accounts. Never put the **service_role** key in the frontend — only the **anon** key.
