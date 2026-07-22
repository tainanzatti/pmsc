/*
# Enhance Lancamentos + Add XP/League System

## Changes Overview

1. **lancamentos table** — Add columns for detailed question tracking:
   - `total_questions` (integer, default 0) — total questions answered
   - `correct_count` (integer, default 0) — number of correct answers
   - `wrong_count` (integer, default 0) — number of wrong answers (auto-calculated)
   - `accuracy` (integer, default 0) — percentage of correct answers (auto-calculated)
   - `study_date` (date, default CURRENT_DATE) — the date the study happened (user-selectable)
   - `study_time` (time, default now()::time) — the time of the study session
   - `notes` (text, nullable) — optional observations
   - `xp_earned` (integer, default 0) — XP earned from this lancamento

2. **profiles table** — Add XP and league columns:
   - `xp` (integer, default 0) — total XP
   - `league` (text, default 'Bronze') — current league
   - `current_streak` (integer, default 0) — current daily study streak
   - `longest_streak` (integer, default 0) — longest daily study streak
   - `last_study_date` (date, nullable) — last date the user studied

3. **Security** — All new columns on user-scoped tables inherit existing RLS policies.
   No new tables created. No data loss — all ALTERs are additive.

## Important Notes
- The `mastered` column is kept for backward compatibility but new lancamentos will use `accuracy` as the mastery value.
- `study_date` allows users to log questions from previous days.
- XP is calculated client-side and stored per-lancamento, then aggregated to profiles.
*/

-- 1. Enhance lancamentos table
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS total_questions integer NOT NULL DEFAULT 0;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS correct_count integer NOT NULL DEFAULT 0;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS wrong_count integer NOT NULL DEFAULT 0;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS accuracy integer NOT NULL DEFAULT 0;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS study_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS study_time time NOT NULL DEFAULT now()::time;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS xp_earned integer NOT NULL DEFAULT 0;

-- 2. Enhance profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS league text NOT NULL DEFAULT 'Bronze';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_study_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sidebar_collapsed boolean NOT NULL DEFAULT false;

-- 3. Add index for ranking queries
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_study_date ON lancamentos(user_id, study_date);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
