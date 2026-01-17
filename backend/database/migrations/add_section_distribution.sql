-- Migration: Add Section-Based Question Distribution Support
-- Date: 2026-01-13
-- Description: Adds fields to enable section-based distribution of questions

-- Add enable_section_distribution field to exams table
ALTER TABLE exams 
ADD COLUMN enable_section_distribution BOOLEAN DEFAULT false;

-- Add section_distribution field to exams table (JSONB type for flexible storage)
ALTER TABLE exams 
ADD COLUMN section_distribution JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN exams.enable_section_distribution IS 'Enable automatic or manual section-based question distribution';
COMMENT ON COLUMN exams.section_distribution IS 'JSON object mapping section names to number of questions to select per student';

-- Example of section_distribution JSON structure:
-- {
--   "Algebra": 8,
--   "Geometry": 6,
--   "Trigonometry": 5,
--   "Calculus": 4,
--   "Statistics": 4,
--   "Word Problems": 3
-- }

