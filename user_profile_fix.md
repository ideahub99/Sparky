# User Profile and Authentication Fix

## Problems Identified

### 1. "User profile not found" Error
After registration and login, users were receiving the error: **"Login failed: User profile not found. Please contact support."**

**Root Cause**: The user profile in the `users` table was not being created automatically when users signed up. This should have been handled by the database trigger `handle_new_user()`, but in cases where:
- The trigger wasn't set up
- The trigger failed silently
- There was a timing issue
...the profile wouldn't exist, preventing users from logging in.

### 2. 406 Not Acceptable Error
The login flow was using `.single()` which sends the `application/vnd.pgrst.object+json` Accept header. When no profile exists, this causes a 406 error instead of gracefully handling the missing profile.

### 3. Auto-routing After Verification
The user mentioned that after entering the 6-digit code, the page didn't auto-route to home. However, this functionality was already implemented (lines 292-294 in the original code).

## Solutions Implemented

### 1. Fixed Login Flow (lines 85-137 in AuthPages.tsx)

**Changed from**:
- Using `.single()` which throws errors if no record exists
- Immediately signing out the user if profile check fails

**Changed to**:
- Using `.maybeSingle()` to avoid 406 errors
- Checking if profile exists
- **If profile doesn't exist**: Automatically create it with default values
- **If creation fails**: Show error and sign out
- **If profile exists or was created**: Continue with login

This makes the login flow more resilient and handles edge cases where the database trigger might not have fired.

### 2. Enhanced Signup Verification Flow (lines 233-295 in AuthPages.tsx)

**Added**:
- After successful OTP verification, check if user profile exists
- If profile doesn't exist, create it immediately with:
  - User ID from the session
  - Username from metadata or email
  - Default plan (Free plan, ID: 1)
  - Default credits (10)

This ensures that even if the database trigger fails, the user profile is created during the signup flow, preventing login issues.

### 3. Robust User Profile Creation Logic

Both login and signup now create the profile with the same logic:
```typescript
{
    id: userId,
    username: username || email.split('@')[0] || 'User',
    plan_id: 1,  // Free plan
    credits: 10  // Starting credits
}
```

## How It Works Now

### Signup Flow:
1. User signs up with email, password, and name
2. User receives 6-digit OTP code via email
3. User enters the code
4. OTP is verified and session is created
5. **NEW**: App checks if profile exists in `users` table
6. **NEW**: If not, creates the profile automatically
7. User is redirected to home page after 800ms (auto-routing)

### Login Flow:
1. User enters email and password
2. Authentication succeeds
3. **NEW**: App checks if profile exists using `.maybeSingle()` (no 406 error)
4. **NEW**: If profile doesn't exist, creates it automatically
5. If creation fails, shows error and signs out
6. If successful, user is logged in

## Critical: Row Level Security Policy

**IMPORTANT**: You must add an INSERT policy to the `users` table for the app to work. Run this SQL in your Supabase SQL Editor:

```sql
CREATE POLICY "Users can insert their own profile." 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);
```

Without this policy, authenticated users get a **403 Forbidden** error when trying to create their profile, causing the "Failed to create user profile" error.

## Database Trigger (Recommended)

While the app now handles profile creation in code, it's still recommended to set up the database trigger as documented in `db_setup.md` (lines 326-349). This provides an additional safety layer:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Testing Checklist

- [x] Build succeeds without errors
- [ ] New user can sign up and verify OTP
- [ ] User is auto-routed to home after verification
- [ ] New user can log in successfully
- [ ] Existing user can log in successfully
- [ ] User profile is created even if database trigger is missing
- [ ] No 406 errors during login
- [ ] Appropriate error messages show if profile creation fails

## Files Modified

- `/workspaces/Sparky/pages/AuthPages.tsx`
  - `handleLogin()` function (lines 85-137)
  - `handleVerify()` function in VerificationCodeScreen (lines 233-295)
