create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  checkins_enabled boolean not null default false,
  checkin_time time not null default '09:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  category text not null default 'user_shared',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.memories enable row level security;

create policy "users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can view own memories"
  on public.memories for select using (auth.uid() = user_id);
create policy "users can insert own memories"
  on public.memories for insert with check (auth.uid() = user_id);
create policy "users can delete own memories"
  on public.memories for delete using (auth.uid() = user_id);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();


-- Proactive messaging, delivery connections, and context history.
alter table public.profiles add column if not exists telegram_chat_id text;
alter table public.profiles add column if not exists telegram_username text;
alter table public.profiles add column if not exists telegram_link_code text unique;
alter table public.profiles add column if not exists telegram_link_expires_at timestamptz;
alter table public.profiles add column if not exists last_proactive_date date;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 10000),
  source text not null default 'chat' check (source in ('chat', 'proactive')),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_user_created_idx on public.chat_messages(user_id, created_at desc);
alter table public.chat_messages enable row level security;
drop policy if exists "users can view own chat messages" on public.chat_messages;
create policy "users can view own chat messages" on public.chat_messages for select using (auth.uid() = user_id);
drop policy if exists "users can insert own chat messages" on public.chat_messages;
create policy "users can insert own chat messages" on public.chat_messages for insert with check (auth.uid() = user_id);
drop policy if exists "users can delete own chat messages" on public.chat_messages;
create policy "users can delete own chat messages" on public.chat_messages for delete using (auth.uid() = user_id);

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists web_push_subscriptions_user_idx on public.web_push_subscriptions(user_id);
alter table public.web_push_subscriptions enable row level security;
-- All writes are performed by server routes using the service-role key; no client policy is needed.

create table if not exists public.proactive_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  message text not null,
  channels text[] not null default '{}',
  errors text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(user_id, local_date)
);
create index if not exists proactive_deliveries_user_created_idx on public.proactive_deliveries(user_id, created_at desc);
alter table public.proactive_deliveries enable row level security;
