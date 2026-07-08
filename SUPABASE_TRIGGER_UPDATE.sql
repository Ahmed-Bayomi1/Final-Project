-- ============================================================================
-- CORRECTED POSTGRES TRIGGER FOR USER PROFILE CREATION
-- ============================================================================
-- Run this in Supabase SQL Editor to replace the existing trigger
-- Path: Supabase Dashboard → Your Project → SQL Editor → New Query

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    national_id,
    phone_number,
    date_of_birth,
    address,
    role,
    email,
    is_verified
  )
  VALUES (
    new.id,
    COALESCE(new.user_metadata->>'full_name', ''),
    COALESCE(new.user_metadata->>'national_id', ''),
    COALESCE(new.user_metadata->>'phone_number', ''),
    COALESCE(
      new.user_metadata->>'date_of_birth',
      CURRENT_DATE - INTERVAL '30 years'  -- Safe default if not provided
    )::DATE,
    COALESCE(new.user_metadata->>'address', ''),
    -- Validate and map role; defaults to 'user' if invalid
    CASE WHEN COALESCE(new.user_metadata->>'role', '') IN ('user', 'pharmacy_staff', 'admin')
      THEN COALESCE(new.user_metadata->>'role', 'user')
      ELSE 'user'
    END,
    new.email,
    FALSE
  );
  RETURN new;
EXCEPTION WHEN others THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFY THE TRIGGER
-- ============================================================================
-- Query to test the trigger is working (run after a test signup):
-- SELECT id, full_name, national_id, phone_number, role FROM public.profiles WHERE email = 'test@example.com';

-- ============================================================================
-- IMPORTANT: CHECK CONSTRAINT DEFINITION
-- ============================================================================
-- Verify this constraint exists on your profiles table:
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
--   CHECK (role IN ('user', 'pharmacy_staff', 'admin'));

-- Query to verify:
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name='profiles' AND constraint_type='CHECK';
