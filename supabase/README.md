# Supabase Configuration

This folder contains Supabase-related configuration and database migrations.

## Structure

```
/migrations     - Database migration SQL files
```

## Migrations

### payment_history.sql
Creates the `payment_history` table for tracking DodoPay payment transactions.

**To apply:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `payment_history.sql`
4. Run the SQL

## Notes

- Edge functions have been migrated to `/services` folder
- All image processing now runs client-side via services
- This keeps the codebase simpler and easier to maintain

## Related Documentation

See `/docs/EDGE_FUNCTIONS_MIGRATION.md` for details on the migration from edge functions to services.
