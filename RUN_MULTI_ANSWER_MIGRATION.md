# Quick Start: Enable Multi-Answer Questions

## Step 1: Run the Database Migration

```bash
# Navigate to your backend directory
cd backend

# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run the migration file
\i database/migrations/add_multi_answer_support.sql
```

**Expected Output:**
```
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
...
CREATE INDEX
COMMENT
COMMENT
...
```

## Step 2: Verify the Migration

```sql
-- Check the questions table columns
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name IN ('correct_answer', 'is_multi_answer');
```

**Expected Result:**
```
    column_name    |     data_type     | character_maximum_length | is_nullable
-------------------+-------------------+--------------------------+-------------
 correct_answer    | character varying | 10                       | NO
 is_multi_answer   | boolean           |                          | YES
```

## Step 3: Restart Your Backend Server

```bash
# Stop the backend if running
# Then restart it
cd backend
npm start
```

## Step 4: Test the Feature

### A. Create a Multi-Answer Question

1. Log in as a teacher
2. Go to Question Bank
3. Click "Add New Question"
4. Fill in question details
5. **Check** "Multiple correct answers (use checkboxes)"
6. Select multiple correct options (e.g., A, B, D)
7. Click "Add Question"

### B. Test in Mobile App

1. Log in as a candidate
2. Start an exam with the multi-answer question
3. You should see **checkboxes** instead of radio buttons
4. Select multiple options
5. Submit the exam

### C. Verify Results

1. Check the results as teacher
2. Ensure multi-answer questions are graded correctly

## Example Question to Test With

**Question:** Which of the following are prime numbers?
- A: 2 ✓
- B: 4
- C: 7 ✓
- D: 9

**Correct Answer:** A,C (system stores as comma-separated)

## CSV Import Format

The updated question template includes the new field:

```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,points,is_multi_answer
What is 2+2?,3,4,5,6,B,1,false
Select all prime numbers,2,4,7,9,A,C,2,true
```

Download the template from the Create Exam page to get started!

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove the multi-answer columns
ALTER TABLE questions DROP COLUMN IF EXISTS is_multi_answer;

-- Restore original constraints (for new installations only)
-- WARNING: This will fail if you have multi-answer questions!
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;
ALTER TABLE questions ALTER COLUMN correct_answer TYPE VARCHAR(1);
ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_check 
  CHECK (correct_answer IN ('A', 'B', 'C', 'D'));
```

**⚠️ Warning:** Rollback will break any existing multi-answer questions!

## Troubleshooting

### Migration Error: "column already exists"

**Solution:** The migration has already been run. Check:
```sql
SELECT * FROM questions LIMIT 1;
```

If you see `is_multi_answer` column, you're good to go!

### Migration Error: "constraint already exists"

**Solution:** Drop the old constraint first:
```sql
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;
```

Then re-run the specific constraint creation from the migration file.

### Backend Error: "invalid input syntax"

**Solution:** Make sure your backend code has been updated. Pull the latest changes:
```bash
git pull origin main
cd backend
npm install
npm start
```

## That's It!

You can now create questions with multiple correct answers! 🎉

For detailed documentation, see `MULTI_ANSWER_FEATURE.md`

