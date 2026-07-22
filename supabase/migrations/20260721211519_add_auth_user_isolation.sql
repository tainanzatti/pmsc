/*
# Add multi-user auth: profiles table + user_id columns + RLS overhaul

## Overview
Converts the app from single-tenant to multi-user with per-user data isolation.
Adds profiles table, user_id columns to all data tables, rewrites RLS to
authenticated-only with auth.uid() ownership. Handles existing data by
backfilling user_id to a placeholder then setting NOT NULL.

## New Tables
### profiles
- id (uuid PK FK auth.users ON DELETE CASCADE)
- full_name, apelido, email, birth_date, theme_preference, created_at

## Modified Tables
- lancamentos: + user_id NOT NULL DEFAULT auth.uid()
- discipline_skip_state: + user_id, PK → (user_id, discipline_id)
- flashcards: user_id → NOT NULL DEFAULT auth.uid()
- ai_material: + user_id, unique idx → (user_id, kind, topic_id)
- redacoes: user_id → NOT NULL DEFAULT auth.uid()
- study_sessions: user_id → NOT NULL DEFAULT auth.uid()

## Security
All policies rewritten to authenticated-only with auth.uid() = user_id.
topics stays shared (official curriculum).
*/

-- =========================================================================
-- profiles table
-- =========================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  apelido text,
  email text NOT NULL,
  birth_date date,
  theme_preference text NOT NULL DEFAULT 'dark',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- =========================================================================
-- Helper: safely add user_id column to a table
-- =========================================================================

-- lancamentos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'user_id') THEN
    ALTER TABLE lancamentos ADD COLUMN user_id uuid;
    UPDATE lancamentos SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
    ALTER TABLE lancamentos ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE lancamentos ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- discipline_skip_state
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_skip_state' AND column_name = 'user_id') THEN
    ALTER TABLE discipline_skip_state ADD COLUMN user_id uuid;
    UPDATE discipline_skip_state SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
    ALTER TABLE discipline_skip_state ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE discipline_skip_state ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- Change PK from (discipline_id) to (user_id, discipline_id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'discipline_skip_state_pkey' AND table_name = 'discipline_skip_state') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'discipline_skip_state_pkey' AND column_name = 'user_id') THEN
      ALTER TABLE discipline_skip_state DROP CONSTRAINT discipline_skip_state_pkey;
      ALTER TABLE discipline_skip_state ADD PRIMARY KEY (user_id, discipline_id);
    END IF;
  END IF;
END $$;

-- flashcards
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'user_id') THEN
    ALTER TABLE flashcards ADD COLUMN user_id uuid;
  END IF;
END $$;
UPDATE flashcards SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'user_id' AND is_nullable = 'YES') THEN
    ALTER TABLE flashcards ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE flashcards ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- ai_material
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_material' AND column_name = 'user_id') THEN
    ALTER TABLE ai_material ADD COLUMN user_id uuid;
    UPDATE ai_material SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
    ALTER TABLE ai_material ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE ai_material ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- redacoes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redacoes' AND column_name = 'user_id') THEN
    ALTER TABLE redacoes ADD COLUMN user_id uuid;
  END IF;
END $$;
UPDATE redacoes SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redacoes' AND column_name = 'user_id' AND is_nullable = 'YES') THEN
    ALTER TABLE redacoes ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE redacoes ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- study_sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_sessions' AND column_name = 'user_id') THEN
    ALTER TABLE study_sessions ADD COLUMN user_id uuid;
  END IF;
END $$;
UPDATE study_sessions SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'study_sessions' AND column_name = 'user_id' AND is_nullable = 'YES') THEN
    ALTER TABLE study_sessions ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE study_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- =========================================================================
-- Unique index for ai_material with user_id
-- =========================================================================

DROP INDEX IF EXISTS idx_ai_material_kind_topic;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_material_user_kind_topic ON ai_material(user_id, kind, topic_id);

-- =========================================================================
-- RLS: lancamentos
-- =========================================================================

DROP POLICY IF EXISTS "anon_select_lancamentos" ON lancamentos;
DROP POLICY IF EXISTS "anon_insert_lancamentos" ON lancamentos;
DROP POLICY IF EXISTS "anon_update_lancamentos" ON lancamentos;
DROP POLICY IF EXISTS "anon_delete_lancamentos" ON lancamentos;

DROP POLICY IF EXISTS "select_own_lancamentos" ON lancamentos;
CREATE POLICY "select_own_lancamentos" ON lancamentos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_lancamentos" ON lancamentos;
CREATE POLICY "insert_own_lancamentos" ON lancamentos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_lancamentos" ON lancamentos;
CREATE POLICY "update_own_lancamentos" ON lancamentos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_lancamentos" ON lancamentos;
CREATE POLICY "delete_own_lancamentos" ON lancamentos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON lancamentos(user_id);

