-- Run once in the Supabase SQL editor.
create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);
-- Lock the table: only the server (service role key) can read/write it.
alter table public.waitlist enable row level security;
