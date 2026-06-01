-- ========================================
-- DIAGNOSTIC SCRIPT FOR PRODUCTION SERVER
-- Run this on your production database to find the issue
-- ========================================

-- Query 1: List all active exams and their question counts
SELECT 
    e.id as exam_id,
    e.title,
    e.status,
    e.enable_section_distribution,
    e.section_distribution,
    e.questions_per_candidate,
    COUNT(q.id) as total_questions,
    e.start_date,
    e.end_date
FROM exams e
LEFT JOIN questions q ON q.exam_id = e.id
WHERE e.status = 'active'
GROUP BY e.id
ORDER BY e.created_at DESC;

-- Query 2: For each exam with section distribution, show actual sections available
SELECT 
    e.id as exam_id,
    e.title,
    e.section_distribution as configured_sections,
    COALESCE(q.section_id, 'Unsectioned') as actual_section,
    COUNT(q.id) as question_count
FROM exams e
LEFT JOIN questions q ON q.exam_id = e.id
WHERE e.enable_section_distribution = true
GROUP BY e.id, e.title, e.section_distribution, q.section_id
ORDER BY e.id, actual_section;

-- Query 3: Find exams with section distribution but NO questions
SELECT 
    id,
    title,
    enable_section_distribution,
    section_distribution,
    status
FROM exams
WHERE enable_section_distribution = true
AND id NOT IN (SELECT DISTINCT exam_id FROM questions WHERE exam_id IS NOT NULL)
ORDER BY created_at DESC;

-- Query 4: Find exams with section distribution but mismatched section names
WITH exam_sections AS (
    SELECT 
        e.id as exam_id,
        e.title,
        jsonb_object_keys(e.section_distribution) as configured_section
    FROM exams e
    WHERE e.enable_section_distribution = true
    AND e.section_distribution IS NOT NULL
),
actual_sections AS (
    SELECT DISTINCT
        exam_id,
        COALESCE(section_id, 'Unsectioned') as actual_section
    FROM questions
)
SELECT 
    es.exam_id,
    es.title,
    es.configured_section,
    CASE 
        WHEN es.configured_section IN (SELECT actual_section FROM actual_sections WHERE exam_id = es.exam_id)
        THEN '✅ Match'
        ELSE '❌ MISSING - No questions with this section_id'
    END as status
FROM exam_sections es
ORDER BY es.exam_id, es.configured_section;

-- Query 5: Show recent exam attempts and their errors
SELECT 
    ea.id,
    ea.exam_id,
    e.title as exam_title,
    ea.candidate_id,
    u.name as candidate_name,
    u.student_id,
    ea.status,
    ea.started_at,
    ea.submitted_at
FROM exam_attempts ea
JOIN exams e ON ea.exam_id = e.id
JOIN users u ON ea.candidate_id = u.id
ORDER BY ea.started_at DESC
LIMIT 10;
