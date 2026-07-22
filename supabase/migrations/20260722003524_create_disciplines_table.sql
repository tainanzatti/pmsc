/*
# Create disciplines table and restructure topics for PMSC-AOCP edital

## Summary
This migration creates a new `disciplines` table to store discipline metadata
(question counts, colors, icons, sort order) and adds `fibonacci_weight` and
`parent_id` columns to the `topics` table to support hierarchical topic
structures and AOCP historical incidence weighting.

## New Tables
### disciplines
- `id` (text, PK) — slug identifier (e.g., "lingua_portuguesa")
- `name` (text, NOT NULL) — display name
- `icon` (text) — emoji icon
- `color` (text) — hex color for UI
- `question_count` (integer) — number of questions in the exam
- `sort_order` (integer) — display order
- `is_discursive` (boolean) — true for Redação (no objective questions)
- `created_at` (timestamptz)

## Modified Tables
### topics
- Added `fibonacci_weight` (integer, NOT NULL, DEFAULT 13) — AOCP incidence weight
  using Fibonacci scale: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
- Added `parent_id` (uuid, nullable) — FK to topics(id) for hierarchical topics
  (e.g., "Constituição Federal" → "Art. 1º ao 6º")
- Added `sort_order` (integer, NOT NULL, DEFAULT 0) — ordering within discipline

## Data Cleanup
- Deletes all existing user study data (lancamentos, flashcards, study_sessions,
  discipline_skip_state, ai_material, redacoes) that reference old disciplines
- Deletes all existing topics (they reference old discipline IDs)
- Does NOT touch profiles or auth.users

## Security
- RLS enabled on `disciplines` with anon+authenticated SELECT (shared reference data)
- No write policies on disciplines (managed via SQL/migrations only)
- topics RLS unchanged (already has anon policies)
*/

-- 1. Create disciplines table
CREATE TABLE IF NOT EXISTS disciplines (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '📖',
  color text NOT NULL DEFAULT '#3b82f6',
  question_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_discursive boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Add columns to topics
ALTER TABLE topics ADD COLUMN IF NOT EXISTS fibonacci_weight integer NOT NULL DEFAULT 13;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES topics(id) ON DELETE CASCADE;

-- 3. Clean up old data that references old discipline IDs
DELETE FROM lancamentos;
DELETE FROM flashcards;
DELETE FROM study_sessions;
DELETE FROM discipline_skip_state;
DELETE FROM ai_material;
DELETE FROM redacoes;
DELETE FROM topics;

-- 4. Enable RLS on disciplines
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

-- 5. Add anon+authenticated SELECT policy on disciplines (shared reference data)
DROP POLICY IF EXISTS "anon_select_disciplines" ON disciplines;
CREATE POLICY "anon_select_disciplines"
ON disciplines FOR SELECT
TO anon, authenticated USING (true);

-- 6. Add FK from topics.discipline_id to disciplines.id
-- (topics already has anon RLS policies for all CRUD)
ALTER TABLE topics
  DROP CONSTRAINT IF EXISTS topics_discipline_id_fkey,
  ADD CONSTRAINT topics_discipline_id_fkey
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id);
