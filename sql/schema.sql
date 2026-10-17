-- Rank Ledger schema + RLS
-- Run this once in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- Keywords
create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  keyword text not null,
  domain text not null,
  engine text not null default 'Google',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists keywords_user_id_idx on public.keywords (user_id);

-- Rank history
create table if not exists public.rank_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  keyword_id uuid not null references public.keywords (id) on delete cascade,
  logged_on date not null,
  position integer not null check (position >= 1),
  created_at timestamptz not null default now()
);

create index if not exists rank_logs_keyword_id_idx on public.rank_logs (keyword_id);
create index if not exists rank_logs_user_id_idx on public.rank_logs (user_id);
create index if not exists rank_logs_logged_on_idx on public.rank_logs (logged_on);

-- Tags (projects / clients)
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists tags_user_id_idx on public.tags (user_id);

-- Keyword ↔ tag
create table if not exists public.keyword_tags (
  keyword_id uuid not null references public.keywords (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (keyword_id, tag_id)
);

create index if not exists keyword_tags_user_id_idx on public.keyword_tags (user_id);
create index if not exists keyword_tags_tag_id_idx on public.keyword_tags (tag_id);

-- RLS
alter table public.keywords enable row level security;
alter table public.rank_logs enable row level security;
alter table public.tags enable row level security;
alter table public.keyword_tags enable row level security;

-- keywords policies
drop policy if exists "keywords_select_own" on public.keywords;
drop policy if exists "keywords_insert_own" on public.keywords;
drop policy if exists "keywords_update_own" on public.keywords;
drop policy if exists "keywords_delete_own" on public.keywords;

create policy "keywords_select_own" on public.keywords
  for select using (auth.uid() = user_id);
create policy "keywords_insert_own" on public.keywords
  for insert with check (auth.uid() = user_id);
create policy "keywords_update_own" on public.keywords
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "keywords_delete_own" on public.keywords
  for delete using (auth.uid() = user_id);

-- rank_logs policies
drop policy if exists "rank_logs_select_own" on public.rank_logs;
drop policy if exists "rank_logs_insert_own" on public.rank_logs;
drop policy if exists "rank_logs_update_own" on public.rank_logs;
drop policy if exists "rank_logs_delete_own" on public.rank_logs;

create policy "rank_logs_select_own" on public.rank_logs
  for select using (auth.uid() = user_id);
create policy "rank_logs_insert_own" on public.rank_logs
  for insert with check (auth.uid() = user_id);
create policy "rank_logs_update_own" on public.rank_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rank_logs_delete_own" on public.rank_logs
  for delete using (auth.uid() = user_id);

-- tags policies
drop policy if exists "tags_select_own" on public.tags;
drop policy if exists "tags_insert_own" on public.tags;
drop policy if exists "tags_update_own" on public.tags;
drop policy if exists "tags_delete_own" on public.tags;

create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

-- keyword_tags policies
drop policy if exists "keyword_tags_select_own" on public.keyword_tags;
drop policy if exists "keyword_tags_insert_own" on public.keyword_tags;
drop policy if exists "keyword_tags_delete_own" on public.keyword_tags;

create policy "keyword_tags_select_own" on public.keyword_tags
  for select using (auth.uid() = user_id);
create policy "keyword_tags_insert_own" on public.keyword_tags
  for insert with check (auth.uid() = user_id);
create policy "keyword_tags_delete_own" on public.keyword_tags
  for delete using (auth.uid() = user_id);
