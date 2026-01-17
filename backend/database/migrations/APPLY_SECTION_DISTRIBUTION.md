# Section Distribution Migration Guide

## Overview
This migration adds support for section-based question distribution in exams, allowing admins to:
- Automatically distribute questions evenly across sections
- Manually specify how many questions from each section students should answer

## Migration File
- **File:** `add_section_distribution.sql`
- **Date:** 2026-01-13

## How to Apply the Migration

### Option 1: Using psql (Command Line)

```bash
# Connect to your database
psql -U your_username -d uiges_db

# Run the migration
\i backend/database/migrations/add_section_distribution.sql

# Verify the changes
\d exams
```

### Option 2: Using pgAdmin or Database GUI
1. Open pgAdmin or your PostgreSQL GUI tool
2. Connect to your `uiges_db` database
3. Open the SQL query tool
4. Copy and paste the contents of `add_section_distribution.sql`
5. Execute the query

### Option 3: Using Node.js Script

```bash
# From the backend directory
cd backend
node -e "const db = require('./database/db'); const fs = require('fs'); db.query(fs.readFileSync('./database/migrations/add_section_distribution.sql', 'utf8')).then(() => { console.log('Migration applied successfully'); process.exit(0); }).catch(err => { console.error('Migration failed:', err); process.exit(1); });"
```

## Verification

After applying the migration, verify the new columns exist:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'exams' 
    AND column_name IN ('enable_section_distribution', 'section_distribution');
```

Expected output:
```
      column_name         |  data_type | column_default | is_nullable
--------------------------+------------+----------------+-------------
 enable_section_distribution | boolean    | false          | YES
 section_distribution        | jsonb      | NULL           | YES
```

## What This Migration Adds

### New Columns in `exams` table:

1. **`enable_section_distribution`** (BOOLEAN)
   - Default: `false`
   - Enables section-based question distribution for the exam

2. **`section_distribution`** (JSONB)
   - Default: `NULL`
   - Stores the distribution configuration as JSON
   - Example structure:
   ```json
   {
     "Algebra": 8,
     "Geometry": 6,
     "Trigonometry": 5,
     "Calculus": 4,
     "Statistics": 4,
     "Word Problems": 3
   }
   ```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the new columns
ALTER TABLE exams DROP COLUMN IF EXISTS enable_section_distribution;
ALTER TABLE exams DROP COLUMN IF EXISTS section_distribution;
```

## Impact
- **Backward Compatible:** Yes - existing exams will have `enable_section_distribution = false`
- **Data Loss Risk:** None - adds new columns only
- **Requires Restart:** No - changes take effect immediately
- **Frontend Changes:** Already deployed with this migration

## Next Steps

After applying this migration:
1. Restart your backend server (if running)
2. The frontend will automatically start using the new feature
3. Teachers can now enable section-based distribution in the Settings tab when creating/editing exams

## Troubleshooting

### Error: column "enable_section_distribution" already exists
The migration has already been applied. No action needed.

### Error: permission denied
Run the migration as a database superuser or user with ALTER TABLE privileges.

### Error: relation "exams" does not exist
Ensure you're connected to the correct database and the main schema has been applied.

