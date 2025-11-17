-- Fix for 403 error when creating user profiles
-- The users table was missing an INSERT policy, preventing authenticated users from creating their profiles

-- Add INSERT policy to allow users to create their own profile
CREATE POLICY "Users can insert their own profile." 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Verify all policies are in place
-- Expected policies:
-- 1. "Users can view their own profile." - SELECT
-- 2. "Users can update their own profile." - UPDATE  
-- 3. "Users can insert their own profile." - INSERT (NEW)
