-- ========================================
-- FIX SCRIPT FOR PRODUCTION SERVER
-- Choose the appropriate fix based on diagnostic results
-- ========================================

-- =====================================
-- FIX 1: Disable section distribution for exams with no questions
-- Use this if Query 3 from diagnostics showed exams with section distribution but no questions
-- =====================================

-- First, check which exams will be affected:
SELECT 
    id,
    title,
    enable_section_distribution,
    section_distribution
FROM exams
WHERE enable_section_distribution = true
AND id NOT IN (SELECT DISTINCT exam_id FROM questions WHERE exam_id IS NOT NULL);

-- If you want to disable section distribution for these exams:
-- UNCOMMENT THE FOLLOWING:
/*
UPDATE exams
SET 
    enable_section_distribution = false,
    section_distribution = NULL
WHERE enable_section_distribution = true
AND id NOT IN (SELECT DISTINCT exam_id FROM questions WHERE exam_id IS NOT NULL);
*/

-- =====================================
-- FIX 2: Update section_id in questions table to match section_distribution
-- Use this if section names don't match (e.g., "section 1" vs "Section 1")
-- =====================================

-- Example: If your section_distribution expects "Section 1" but questions have "section 1"
-- REPLACE exam_id and section names as needed:
/*
UPDATE questions
SET section_id = 'Section 1'
WHERE exam_id = YOUR_EXAM_ID_HERE
AND section_id = 'section 1';
*/

-- =====================================
-- FIX 3: Disable section distribution globally for all exams
-- Use this as a quick fix to get exams working while you investigate
-- =====================================

-- Preview what will be changed:
SELECT 
    id,
    title,
    enable_section_distribution,
    questions_per_candidate,
    (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count
FROM exams e
WHERE enable_section_distribution = true;

-- Apply the fix - UNCOMMENT to execute:
/*
UPDATE exams
SET 
    enable_section_distribution = false,
    section_distribution = NULL
WHERE enable_section_distribution = true;

SELECT 'Section distribution disabled for all exams' as result;
*/

-- =====================================
-- FIX 4: Add missing questions to exam
-- If exam exists but has no questions, you need to add them
-- This typically means you need to:
-- 1. Export questions from your local database
-- 2. Import them to production database
-- =====================================

-- Check which exam_id needs questions:
SELECT 
    id as exam_id,
    title,
    questions_per_candidate as questions_needed,
    (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as current_count
FROM exams e
WHERE status = 'active'
ORDER BY created_at DESC;

-- To export from local database and import to production:
-- Run on LOCAL database:
-- \copy (SELECT * FROM questions WHERE exam_id = YOUR_EXAM_ID) TO 'questions_export.csv' CSV HEADER;

-- Then on PRODUCTION database:
-- \copy questions FROM 'questions_export.csv' CSV HEADER;

-- =====================================
-- VERIFICATION: Run these after applying fixes
-- =====================================

-- Verify fix worked:
SELECT 
    e.id,
    e.title,
    e.enable_section_distribution,
    e.section_distribution,
    COUNT(q.id) as question_count,
    CASE 
        WHEN e.enable_section_distribution = false THEN '✅ Section distribution disabled'
        WHEN COUNT(q.id) >= e.questions_per_candidate THEN '✅ Enough questions'
        ELSE '❌ Still needs questions'
    END as status
FROM exams e
LEFT JOIN questions q ON q.exam_id = e.id
WHERE e.status = 'active'
GROUP BY e.id
ORDER BY e.created_at DESC;
