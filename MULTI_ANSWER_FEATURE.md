# Multi-Answer Questions Feature

## Overview

The C-COS system now supports questions with multiple correct answers! Teachers can create questions where candidates must select all correct options using checkboxes instead of radio buttons.

## What's New

### Database Changes

- Questions can now have multiple correct answers (e.g., A,B,D)
- New `is_multi_answer` field in the `questions` table indicates question type
- `correct_answer` field now supports comma-separated values
- Answer validation handles partial matches (all correct answers must be selected)
- Shuffling logic updated to handle multiple correct answers

### Backend Features

1. **Question Creation/Editing**
   - API endpoints now accept `is_multi_answer` boolean flag
   - Correct answers can be specified as comma-separated values (e.g., "A,B,D")
   - Validation ensures correct format: `^[A-D](,[A-D])*$`

2. **Answer Validation**
   - For multi-answer questions, all correct options must be selected
   - Partial matches are marked incorrect
   - Answers are sorted before comparison for consistency

3. **Option Shuffling**
   - When option randomization is enabled, multi-answer questions maintain correct mappings
   - Example: If correct_answer is "A,B,D" and options are shuffled, the new positions are tracked

### Frontend Features

#### Teacher Side (Web)

1. **Question Bank**
   - Checkbox to enable "Multiple correct answers"
   - When enabled, shows checkboxes to select multiple correct options
   - Displays selected answers (e.g., "A,B,D")

2. **Create/Edit Exam**
   - Same multi-answer support when adding questions inline
   - Visual indicator shows which questions have multiple answers

#### Candidate Side (Mobile)

1. **Exam Taking**
   - Radio buttons for single-answer questions
   - Checkboxes for multi-answer questions
   - Hint text: "Select all correct answers" for multi-answer questions
   - Selected answers saved as comma-separated values

## CSV Import Format

The question template now includes the `is_multi_answer` field:

```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,points,is_multi_answer
What is 2+2?,3,4,5,6,B,1,false
Select all prime numbers,2,4,7,9,A,C,2,true
Select all fruits,Apple,Carrot,Banana,Potato,A,C,2,true
```

**Key Points:**
- `is_multi_answer`: Set to `true` for multi-answer questions, `false` for single-answer
- `correct_answer`: For multi-answer, use comma-separated letters (e.g., `A,C` or `A,B,D`)
- `points`: Consider awarding more points for multi-answer questions

## How to Use

### For Teachers

#### Creating a Multi-Answer Question

1. **In Question Bank:**
   ```
   1. Click "Add New Question"
   2. Fill in question text and options
   3. Check "Multiple correct answers (use checkboxes)"
   4. Select all correct options (A, B, C, D as needed)
   5. Click "Add Question"
   ```

2. **In Create Exam:**
   ```
   1. Go to Questions tab
   2. Check "Multiple correct answers"
   3. Select multiple correct options using checkboxes
   4. Click "Add" to add question to exam
   ```

#### Example Multi-Answer Question

**Question:** Which of the following are programming languages?
- A: Python ✓
- B: HTML
- C: JavaScript ✓
- D: Java ✓

**Correct Answer:** A,C,D

### For Candidates

When taking an exam:
- **Single-answer questions:** You'll see radio buttons (○) - select one option
- **Multi-answer questions:** You'll see checkboxes (☐) - select all that apply
- A hint "Select all correct answers" appears for multi-answer questions

## Database Migration

To enable this feature on existing installations:

```bash
# Navigate to backend directory
cd backend

# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i database/migrations/add_multi_answer_support.sql
```

### Migration Details

The migration:
1. Adds `is_multi_answer` column to `questions` table
2. Modifies `correct_answer` to support comma-separated values (VARCHAR(10))
3. Updates constraints to validate comma-separated format
4. Modifies `exam_answers.answer` to support multiple selections
5. Updates `exam_questions.shuffled_correct_answer` for multi-answer shuffling
6. Creates index on `is_multi_answer` for performance

