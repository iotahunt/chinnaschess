# Supabase Schema Setup for Chinna's Chess

Run the following SQL in your Supabase project's **SQL Editor** (Dashboard -> SQL Editor -> New query) to initialize the database for Chinna's Chess.

---

### 1. Enable UUID Extension & Tables

```sql
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Stores user wins and total domain expansions)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  domain_expansions integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Games Table (Active & Finished chess matches with room codes & aura)
create table if not exists public.games (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  white_user_id uuid references public.profiles(id) on delete set null,
  black_user_id uuid references public.profiles(id) on delete set null,
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  status text not null check (status in ('waiting', 'active', 'finished')) default 'waiting',
  winner_id uuid references public.profiles(id) on delete set null,
  white_aura integer default 0 not null,
  black_aura integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index on room_code for instant lookup
create index if not exists games_room_code_idx on public.games (room_code);
```

---

### 2. Enable Realtime Replication for Live Chess Moves

```sql
-- Add games table to Supabase Realtime publication
alter publication supabase_realtime add table public.games;
```

---

### 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.games enable row level security;

-- Profiles: Anyone can view profiles; users can update their own
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);

create policy "Users can insert their own profile." 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile." 
  on public.profiles for update using (auth.uid() = id);

-- Games: Anyone authenticated or participating can view and play games
create policy "Games are viewable by everyone" 
  on public.games for select using (true);

create policy "Authenticated users can create games" 
  on public.games for insert with check (auth.uid() = white_user_id);

create policy "Participants can update their game" 
  on public.games for update using (
    auth.uid() = white_user_id or 
    auth.uid() = black_user_id or 
    black_user_id is null
  );
```

---

### 4. Automatic Profile Creation Trigger on Sign-Up

```sql
-- Function to automatically handle new user sign-ups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, domain_expansions)
  values (new.id, new.email, 0)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger firing after user insertion in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
