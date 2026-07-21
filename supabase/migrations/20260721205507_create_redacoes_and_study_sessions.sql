/*
# Create redacoes and study_sessions tables

## Overview
Creates two new tables:
1. `redacoes` — stores essay submissions with AI-generated themes and corrections
2. `study_sessions` — tracks study time per discipline for daily/total hour calculations

## New Tables

### redacoes
- id (uuid, PK)
- user_id (uuid, nullable — single-tenant)
- tema (text, not null) — AI-generated essay theme
- texto (text, not null) — the student's essay text
- nota (real, nullable) — score 0-10 from AI correction
- feedback_json (jsonb, nullable) — structured feedback per criterion
- criado_em (timestamptz, default now)

### study_sessions
- id (uuid, PK)
- user_id (uuid, nullable)
- discipline_id (text, not null) — discipline slug
- topic_id (uuid, nullable, FK to topics.id)
- duration_minutes (integer, not null) — minutes studied
- session_date (date, not null, default CURRENT_DATE)
- created_at (timestamptz, default now)

## Security
- Single-tenant app (no sign-in). RLS enabled on both tables.
- Policies allow anon + authenticated full CRUD.
*/

-- Redacoes table
CREATE TABLE IF NOT EXISTS redacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  tema text NOT NULL,
  texto text NOT NULL,
  nota real CHECK (nota >= 0 AND nota <= 10),
  feedback_json jsonb,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE redacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_redacoes ON redacoes;
CREATE POLICY anon_select_redacoes ON redacoes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_redacoes ON redacoes;
CREATE POLICY anon_insert_redacoes ON redacoes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_redacoes ON redacoes;
CREATE POLICY anon_update_redacoes ON redacoes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_redacoes ON redacoes;
CREATE POLICY anon_delete_redacoes ON redacoes FOR DELETE
  TO anon, authenticated USING (true);

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  discipline_id text NOT NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_study_sessions ON study_sessions;
CREATE POLICY anon_select_study_sessions ON study_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_study_sessions ON study_sessions;
CREATE POLICY anon_insert_study_sessions ON study_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_study_sessions ON study_sessions;
CREATE POLICY anon_update_study_sessions ON study_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_study_sessions ON study_sessions;
CREATE POLICY anon_delete_study_sessions ON study_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_redacoes_criado_em ON redacoes(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_session_date ON study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_discipline_id ON study_sessions(discipline_id);

-- Seed some study sessions for the painel to have data
INSERT INTO study_sessions (discipline_id, duration_minutes, session_date) VALUES
  ('portugues', 45, CURRENT_DATE),
  ('matematica', 30, CURRENT_DATE),
  ('portugues', 60, CURRENT_DATE - interval '1 day'),
  ('historia-sc', 40, CURRENT_DATE - interval '1 day'),
  ('matematica', 50, CURRENT_DATE - interval '2 days'),
  ('legislacao', 35, CURRENT_DATE - interval '2 days'),
  ('portugues', 55, CURRENT_DATE - interval '3 days'),
  ('geografia-sc', 30, CURRENT_DATE - interval '3 days'),
  ('informatica', 25, CURRENT_DATE - interval '4 days'),
  ('raciocinio-logico', 40, CURRENT_DATE - interval '4 days'),
  ('portugues', 45, CURRENT_DATE - interval '5 days'),
  ('atualidades', 20, CURRENT_DATE - interval '5 days')
ON CONFLICT DO NOTHING;
