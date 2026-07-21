/*
# Create flashcards table for Leitner spaced repetition

## Overview
Creates the `flashcards` table for the reinforcement flashcard system.
Each flashcard stores a question/answer pair for a specific topic, with a
Leitner box (1-5) and next review date. Cards enter the queue automatically
when a topic's moving average mastery drops below 60%.

## New Tables

### flashcards
- id (uuid, PK)
- user_id (uuid, nullable — single-tenant app, no auth)
- disciplina_id (text, not null) — discipline slug
- topico_id (uuid, FK to topics.id ON DELETE CASCADE)
- pergunta (text, not null) — question text
- resposta (text, not null) — answer text
- caixa (integer, 1-5, default 1) — Leitner box
- proxima_revisao (date, not null) — next review date
- created_at (timestamptz, default now)
- updated_at (timestamptz, default now)

## Security
- Single-tenant app (no sign-in). RLS enabled.
- Policies allow anon + authenticated full CRUD (data is intentionally shared).
*/

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  disciplina_id text NOT NULL,
  topico_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  caixa integer NOT NULL DEFAULT 1 CHECK (caixa >= 1 AND caixa <= 5),
  proxima_revisao date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_flashcards ON flashcards;
CREATE POLICY anon_select_flashcards ON flashcards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_flashcards ON flashcards;
CREATE POLICY anon_insert_flashcards ON flashcards FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_flashcards ON flashcards;
CREATE POLICY anon_update_flashcards ON flashcards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_flashcards ON flashcards;
CREATE POLICY anon_delete_flashcards ON flashcards FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_flashcards_topico_id ON flashcards(topico_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_proxima_revisao ON flashcards(proxima_revisao);
CREATE INDEX IF NOT EXISTS idx_flashcards_disciplina_id ON flashcards(disciplina_id);
