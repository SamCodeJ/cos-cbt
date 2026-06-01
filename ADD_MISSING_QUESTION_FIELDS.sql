-- ===============================================
-- ADD MISSING QUESTION FIELDS MIGRATION
-- ===============================================
-- This migration adds the missing section_id, instruction, and passage columns
-- to the questions table in your production database.
--
-- WHEN TO RUN THIS:
-- - If your mobile app is not showing instructions, sections, or passages
-- - If you get errors about missing columns when creating/editing questions
--
-- HOW TO RUN THIS:
-- 1. Connect to your production PostgreSQL database
-- 2. Run this entire SQL file
-- 3. Verify the columns were added by checking the questions table structure
-- ===============================================

-- Add the missing columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS section_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS instruction TEXT,
ADD COLUMN IF NOT EXISTS passage TEXT;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
AND column_name IN ('section_id', 'instruction', 'passage')
ORDER BY ordinal_position;

-- Show confirmation message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📋 The following columns have been added to the questions table:';
    RAISE NOTICE '   - section_id (VARCHAR 255) - For grouping questions into sections';
    RAISE NOTICE '   - instruction (TEXT) - For question/section-specific instructions';
    RAISE NOTICE '   - passage (TEXT) - For reading comprehension passages';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '   1. Test creating a new question with these fields';
    RAISE NOTICE '   2. Check if the mobile app now displays sections/instructions/passages';
    RAISE NOTICE '   3. You can now add these fields when creating questions in your admin panel';
END $$;
