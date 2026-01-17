-- COPY AND RUN THIS ENTIRE SCRIPT IN YOUR DATABASE CLIENT
-- This will add the section distribution feature

-- Add enable_section_distribution column
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS enable_section_distribution BOOLEAN DEFAULT false;

-- Add section_distribution column
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS section_distribution JSONB DEFAULT NULL;

-- Verify the columns were added
SELECT 'Migration successful! New columns added:' as message;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'exams' 
  AND column_name IN ('enable_section_distribution', 'section_distribution');

