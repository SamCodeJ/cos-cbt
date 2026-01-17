-- Migration: Make student_id unique and required for candidates
-- This enables student ID-based login instead of email login

-- Step 1: Update any NULL student_ids for existing candidates
-- This creates unique student IDs for candidates who don't have one
UPDATE users 
SET student_id = CONCAT('STU', LPAD(id::text, 6, '0'))
WHERE role = 'candidate' AND (student_id IS NULL OR student_id = '');

-- Step 2: Add unique constraint on student_id for candidates
-- Note: This only affects candidates, teachers and admins can have NULL or duplicate student_ids
CREATE UNIQUE INDEX idx_unique_student_id_candidates 
ON users (student_id) 
WHERE role = 'candidate' AND student_id IS NOT NULL;

-- Step 3: Add check constraint to ensure candidates have student_id
ALTER TABLE users 
ADD CONSTRAINT chk_candidate_student_id 
CHECK (
    (role != 'candidate') OR 
    (role = 'candidate' AND student_id IS NOT NULL AND student_id != '')
);

-- Comments
COMMENT ON INDEX idx_unique_student_id_candidates IS 'Ensures student_id is unique for all candidates';
COMMENT ON CONSTRAINT chk_candidate_student_id ON users IS 'Ensures all candidates have a student_id';
