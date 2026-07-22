/*
# Add Topic Progress + Exam Date

## Changes Overview

1. **topic_progress table** (NEW) — Tracks per-user, per-topic study state:
   - `user_id` (uuid, FK auth.users) — owner
   - `topic_id` (uuid, FK topics) — the topic
   - `discipline_id` (text, FK disciplines) — denormalized for quick queries
   - `status` (text: 'pending' | 'in_progress' | 'completed') — study state
   - `mastery` (integer 0-100) — current mastery percentage
   - `questions_total` (integer) — total questions answered for this topic
   - `questions_correct` (integer) — correct answers
   - `last_studied_at` (timestamptz, nullable) — last study timestamp
   - `study_count` (integer) — how many times studied
   - `created_at`, `updated_at` — timestamps

2. **profiles table** — Add `exam_date` (date, nullable) for exam proximity calculation

3. **Security**
   - RLS enabled on topic_progress
   - 4 CRUD policies scoped to authenticated users via auth.uid() = user_id
   - user_id defaults to auth.uid()
*/

CREATE TABLE IF NOT EXISTS topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  discipline_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  mastery integer NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  questions_total integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  last_studied_at timestamptz,
  study_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_topic_progress" ON topic_progress;
CREATE POLICY "select_own_topic_progress" ON topic_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_topic_progress" ON topic_progress;
CREATE POLICY "insert_own_topic_progress" ON topic_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_topic_progress" ON topic_progress;
CREATE POLICY "update_own_topic_progress" ON topic_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_topic_progress" ON topic_progress;
CREATE POLICY "delete_own_topic_progress" ON topic_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_topic_progress_user ON topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_discipline ON topic_progress(user_id, discipline_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_status ON topic_progress(user_id, status);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exam_date date;
