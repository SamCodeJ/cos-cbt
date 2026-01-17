-- Migration: Add Multi-Answer Support
-- Date: 2025-12-01
-- Description: Enables questions to have multiple correct answers and candidates to select multiple options

-- Step 1: Add column to track if question allows multiple answers
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_multi_answer BOOLEAN DEFAULT false;

-- Step 2: Change correct_answer to support multiple values (e.g., "A,B,D")
-- First, remove the old constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;

-- Now modify the column to support multiple answers
ALTER TABLE questions ALTER COLUMN correct_answer TYPE VARCHAR(10);

-- Add new constraint that allows comma-separated values
ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_check 
  CHECK (correct_answer ~ '^[A-D](,[A-D])*$');

-- Step 3: Update exam_answers to support multiple selected answers
ALTER TABLE exam_answers DROP CONSTRAINT IF EXISTS exam_answers_answer_check;

-- Modify answer column to support multiple selections
ALTER TABLE exam_answers ALTER COLUMN answer TYPE VARCHAR(10);

-- Add constraint for multiple answers (can be comma-separated)
ALTER TABLE exam_answers ADD CONSTRAINT exam_answers_answer_check 
  CHECK (answer IS NULL OR answer ~ '^[A-D](,[A-D])*$');

-- Step 4: Update exam_questions shuffled_correct_answer for multi-answer
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_shuffled_correct_answer_check;

-- Modify shuffled_correct_answer to support multiple values
ALTER TABLE exam_questions ALTER COLUMN shuffled_correct_answer TYPE VARCHAR(10);

-- Add constraint for shuffled answers
ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_shuffled_correct_answer_check 
  CHECK (shuffled_correct_answer IS NULL OR shuffled_correct_answer ~ '^[A-D](,[A-D])*$');

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_is_multi_answer ON questions(is_multi_answer);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN questions.is_multi_answer IS 'Indicates if question has multiple correct answers (checkbox vs radio)';
COMMENT ON COLUMN questions.correct_answer IS 'Correct answer(s). Single: "A", Multiple: "A,B,D"';
COMMENT ON COLUMN exam_answers.answer IS 'Candidate answer(s). Single: "A", Multiple: "A,B,D"';
COMMENT ON COLUMN exam_questions.shuffled_correct_answer IS 'Correct answer(s) after option shuffling. Multiple: "A,B,D"';

-- Verification queries
-- SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'questions' AND column_name IN ('correct_answer', 'is_multi_answer');
-- SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'exam_answers' AND column_name = 'answer';

