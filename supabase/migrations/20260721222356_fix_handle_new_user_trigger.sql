/*
# Fix handle_new_user trigger function

## Summary
The previous trigger function was causing a 500 error on signup because it 
didn't handle the case where `raw_user_meta_data` is NULL or missing keys. 
When Supabase creates a user without metadata options, `raw_user_meta_data` 
can be NULL, and the `->>` operator on NULL returns NULL, but the `NULLIF(..., '')::date` 
cast was failing on certain edge cases.

## Fix
- Use `COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)` to handle NULL metadata
- Wrap each field extraction safely with COALESCE for text fields
- Use a separate variable for birth_date to handle the date cast safely
- Re-create the trigger on auth.users

## Security
- SECURITY DEFINER, owned by postgres (bypassrls) — same as before
- No RLS changes needed
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
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

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
