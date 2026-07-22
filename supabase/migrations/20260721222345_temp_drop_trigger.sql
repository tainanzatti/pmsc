/*
# Temporarily drop handle_new_user trigger to test

## Summary
Dropping the on_auth_user_created trigger temporarily to isolate whether 
the trigger is the cause of the signup 500 error. If signup works without 
the trigger, we know the trigger function has a bug.
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
