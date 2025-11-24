# Database Migrations

This directory contains SQL migration files for the UI-GES database.

## Running Migrations

### All Migrations
To run all migrations, execute them in order:

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run each migration file
\i add_profile_picture.sql
```

### Individual Migration
To run a specific migration:

```bash
psql -U your_username -d your_database_name -f add_profile_picture.sql
```

## Available Migrations

### add_profile_picture.sql
**Date**: November 2024
**Description**: Adds profile_picture column to users table for storing user profile images.

**Changes**:
- Adds `profile_picture VARCHAR(500)` column to `users` table
- Creates index on `profile_picture` for faster lookups
- Safe to run multiple times (uses `IF NOT EXISTS`)

**To verify**:
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'profile_picture';
```

## Migration Best Practices

1. **Always backup before running migrations**:
   ```bash
   pg_dump -U your_username your_database_name > backup_before_migration.sql
   ```

2. **Test in development first**:
   - Run migration on development database
   - Test application functionality
   - Only then run on production

3. **Check existing data**:
   ```sql
   SELECT COUNT(*) FROM users;
   ```

4. **Verify after migration**:
   ```sql
   \d users
   ```

## Rollback

To rollback the profile_picture migration:

```sql
-- Remove the column
ALTER TABLE users DROP COLUMN IF EXISTS profile_picture;

-- Remove the index
DROP INDEX IF EXISTS idx_users_profile_picture;
```

**⚠️ Warning**: Rollback will delete all profile pictures data. Make sure to backup first!

## Creating New Migrations

When creating new migrations:

1. Use descriptive filenames: `add_{feature}_to_{table}.sql`
2. Include date or version number for ordering
3. Use `IF EXISTS` / `IF NOT EXISTS` for safety
4. Document the changes in this README
5. Test thoroughly in development

Example template:
```sql
-- Migration: Add new_feature
-- Date: YYYY-MM-DD
-- Description: What this migration does

-- Make changes
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column TYPE;

-- Create indexes if needed
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(new_column);

-- Add comments for documentation
COMMENT ON COLUMN table_name.new_column IS 'Description of the column';
```

