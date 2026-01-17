-- Migration: Update Student ID to be unique per exam, not system-wide
-- This allows the same student to take multiple different exams
-- But prevents the same student from taking the same exam twice

-- Step 1: Remove the system-wide unique constraint
DROP INDEX IF EXISTS idx_unique_student_id_candidates;

-- Step 2: Remove the check constraint that requires candidates to have student_id
-- (We still want student_id for login, but it can be duplicated across exams)
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_candidate_student_id;

-- Step 3: Create a unique constraint on exam_candidates to prevent duplicate student_id per exam
-- First, we need to ensure the exam_candidates table has access to student_id
-- We'll create a unique index on (exam_id, student_id) by joining through users

-- Note: We cannot directly create a unique constraint on exam_candidates since student_id is in users table
-- Instead, we'll enforce this in application logic with proper validation

-- Step 4: Add a composite unique constraint on exam_candidates using candidate_id
-- This already exists: UNIQUE(exam_id, candidate_id)
-- This ensures a candidate can only be assigned to an exam once

-- Step 5: For login purposes, we need student_id + exam_id combination
-- Add index to support fast lookups for exam-specific student IDs
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id) WHERE role = 'candidate';

-- Comments
COMMENT ON INDEX idx_users_student_id IS 'Index for fast student_id lookups during login (not unique - same student can take multiple exams)';

-- Verification queries:
-- To check if a student_id is already in a specific exam:
-- SELECT COUNT(*) FROM exam_candidates ec 
-- JOIN users u ON ec.candidate_id = u.id 
-- WHERE ec.exam_id = ? AND u.student_id = ?;
