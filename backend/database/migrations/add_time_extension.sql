-- Migration: Add time extension support
-- This allows teachers to extend exam time for all students or individual students

-- Add time_extension_minutes column to exam_attempts table
-- This tracks additional time added to individual students
ALTER TABLE exam_attempts 
ADD COLUMN IF NOT EXISTS time_extension_minutes INTEGER DEFAULT 0;

-- Add global_time_extension_minutes column to exams table
-- This tracks time added to ALL students taking the exam
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS global_time_extension_minutes INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN exam_attempts.time_extension_minutes IS 'Additional minutes added to this specific student attempt';
COMMENT ON COLUMN exams.global_time_extension_minutes IS 'Additional minutes added to all students taking this exam';

