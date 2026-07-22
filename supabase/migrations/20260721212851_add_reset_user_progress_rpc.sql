/*
# Add reset_user_progress RPC function

1. Purpose
   Creates a PostgreSQL function `reset_user_progress()` that deletes ALL study-related
   data for the currently authenticated user while preserving their account and profile.

2. What gets deleted (all scoped to the current user via auth.uid()):
   - `lancamentos` — mastery entries / topic progress
   - `study_sessions` — study time logs and session history
   - `flashcards` — Leitner flashcards and review state
   - `redacoes` — essays and AI corrections
   - `discipline_skip_state` — skip counts and urgency multipliers
   - `ai_material` — cached AI content (summaries, questions, flashcards, essay themes/corrections)

3. What is PRESERVED:
   - `auth.users` — login, email, password
   - `profiles` — full_name, apelido, email, birth_date, theme_preference, created_at
   - `topics` — shared curriculum topics (not user-scoped)

4. Security
   - Function runs with `SECURITY DEFINER` so it can delete rows even though
     the client only has the anon key.
   - All deletes are scoped to `auth.uid()` — no user can affect another user's data.
   - The function is exposed via the `public` schema and callable with the
     Supabase JS client's `.rpc()` method.
   - `search_path` is set to `public` to prevent schema injection.
*/

CREATE OR REPLACE FUNCTION public.reset_user_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM lancamentos WHERE user_id = auth.uid();
  DELETE FROM study_sessions WHERE user_id = auth.uid();
  DELETE FROM flashcards WHERE user_id = auth.uid();
  DELETE FROM redacoes WHERE user_id = auth.uid();
  DELETE FROM discipline_skip_state WHERE user_id = auth.uid();
  DELETE FROM ai_material WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_user_progress() TO authenticated;
