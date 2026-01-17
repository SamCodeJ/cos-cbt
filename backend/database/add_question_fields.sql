-- Add section_id, instruction, and passage columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS section_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS instruction TEXT,
ADD COLUMN IF NOT EXISTS passage TEXT,
ADD COLUMN IF NOT EXISTS is_multi_answer BOOLEAN DEFAULT false;

