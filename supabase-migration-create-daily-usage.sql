-- Create daily_usage table (for free tier limits + study minutes tracking)
CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  chat_count integer NOT NULL DEFAULT 0,
  answer_count integer NOT NULL DEFAULT 0,
  summary_count integer NOT NULL DEFAULT 0,
  quiz_count integer NOT NULL DEFAULT 0,
  study_minutes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Unique constraint: one row per user per day
ALTER TABLE daily_usage DROP CONSTRAINT IF EXISTS daily_usage_user_id_date_key;
ALTER TABLE daily_usage ADD CONSTRAINT daily_usage_user_id_date_key UNIQUE (user_id, date);

-- Enable RLS
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own daily_usage" ON daily_usage;
DROP POLICY IF EXISTS "Users can insert own daily_usage" ON daily_usage;
DROP POLICY IF EXISTS "Users can update own daily_usage" ON daily_usage;

-- RLS policies
CREATE POLICY "Users can read own daily_usage"
  ON daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_usage"
  ON daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_usage"
  ON daily_usage FOR UPDATE
  USING (auth.uid() = user_id);
