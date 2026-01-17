-- Drop the old constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;

-- Add a new constraint that allows single answers (A-D) and multi-answers (A,C or A,B,C,D)
-- This regex allows: A, B, C, D, or comma-separated combinations like A,C or A,B,C,D
-- It also trims whitespace before checking
ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_check 
CHECK (TRIM(correct_answer) ~ '^[A-D](,[A-D])*$');