-- =========================================================================
-- RLS: discipline_skip_state
-- =========================================================================

DROP POLICY IF EXISTS "anon_select_discipline_skip_state" ON discipline_skip_state;
DROP POLICY IF EXISTS "anon_insert_discipline_skip_state" ON discipline_skip_state;
DROP POLICY IF EXISTS "anon_update_discipline_skip_state" ON discipline_skip_state;
DROP POLICY IF EXISTS "anon_delete_discipline_skip_state" ON discipline_skip_state;

DROP POLICY IF EXISTS "select_own_skip_state" ON discipline_skip_state;
CREATE POLICY "select_own_skip_state" ON discipline_skip_state FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_skip_state" ON discipline_skip_state;
CREATE POLICY "insert_own_skip_state" ON discipline_skip_state FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_skip_state" ON discipline_skip_state;
CREATE POLICY "update_own_skip_state" ON discipline_skip_state FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_skip_state" ON discipline_skip_state;
CREATE POLICY "delete_own_skip_state" ON discipline_skip_state FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_discipline_skip_state_user_id ON discipline_skip_state(user_id);

-- =========================================================================
-- RLS: flashcards
-- =========================================================================

DROP POLICY IF EXISTS "anon_select_flashcards" ON flashcards;
DROP POLICY IF EXISTS "anon_insert_flashcards" ON flashcards;
DROP POLICY IF EXISTS "anon_update_flashcards" ON flashcards;
DROP POLICY IF EXISTS "anon_delete_flashcards" ON flashcards;

DROP POLICY IF EXISTS "select_own_flashcards" ON flashcards;
CREATE POLICY "select_own_flashcards" ON flashcards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_flashcards" ON flashcards;
CREATE POLICY "insert_own_flashcards" ON flashcards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_flashcards" ON flashcards;
CREATE POLICY "update_own_flashcards" ON flashcards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_flashcards" ON flashcards;
CREATE POLICY "delete_own_flashcards" ON flashcards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);

-- =========================================================================
-- RLS: ai_material
-- =========================================================================

DROP POLICY IF EXISTS "anon_select_ai_material" ON ai_material;
DROP POLICY IF EXISTS "anon_insert_ai_material" ON ai_material;
DROP POLICY IF EXISTS "anon_update_ai_material" ON ai_material;
DROP POLICY IF EXISTS "anon_delete_ai_material" ON ai_material;

DROP POLICY IF EXISTS "select_own_ai_material" ON ai_material;
CREATE POLICY "select_own_ai_material" ON ai_material FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_material" ON ai_material;
CREATE POLICY "insert_own_ai_material" ON ai_material FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_material" ON ai_material;
CREATE POLICY "update_own_ai_material" ON ai_material FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_material" ON ai_material;
CREATE POLICY "delete_own_ai_material" ON ai_material FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_material_user_id ON ai_material(user_id);

-- =========================================================================
-- RLS: redacoes
-- =========================================================================

DROP POLICY IF EXISTS "anon_select_redacoes" ON redacoes;
DROP POLICY IF EXISTS "anon_insert_redacoes" ON redacoes;
DROP POLICY IF EXISTS "anon_update_redacoes" ON redacoes;
DROP POLICY IF EXISTS "anon_delete_redacoes" ON redacoes;

DROP POLICY IF EXISTS "select_own_redacoes" ON redacoes;
CREATE POLICY "select_own_redacoes" ON redacoes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_redacoes" ON redacoes;
CREATE POLICY "insert_own_redacoes" ON redacoes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_redacoes" ON redacoes;
CREATE POLICY "update_own_redacoes" ON redacoes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_redacoes" ON redacoes;
CREATE POLICY "delete_own_redacoes" ON redacoes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_redacoes_user_id ON redacoes(user_id);

-- =========================================================================
-- RLS: study_sessions
-- =========================================================================

DROP POLICY IF EXISTS "anon_select_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "anon_insert_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "anon_update_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "anon_delete_study_sessions" ON study_sessions;

DROP POLICY IF EXISTS "select_own_study_sessions" ON study_sessions;
CREATE POLICY "select_own_study_sessions" ON study_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_study_sessions" ON study_sessions;
CREATE POLICY "insert_own_study_sessions" ON study_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_study_sessions" ON study_sessions;
CREATE POLICY "update_own_study_sessions" ON study_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_study_sessions" ON study_sessions;
CREATE POLICY "delete_own_study_sessions" ON study_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);

-- =========================================================================
-- Trigger: auto-create profile on signup
-- =========================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Estudante'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
