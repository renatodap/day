-- DID I WIN? Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- DAILY LOGS
-- ============================================
create table if not exists daily_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  deficit boolean default false,
  protein boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- ============================================
-- WORKOUT LOGS (individual entries for weekly count)
-- ============================================
create table if not exists workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz default now(),
  workout_type text, -- optional: 'running', 'strength', 'tennis', 'conditioning'
  created_at timestamptz default now()
);

-- ============================================
-- WEIGHT LOGS
-- ============================================
create table if not exists weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight decimal(5,2) not null check (weight > 50 and weight < 500),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- ============================================
-- GOALS
-- ============================================
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_value decimal(5,1),
  target_date date,
  achieved boolean default false,
  achieved_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- RECURRING TASKS
-- ============================================
create table if not exists recurring_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6), -- 0=Sun, 4=Thu
  time_hint time,
  weekly_target int default 1, -- for things like "5 apps per week"
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- TASK COMPLETIONS
-- ============================================
create table if not exists task_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references recurring_tasks(id) on delete cascade not null,
  completed_at timestamptz default now(),
  week_start date not null, -- Monday of the week this counts toward
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table daily_logs enable row level security;
alter table workout_logs enable row level security;
alter table weight_logs enable row level security;
alter table goals enable row level security;
alter table recurring_tasks enable row level security;
alter table task_completions enable row level security;

-- Drop existing policies if they exist (for re-running)
drop policy if exists "Users can view own daily_logs" on daily_logs;
drop policy if exists "Users can insert own daily_logs" on daily_logs;
drop policy if exists "Users can update own daily_logs" on daily_logs;
drop policy if exists "Users can view own workout_logs" on workout_logs;
drop policy if exists "Users can insert own workout_logs" on workout_logs;
drop policy if exists "Users can delete own workout_logs" on workout_logs;
drop policy if exists "Users can view own weight_logs" on weight_logs;
drop policy if exists "Users can insert own weight_logs" on weight_logs;
drop policy if exists "Users can update own weight_logs" on weight_logs;
drop policy if exists "Users can view own goals" on goals;
drop policy if exists "Users can insert own goals" on goals;
drop policy if exists "Users can update own goals" on goals;
drop policy if exists "Users can view own recurring_tasks" on recurring_tasks;
drop policy if exists "Users can insert own recurring_tasks" on recurring_tasks;
drop policy if exists "Users can update own recurring_tasks" on recurring_tasks;
drop policy if exists "Users can delete own recurring_tasks" on recurring_tasks;
drop policy if exists "Users can view own task_completions" on task_completions;
drop policy if exists "Users can insert own task_completions" on task_completions;
drop policy if exists "Users can delete own task_completions" on task_completions;

-- Policies: users can only access their own data
create policy "Users can view own daily_logs" on daily_logs for select using (auth.uid() = user_id);
create policy "Users can insert own daily_logs" on daily_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own daily_logs" on daily_logs for update using (auth.uid() = user_id);

create policy "Users can view own workout_logs" on workout_logs for select using (auth.uid() = user_id);
create policy "Users can insert own workout_logs" on workout_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own workout_logs" on workout_logs for delete using (auth.uid() = user_id);

create policy "Users can view own weight_logs" on weight_logs for select using (auth.uid() = user_id);
create policy "Users can insert own weight_logs" on weight_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own weight_logs" on weight_logs for update using (auth.uid() = user_id);

create policy "Users can view own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals for update using (auth.uid() = user_id);

create policy "Users can view own recurring_tasks" on recurring_tasks for select using (auth.uid() = user_id);
create policy "Users can insert own recurring_tasks" on recurring_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring_tasks" on recurring_tasks for update using (auth.uid() = user_id);
create policy "Users can delete own recurring_tasks" on recurring_tasks for delete using (auth.uid() = user_id);

create policy "Users can view own task_completions" on task_completions for select using (auth.uid() = user_id);
create policy "Users can insert own task_completions" on task_completions for insert with check (auth.uid() = user_id);
create policy "Users can delete own task_completions" on task_completions for delete using (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_daily_logs_user_date on daily_logs(user_id, date);
create index if not exists idx_workout_logs_user_date on workout_logs(user_id, logged_at);
create index if not exists idx_weight_logs_user_date on weight_logs(user_id, date);
create index if not exists idx_task_completions_week on task_completions(user_id, task_id, week_start);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get week start (Monday) for a given date
create or replace function get_week_start(d date)
returns date as $$
begin
  return d - extract(dow from d)::int + 1;
end;
$$ language plpgsql immutable;

-- Get workouts count for current week
create or replace function get_weekly_workout_count(uid uuid, week_start_date date)
returns int as $$
declare
  count int;
begin
  select count(*)::int into count
  from workout_logs
  where user_id = uid
    and logged_at >= week_start_date
    and logged_at < week_start_date + interval '7 days';
  return count;
end;
$$ language plpgsql stable;

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_daily_logs_updated_at on daily_logs;
create trigger update_daily_logs_updated_at
  before update on daily_logs
  for each row execute function update_updated_at_column();

drop trigger if exists update_weight_logs_updated_at on weight_logs;
create trigger update_weight_logs_updated_at
  before update on weight_logs
  for each row execute function update_updated_at_column();
