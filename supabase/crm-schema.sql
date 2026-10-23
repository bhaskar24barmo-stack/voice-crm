-- Voice CRM data model. Run once in the Supabase SQL editor. Safe to re-run.
-- Additive only: it never touches the existing `waitlist` table.
-- Every table is owned by a user (user_id) and protected by Row Level Security:
-- a signed-in user can only read and write their own rows, enforced by the database itself.

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- contacts ----------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  company text check (company is null or char_length(company) <= 120),
  notes text check (notes is null or char_length(notes) <= 5000),
  tags text[] not null default '{}',
  status text not null default 'lead' check (status in ('lead','customer','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_user_name_idx on public.contacts (user_id, name);
create index if not exists contacts_user_status_idx on public.contacts (user_id, status);

-- ---------- leads ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'new' check (status in ('new','contacted','qualified','proposal','won','lost')),
  value numeric(14,2) check (value is null or value >= 0),
  expected_close date,
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_user_status_idx on public.leads (user_id, status);
create index if not exists leads_contact_idx on public.leads (contact_id);

-- ---------- tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_open_idx on public.tasks (user_id, done, due_date);
create index if not exists tasks_contact_idx on public.tasks (contact_id);
create index if not exists tasks_lead_idx on public.tasks (lead_id);

-- ---------- activities ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  type text not null default 'note' check (type in ('call','email','meeting','note','other')),
  summary text not null check (char_length(summary) between 1 and 2000),
  details text check (details is null or char_length(details) <= 8000),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists activities_user_time_idx on public.activities (user_id, occurred_at desc);
create index if not exists activities_contact_idx on public.activities (contact_id, occurred_at desc);

-- ---------- calls ----------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  summary text check (summary is null or char_length(summary) <= 5000),
  notes text check (notes is null or char_length(notes) <= 20000),
  transcript text check (transcript is null or char_length(transcript) <= 50000),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  source text not null default 'manual' check (source in ('manual','recorded','uploaded')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists calls_user_time_idx on public.calls (user_id, occurred_at desc);
create index if not exists calls_contact_idx on public.calls (contact_id, occurred_at desc);

-- ---------- ai / transcription usage (per-user rate limiting) ----------
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ai','stt')),
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_time_idx on public.ai_usage (user_id, kind, created_at desc);

-- ---------- updated_at triggers ----------
do $$ declare t text; begin
  foreach t in array array['contacts','leads','tasks','activities','calls'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ---------- Row Level Security ----------
do $$ declare t text; begin
  foreach t in array array['contacts','leads','tasks','activities','calls','ai_usage'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Owner-only policies for the tables that have no links to other tables.
drop policy if exists contacts_select on public.contacts;
drop policy if exists contacts_insert on public.contacts;
drop policy if exists contacts_update on public.contacts;
drop policy if exists contacts_delete on public.contacts;
create policy contacts_select on public.contacts for select to authenticated using (user_id = (select auth.uid()));
create policy contacts_insert on public.contacts for insert to authenticated with check (user_id = (select auth.uid()));
create policy contacts_update on public.contacts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy contacts_delete on public.contacts for delete to authenticated using (user_id = (select auth.uid()));

-- Tables that link to a contact or lead: you may only link to records you own.
do $$ declare t text; has_lead boolean; chk text; begin
  foreach t in array array['leads','tasks','activities','calls'] loop
    has_lead := t in ('tasks','activities');
    chk := 'user_id = (select auth.uid()) and (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = (select auth.uid())))';
    if has_lead then
      chk := chk || ' and (lead_id is null or exists (select 1 from public.leads l where l.id = lead_id and l.user_id = (select auth.uid())))';
    end if;
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', t || '_insert', t, chk);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (%s)', t || '_update', t, chk);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t || '_delete', t);
  end loop;
end $$;

-- Usage log: users can add and read their own rows, never edit or delete them.
drop policy if exists ai_usage_select on public.ai_usage;
drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = (select auth.uid()));
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (user_id = (select auth.uid()));
revoke update, delete on public.ai_usage from authenticated;

-- Optional housekeeping (needs the pg_cron extension): keep the usage log small.
-- select cron.schedule('ai-usage-cleanup', '17 3 * * *', $$delete from public.ai_usage where created_at < now() - interval '2 days'$$);
-- Optional at larger scale: trigram indexes make contact search faster.
-- create extension if not exists pg_trgm with schema extensions;
-- create index if not exists contacts_name_trgm on public.contacts using gin (name extensions.gin_trgm_ops);
