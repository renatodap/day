-- V2 Database Schema for "186" App
-- Two simple tables, no auth required for now

-- Drop old tables if they exist (be careful in production!)
-- drop table if exists weights cascade;
-- drop table if exists daily_checks cascade;

-- Weights table
create table if not exists weights (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  weight decimal(5,1) not null,
  created_at timestamptz default now()
);

-- Daily checks table
create table if not exists daily_checks (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  deficit boolean default false,
  protein boolean default false,
  workout boolean default false,
  created_at timestamptz default now()
);

-- Indexes for faster queries
create index if not exists weights_date_idx on weights(date desc);
create index if not exists daily_checks_date_idx on daily_checks(date desc);

-- Enable RLS but allow all operations for now (single user mode)
alter table weights enable row level security;
alter table daily_checks enable row level security;

-- Permissive policies for single user mode
-- In production, you'd add user_id and proper policies
drop policy if exists "Allow all weights" on weights;
create policy "Allow all weights" on weights for all using (true);

drop policy if exists "Allow all daily_checks" on daily_checks;
create policy "Allow all daily_checks" on daily_checks for all using (true);
