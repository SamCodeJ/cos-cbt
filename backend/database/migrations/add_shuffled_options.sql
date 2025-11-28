-- Add columns to store shuffled option texts for each candidate
-- This allows us to show candidates the exact options they saw during the exam

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS shuffled_option_a TEXT,
ADD COLUMN IF NOT EXISTS shuffled_option_b TEXT,
ADD COLUMN IF NOT EXISTS shuffled_option_c TEXT,
ADD COLUMN IF NOT EXISTS shuffled_option_d TEXT;

-- Add comments explaining the columns
COMMENT ON COLUMN exam_questions.shuffled_option_a IS 'The text that appeared in option A position after shuffling';
COMMENT ON COLUMN exam_questions.shuffled_option_b IS 'The text that appeared in option B position after shuffling';
COMMENT ON COLUMN exam_questions.shuffled_option_c IS 'The text that appeared in option C position after shuffling';
COMMENT ON COLUMN exam_questions.shuffled_option_d IS 'The text that appeared in option D position after shuffling';

