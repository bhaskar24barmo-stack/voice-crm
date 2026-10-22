create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, company text not null default '-', interest text not null default '-',
  stage text not null default 'New' check (stage in ('New','Contacted','Proposal','Won')),
  created_at timestamptz not null default now());
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null, due text not null default 'This week', done boolean not null default false,
  created_at timestamptz not null default now());
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null, created_at timestamptz not null default now());
create table public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transcript text not null, actions jsonb not null default '[]', status text not null default 'confirmed',
  created_at timestamptz not null default now());

do $$ declare t text; begin
  foreach t in array array['contacts','tasks','activities','voice_notes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create index on public.%I (user_id, created_at desc)', t);
  end loop;
end $$;
