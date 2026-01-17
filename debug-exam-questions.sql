-- Debug script to find the issue with "No questions available"

-- Step 1: Find the exam the candidate is trying to access
-- Replace 'fem' with the actual candidate email
SELECT 
    e.id as exam_id,
    e.title,
    e.enable_section_distribution,
    e.section_distribution,
    e.questions_per_candidate,
    e.status,
    ec.candidate_id
FROM exams e
JOIN exam_candidates ec ON e.id = ec.exam_id
JOIN candidates c ON ec.candidate_id = c.id
WHERE c.email = 'fem'  -- Replace with actual candidate email
ORDER BY e.created_at DESC;

-- Step 2: For the exam found above, check what sections exist in the questions
-- Replace EXAM_ID with the id from Step 1
SELECT 
    COALESCE(section_id, 'Unsectioned') as section_name,
    COUNT(*) as question_count
FROM questions
WHERE exam_id = (
    SELECT e.id 
    FROM exams e
    JOIN exam_candidates ec ON e.id = ec.exam_id
    JOIN candidates c ON ec.candidate_id = c.id
    WHERE c.email = 'fem'  -- Replace with actual candidate email
    ORDER BY e.created_at DESC
    LIMIT 1
)
GROUP BY section_id
ORDER BY section_name;

-- Step 3: Show the section_distribution configuration for comparison
SELECT 
    id,
    title,
    section_distribution,
    enable_section_distribution
FROM exams
WHERE id = (
    SELECT e.id 
    FROM exams e
    JOIN exam_candidates ec ON e.id = ec.exam_id
    JOIN candidates c ON ec.candidate_id = c.id
    WHERE c.email = 'fem'  -- Replace with actual candidate email
    ORDER BY e.created_at DESC
    LIMIT 1
);

