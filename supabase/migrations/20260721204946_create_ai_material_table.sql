/*
# Create ai_material table for AI content caching

## Overview
Creates the `ai_material` table to cache AI-generated study material
(resumos, questões, flashcards) per topic, avoiding regeneration.

## New Tables

### ai_material
- id (uuid, PK)
- kind (text, not null) — 'leiseca' | 'resumo' | 'questoes' | 'flashcards'
- topic_id (uuid, FK to topics.id ON DELETE CASCADE)
- discipline_id (text, not null)
- content (text, not null) — JSON or text content
- created_at (timestamptz, default now)

## Security
- Single-tenant app (no sign-in). RLS enabled.
- Policies allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS ai_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  discipline_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_material ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_ai_material ON ai_material;
CREATE POLICY anon_select_ai_material ON ai_material FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_ai_material ON ai_material;
CREATE POLICY anon_insert_ai_material ON ai_material FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_ai_material ON ai_material;
CREATE POLICY anon_update_ai_material ON ai_material FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_ai_material ON ai_material;
CREATE POLICY anon_delete_ai_material ON ai_material FOR DELETE
  TO anon, authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_material_kind_topic ON ai_material(kind, topic_id);
CREATE INDEX IF NOT EXISTS idx_ai_material_topic_id ON ai_material(topic_id);
