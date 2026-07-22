/*
# Add CPF and Telefone columns to profiles table

## Summary
This migration adds two new columns to the `profiles` table to support expanded
user registration data: `cpf` (Brazilian tax ID) and `telefone` (phone number).

## Changes to existing tables

### profiles
- Added `cpf` column (text, nullable, unique) — stores the user's CPF (Brazilian
  tax identification number). Nullable because existing users won't have one.
  Unique constraint prevents duplicate CPFs across accounts.
- Added `telefone` column (text, nullable) — stores the user's phone number.
  No unique constraint since multiple users could share a household phone.

## Trigger update
- The `handle_new_user()` trigger function is updated to also copy `cpf`,
  `telefone`, and `birth_date` from `raw_user_meta_data` into the profiles row
  it creates automatically on signup. This way the frontend only needs to call
  `supabase.auth.signUp()` with all metadata — the trigger handles profile
  creation in one atomic step.

## Security
- RLS already enabled on profiles; existing policies cover the new columns
  automatically (they are column-agnostic). No new policies needed.
- The unique constraint on `cpf` is enforced at the database level, providing
  a backstop against duplicate CPFs even if frontend validation is bypassed.
*/

-- Add cpf column with unique constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON profiles (cpf) WHERE cpf IS NOT NULL;

-- Add telefone column (no unique constraint — shared phones are valid)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone text;

-- Update the handle_new_user trigger function to include all new fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, apelido, birth_date, cpf, telefone, theme_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Estudante'),
    NEW.email,
    NEW.raw_user_meta_data->>'apelido',
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
    NULLIF(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'theme_preference', 'dark')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
