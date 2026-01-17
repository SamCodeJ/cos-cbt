-- Fix shuffled_correct_answer column to support multi-answer questions
-- This migration ensures the column can store values like "A,B,C" (up to 10 characters)

-- Drop the old constraint if it exists
ALTER TABLE exam_questions DROP CONSTRAINT IF EXISTS exam_questions_shuffled_correct_answer_check;

-- Change the column type from VARCHAR(1) to VARCHAR(10) to support multi-answer questions
ALTER TABLE exam_questions ALTER COLUMN shuffled_correct_answer TYPE VARCHAR(10);

-- Add constraint for shuffled answers (supports single: "A" or multiple: "A,B,D")
ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_shuffled_correct_answer_check 
  CHECK (shuffled_correct_answer IS NULL OR shuffled_correct_answer ~ '^[A-D](,[A-D])*$');

-- Update comment
COMMENT ON COLUMN exam_questions.shuffled_correct_answer IS 'Correct answer(s) after option shuffling. Single: "A", Multiple: "A,B,D"';

