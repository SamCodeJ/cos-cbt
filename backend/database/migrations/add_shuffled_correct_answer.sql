-- Add column to store shuffled correct answer for option randomization
-- This allows each candidate to have different option orders while maintaining correct validation

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS shuffled_correct_answer VARCHAR(1);

-- Add comment explaining the column
COMMENT ON COLUMN exam_questions.shuffled_correct_answer IS 'Stores the correct answer letter (A/B/C/D) after option randomization. NULL if options were not shuffled for this candidate.';

