# 🚨 IMPORTANT: Run This Database Migration

## Option Randomization Feature Requires Database Update

To enable the option randomization feature, you need to add a column to the `exam_questions` table.

## Migration SQL

Run this SQL command on your PostgreSQL database:

```sql
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS shuffled_correct_answer VARCHAR(1);

COMMENT ON COLUMN exam_questions.shuffled_correct_answer IS 'Stores the correct answer letter (A/B/C/D) after option randomization. NULL if options were not shuffled for this candidate.';
```

## How to Run

### Option 1: Using psql (Command Line)
```bash
psql -U postgres -d uiges_db -c "ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS shuffled_correct_answer VARCHAR(1);"
```

### Option 2: Using pgAdmin
1. Open pgAdmin
2. Connect to your database (`uiges_db`)
3. Open Query Tool
4. Paste the SQL above
5. Click Execute (F5)

### Option 3: Using the migration file
```bash
cd backend/database/migrations
psql -U postgres -d uiges_db -f add_shuffled_correct_answer.sql
```

## Verify Migration

Check if the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exam_questions' 
AND column_name = 'shuffled_correct_answer';
```

**Expected output:**
```
     column_name          | data_type 
--------------------------+-----------
 shuffled_correct_answer  | character varying
```

## What This Does

- **Allows per-candidate option shuffling** - Each candidate can see options in different order
- **Maintains correct validation** - Answers are validated against the shuffled version
- **Backwards compatible** - Uses `COALESCE` to fall back to original if NULL

## After Migration

1. **Restart backend server** (if running)
2. **Test the feature:**
   - Create an exam
   - Enable "Randomize Options"
   - Start exam as candidate
   - Options should be in random order
   - Answering should validate correctly

## Troubleshooting

### Error: "column already exists"
This is fine! The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

### Error: "permission denied"
Make sure you're connected as a user with ALTER TABLE permissions (e.g., postgres user).

### Backend shows error about column
Make sure:
1. Migration ran successfully
2. Backend server was restarted after migration
3. Database connection is to the correct database

## Rollback (if needed)

To remove the column:

```sql
ALTER TABLE exam_questions 
DROP COLUMN IF EXISTS shuffled_correct_answer;
```

**Warning:** This will prevent option randomization from working correctly!

