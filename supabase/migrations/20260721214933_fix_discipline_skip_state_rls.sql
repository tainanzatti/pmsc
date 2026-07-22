/*
# Fix discipline_skip_state RLS policies

The `discipline_skip_state` table has both anon policies (with `true` qual)
and authenticated policies (with `auth.uid() = user_id` qual). The anon policies
allow any client to read/modify any user's skip state data, which is a security
vulnerability. This migration drops the anon policies and keeps only the
authenticated, user-scoped policies.
*/

DROP POLICY IF EXISTS "anon_select_skip_state" ON discipline_skip_state;
DROP POLICY IF EXISTS "anon_insert_skip_state" ON discipline_skip_state;
DROP POLICY IF EXISTS "anon_update_skip_state" ON discipline_skip_state;
DROP POLICY IF EXISTS "anon_delete_skip_state" ON discipline_skip_state;
