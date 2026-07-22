/*
# Fix trigger function search_path

## Summary
The `handle_new_user` trigger function is SECURITY DEFINER but lacks an 
explicit `search_path`. In Supabase/PostgreSQL, SECURITY DEFINER functions 
should always set `search_path` to prevent security issues and ensure 
unqualified table names resolve correctly. Without it, the function may 
fail if the search_path at trigger execution time doesn't include `public`.

## Fix
- Recreate `handle_new_user()` with `SET search_path = public` 
- Re-create the trigger
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  bd text;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  bd := meta->>'birth_date';
  
  INSERT INTO profiles (id, full_name, email, apelido, birth_date, cpf, telefone, theme_preference)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(meta->>'full_name', ''), 'Estudante'),
    NEW.email,
    NULLIF(meta->>'apelido', ''),
    CASE WHEN bd IS NOT NULL AND bd != '' THEN bd::date ELSE NULL END,
    NULLIF(meta->>'cpf', ''),
    NULLIF(meta->>'telefone', ''),
    COALESCE(NULLIF(meta->>'theme_preference', ''), 'dark')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