### Verification

After running the migration:

```sql
-- Check questions table
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name IN ('correct_answer', 'is_multi_answer');

-- Expected output:
-- correct_answer  | character varying | 10
-- is_multi_answer | boolean           | NULL
```

## API Changes

### POST /api/question-bank

**Request body:**
```json
{
  "question_text": "Which are fruits?",
  "option_a": "Apple",
  "option_b": "Carrot",
  "option_c": "Banana",
  "option_d": "Potato",
  "correct_answer": "A,C",
  "is_multi_answer": true,
  "points": 2
}
```

### PUT /api/question-bank/:id

**Request body:**
```json
{
  "correct_answer": "A,B,D",
  "is_multi_answer": true
}
```

### POST /api/candidate/exams/:id/save-answer

**Request body for multi-answer:**
```json
{
  "question_id": 123,
  "answer": "A,C,D"
}
```

## Technical Implementation

### Answer Format

- Single answer: `"A"`, `"B"`, `"C"`, or `"D"`
- Multiple answers: `"A,B"`, `"A,C,D"`, etc.
- Always sorted alphabetically: `"A,B,D"` not `"D,B,A"`

### Validation Logic

```javascript
// For multi-answer questions
if (isMultiAnswer && correctAnswer.includes(',')) {
  const correctSorted = correctAnswer.split(',').sort().join(',');
  const answerSorted = (answer || '').split(',').sort().join(',');
  isCorrect = correctSorted === answerSorted;
} else {
  isCorrect = correctAnswer === answer;
}
```

### Shuffling Logic

When options are randomized:

```javascript
// Original: correct_answer = "A,B,D"
// After shuffle: A→C, B→A, D→B
// New: correct_answer = "A,B,C" (sorted)
```

## Benefits

1. **More Assessment Options:** Test candidates' comprehensive understanding
2. **Realistic Scenarios:** Many real-world questions have multiple valid answers
3. **Better Evaluation:** Distinguish between partial and complete knowledge
4. **Flexible Scoring:** Award points only for completely correct answers

## Backward Compatibility

- Existing questions remain single-answer by default (`is_multi_answer = false`)
- Existing exams and answers continue to work normally
- No changes required to existing questions
- Migration is non-destructive

## Testing the Feature

1. **Create a multi-answer question:**
   - Add question with correct_answer: "A,B,D"
   - Set is_multi_answer: true

2. **Take exam as candidate:**
   - Verify checkboxes appear for multi-answer questions
   - Select multiple options
   - Submit exam

3. **Check results:**
   - Fully correct answer: marked correct
   - Partial answer (e.g., only "A,B"): marked incorrect
   - Wrong answer: marked incorrect

## Troubleshooting

### Issue: Checkboxes not showing

**Solution:** Ensure the question has `is_multi_answer: true` in the database

```sql
SELECT id, question_text, correct_answer, is_multi_answer
FROM questions
WHERE id = <question_id>;
```

### Issue: Answer marked incorrect despite being correct

**Solution:** Check if answers are sorted. The system expects sorted format:
- Correct: "A,B,D"
- Incorrect: "D,B,A"

### Issue: Migration fails

**Solution:** Check if columns already exist:

```sql
-- Check existing columns
\d questions
\d exam_answers
\d exam_questions
```

If columns exist with different constraints, manually adjust the migration.

## Future Enhancements

Potential improvements for future versions:
- Partial credit scoring (1 point for 2/3 correct)
- Weight individual options differently
- Visual indicators in question list showing multi-answer questions
- Bulk convert single-answer to multi-answer questions
- Statistics on multi-answer question performance

## Support

For issues or questions:
1. Check the migration ran successfully
2. Verify database constraints are correct
3. Check browser console for frontend errors
4. Review backend logs for validation errors

---

**Version:** 1.0.0  
**Date:** December 2024  
**Compatibility:** C-COS v2.0+

