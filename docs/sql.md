# Sparky Inactive User Notifier: Database Setup

This file contains the SQL commands required to implement the backend infrastructure for the "inactive user notifier" feature. This script should be run in your Supabase SQL Editor.

It accomplishes two main goals:
1.  It adds a `last_active_at` column to the `users` table to track activity.
2.  It creates a trigger to automatically update this timestamp whenever a user performs a credit-consuming action.

## 1. Add `last_active_at` Column to Users Table

This command alters the `users` table to add a new timestamp column. We set a default value of `NOW()` to ensure all existing users get a valid timestamp, preventing them from being immediately notified upon deployment.

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
```

## 2. Create an Automatic Activity Update Trigger

To keep the `last_active_at` timestamp current, we'll create a function and a trigger. The trigger will automatically call the function every time a new row is inserted into the `credit_usage` table (which happens whenever a user generates an image or runs an analysis). This keeps user activity tracking entirely on the server-side, making it secure and reliable.

### Step 2.1: Create the Trigger Function

This function contains the logic to update the `users` table.

```sql
CREATE OR REPLACE FUNCTION public.update_last_active_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET last_active_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;
```

### Step 2.2: Create the Trigger

This trigger will fire the function after every `INSERT` on `credit_usage`.

```sql
-- Drop the trigger if it already exists to ensure we can re-run this script
DROP TRIGGER IF EXISTS on_credit_usage_update_user_activity ON public.credit_usage;

-- Create the trigger
CREATE TRIGGER on_credit_usage_update_user_activity
  AFTER INSERT ON public.credit_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_active_at();
```

After running these commands, your database will be fully equipped to track user activity, allowing the `inactive-user-notifier` Edge Function to work correctly.