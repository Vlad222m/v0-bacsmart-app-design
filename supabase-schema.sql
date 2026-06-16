-- BACsmart Supabase Schema
-- Run this in the Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  current_plan text default 'free' check (current_plan in ('free', 'premium', 'annual')),
  streak_days integer default 0,
  total_study_hours numeric default 0,
  bac_profile text,
  selected_subjects jsonb default '[]'::jsonb,
  trial_ends_at timestamp with time zone,
  premium_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Test scores table
create table if not exists public.test_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  correct integer not null default 0,
  total integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subject progress table
create table if not exists public.subject_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  progress integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, subject)
);

-- Summaries table
create table if not exists public.summaries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text not null,
  summary text not null,
  key_points jsonb default '[]'::jsonb,
  questions jsonb default '[]'::jsonb,
  file_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quizzes table (teste generate din poze/fisiere)
create table if not exists public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  file_name text,
  difficulty text default 'mediu',
  questions jsonb default '[]'::jsonb,
  score integer default 0,
  total integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily usage tracking for free tier limits
create table if not exists public.daily_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  chat_count integer default 0,
  answer_count integer default 0,
  summary_count integer default 0,
  quiz_count integer default 0,
  unique(user_id, date)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;
alter table public.test_scores enable row level security;
alter table public.subject_progress enable row level security;
alter table public.summaries enable row level security;
alter table public.quizzes enable row level security;
alter table public.daily_usage enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Chat messages policies
create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Test scores policies
create policy "Users can view own test scores"
  on public.test_scores for select
  using (auth.uid() = user_id);

create policy "Users can insert own test scores"
  on public.test_scores for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own test scores"
  on public.test_scores for delete
  using (auth.uid() = user_id);

-- Subject progress policies
create policy "Users can view own subject progress"
  on public.subject_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own subject progress"
  on public.subject_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subject progress"
  on public.subject_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own subject progress"
  on public.subject_progress for delete
  using (auth.uid() = user_id);

-- Summaries policies
create policy "Users can view own summaries"
  on public.summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own summaries"
  on public.summaries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own summaries"
  on public.summaries for delete
  using (auth.uid() = user_id);

-- Quizzes policies
create policy "Users can view own quizzes"
  on public.quizzes for select
  using (auth.uid() = user_id);

create policy "Users can insert own quizzes"
  on public.quizzes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own quizzes"
  on public.quizzes for delete
  using (auth.uid() = user_id);

-- Daily usage policies
create policy "Users can view own daily usage"
  on public.daily_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own daily usage"
  on public.daily_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own daily usage"
  on public.daily_usage for update
  using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes for better performance
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_subject_idx on public.chat_messages(subject);
create index if not exists test_scores_user_id_idx on public.test_scores(user_id);
create index if not exists test_scores_subject_idx on public.test_scores(subject);
create index if not exists subject_progress_user_id_idx on public.subject_progress(user_id);
create index if not exists summaries_user_id_idx on public.summaries(user_id);
create index if not exists quizzes_user_id_idx on public.quizzes(user_id);
create index if not exists daily_usage_user_id_idx on public.daily_usage(user_id);
create index if not exists daily_usage_date_idx on public.daily_usage(date);
