# Database Migrations

This directory contains SQL migration files for the C-COS database.

## Running Migrations

### All Migrations
To run all migrations, execute them in order:

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run each migration file (in order)
\i add_profile_picture.sql
\i add_multi_answer_support.sql
\i add_unique_student_id.sql
\i update_student_id_per_exam.sql
```

### Individual Migration
To run a specific migration:

```bash
psql -U your_username -d your_database_name -f add_profile_picture.sql
```

## Available Migrations

### add_unique_student_id.sql ⭐ NEW
**Date**: January 2026
**Description**: Implements Student ID-based authentication for candidates instead of email-based login. Makes student_id unique and required for all candidates.

**Changes**:
- Creates unique index on `student_id` for candidates only
- Adds check constraint ensuring candidates have non-empty `student_id`
- Auto-generates student IDs for existing candidates (format: STU000001, STU000002, etc.)

**How to apply**:
```bash
# Option 1: Direct SQL
psql -U postgres -d ui_ges_db -f add_unique_student_id.sql

# Option 2: Node.js script (recommended - provides better feedback)
node apply-student-id-migration.js
```

**To verify**:
```sql
-- Check that all candidates have unique student IDs
SELECT student_id, name, email FROM users WHERE role = 'candidate' ORDER BY student_id;

-- Verify constraints exist
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_name = 'chk_candidate_student_id';
```

**Important**: After applying this migration:
- Students must login with their Student ID instead of email
- Update mobile app and clear cache
- Share Student IDs with all candidates
- See `APPLY_STUDENT_ID_MIGRATION.md` and `STUDENT_ID_LOGIN_IMPLEMENTATION.md` in root directory

### update_student_id_per_exam.sql ⭐ UPDATED
**Date**: January 2026
**Description**: Updates Student ID constraints to be unique per-exam (not system-wide). Allows same student to take multiple different exams.

**Changes**:
- Removes system-wide unique constraint on `student_id`
- Removes check constraint requiring all candidates to have `student_id`
- Creates non-unique index for fast lookups
- Exam-level uniqueness enforced in application logic

**How to apply**:
```bash
# Option 1: Direct SQL
psql -U postgres -d ui_ges_db -f update_student_id_per_exam.sql

# Option 2: Node.js script (recommended - provides better feedback)
node apply-student-id-per-exam.js
```

**To verify**:
```sql
-- Verify same student can be in multiple exams
SELECT u.student_id, u.name, e.title as exam_title
FROM exam_candidates ec
JOIN users u ON ec.candidate_id = u.id
JOIN exams e ON ec.exam_id = e.id
WHERE u.student_id = 'STU001'
ORDER BY e.title;
-- Should show student in multiple exams if applicable

-- Verify no duplicate assignments to same exam
SELECT ec.exam_id, e.title, u.student_id, COUNT(*) as times
FROM exam_candidates ec
JOIN users u ON ec.candidate_id = u.id
JOIN exams e ON ec.exam_id = e.id
GROUP BY ec.exam_id, e.title, u.student_id
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

**Key Change**: 
- ✅ Student `STU001` can be in "Math Exam"
- ✅ Student `STU001` can be in "English Exam"
- ❌ Student `STU001` cannot be in "Math Exam" twice

**Documentation**: See `STUDENT_ID_PER_EXAM_UPDATE.md` in root directory

### add_multi_answer_support.sql
**Date**: December 2024
**Description**: Enables questions to have multiple correct answers with checkbox support instead of radio buttons.

**Changes**:
- Adds `is_multi_answer BOOLEAN` column to `questions` table
- Modifies `correct_answer` in `questions` to support comma-separated values (e.g., "A,B,D")
- Modifies `answer` in `exam_answers` to support multiple selections
- Modifies `shuffled_correct_answer` in `exam_questions` for multi-answer shuffling
- Updates constraints to validate comma-separated answer format
- Creates index on `is_multi_answer` for performance

**To verify**:
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name IN ('correct_answer', 'is_multi_answer');
```

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

