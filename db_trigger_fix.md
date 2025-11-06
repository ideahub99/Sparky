# Database Trigger for Automatic Credit Deduction

To ensure data integrity and prevent race conditions, the process of deducting credits from a user's account should not be handled by the client-side application. Instead, we will use a **PostgreSQL trigger function** that runs automatically on the server after a new entry is inserted into the `credit_usage` table.

This is a more secure, reliable, and transactional approach.

## 1. Create the Trigger Function

First, we need to create a function that contains the logic to update the `users` table. This function will be executed by the trigger.

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.handle_credit_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user has enough credits before decrementing
  IF (SELECT credits FROM public.users WHERE id = NEW.user_id) >= NEW.credits_used THEN
    UPDATE public.users
    SET credits = credits - NEW.credits_used
    WHERE id = NEW.user_id;
  ELSE
    -- Optional: Raise an exception if credits are insufficient.
    -- This provides a server-side safeguard.
    RAISE EXCEPTION 'Insufficient credits for user %', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;
```

## 2. Create the Trigger

Next, we create the trigger that will fire the `handle_credit_deduction()` function every time a new row is added to the `credit_usage` table.

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the trigger if it already exists to ensure we can re-run this script
DROP TRIGGER IF EXISTS on_credit_usage_insert ON public.credit_usage;

-- Create the trigger
CREATE TRIGGER on_credit_usage_insert
AFTER INSERT ON public.credit_usage
FOR EACH ROW
EXECUTE FUNCTION public.handle_credit_deduction();
```

## 3. Client-Side Code Change

After implementing this trigger, you **must remove** the manual credit deduction logic from the client-side code in `pages/EditorPage.tsx`.

**Find and delete** the following block of code from the `handleGenerate` function:

```typescript
// DELETE THIS BLOCK
await supabase
  .from('users')
  .update({ credits: user.credits - 1 })
  .eq('id', user.id);
```

The client's only responsibility now is to insert a record into `credit_usage`, and the database will handle the rest atomically. This completes the fix.