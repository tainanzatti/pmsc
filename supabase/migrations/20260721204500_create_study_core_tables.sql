/*
# Create core study tables for Operação PMSC

## Overview
Creates the foundational tables for the study engine: topics, study logs
(lançamentos), and discipline skip state (tracks how many times a discipline
was skipped and its urgency multiplier).

## New Tables

### topics
- id (uuid, PK)
- discipline_id (text, not null)
- title (text, not null)
- created_at (timestamptz, default now)

### lancamentos
- id (uuid, PK)
- topic_id (uuid, FK to topics.id ON DELETE CASCADE)
- discipline_id (text, not null)
- mastered (integer 0-100, not null)
- created_at (timestamptz, default now)
- cycle_number (integer, nullable)

### discipline_skip_state
- discipline_id (text, PK)
- skip_count (integer, default 0)
- urgency_multiplier (real, default 1.0)
- updated_at (timestamptz, default now)

## Security
- Single-tenant app (no sign-in). RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD (data is intentionally shared).
*/

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id text NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_topics ON topics;
CREATE POLICY anon_select_topics ON topics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_topics ON topics;
CREATE POLICY anon_insert_topics ON topics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_topics ON topics;
CREATE POLICY anon_update_topics ON topics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_topics ON topics;
CREATE POLICY anon_delete_topics ON topics FOR DELETE
  TO anon, authenticated USING (true);

-- Lancamentos (study logs) table
CREATE TABLE IF NOT EXISTS lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  discipline_id text NOT NULL,
  mastered integer NOT NULL CHECK (mastered >= 0 AND mastered <= 100),
  created_at timestamptz DEFAULT now(),
  cycle_number integer
);

ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_lancamentos ON lancamentos;
CREATE POLICY anon_select_lancamentos ON lancamentos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_lancamentos ON lancamentos;
CREATE POLICY anon_insert_lancamentos ON lancamentos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_lancamentos ON lancamentos;
CREATE POLICY anon_update_lancamentos ON lancamentos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_lancamentos ON lancamentos;
CREATE POLICY anon_delete_lancamentos ON lancamentos FOR DELETE
  TO anon, authenticated USING (true);

-- Discipline skip state table
CREATE TABLE IF NOT EXISTS discipline_skip_state (
  discipline_id text PRIMARY KEY,
  skip_count integer NOT NULL DEFAULT 0,
  urgency_multiplier real NOT NULL DEFAULT 1.0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discipline_skip_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_skip_state ON discipline_skip_state;
CREATE POLICY anon_select_skip_state ON discipline_skip_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_skip_state ON discipline_skip_state;
CREATE POLICY anon_insert_skip_state ON discipline_skip_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_skip_state ON discipline_skip_state;
CREATE POLICY anon_update_skip_state ON discipline_skip_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_skip_state ON discipline_skip_state;
CREATE POLICY anon_delete_skip_state ON discipline_skip_state FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lancamentos_topic_id ON lancamentos(topic_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_discipline_id ON lancamentos(discipline_id);
CREATE INDEX IF NOT EXISTS idx_topics_discipline_id ON topics(discipline_id);

-- Seed initial skip state rows for all disciplines
INSERT INTO discipline_skip_state (discipline_id, skip_count, urgency_multiplier)
VALUES
  ('portugues', 0, 1.0),
  ('matematica', 0, 1.0),
  ('raciocinio-logico', 0, 1.0),
  ('historia-sc', 0, 1.0),
  ('geografia-sc', 0, 1.0),
  ('atualidades', 0, 1.0),
  ('legislacao', 0, 1.0),
  ('informatica', 0, 1.0),
  ('redacao', 0, 1.0)
ON CONFLICT (discipline_id) DO NOTHING;
