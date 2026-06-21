-- Add study_minutes column to daily_usage table (run in Supabase SQL Editor)
ALTER TABLE daily_usage
ADD COLUMN IF NOT EXISTS study_minutes integer NOT NULL DEFAULT 0;
