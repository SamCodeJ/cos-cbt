-- Check if section distribution data is saved in the database

-- Query 1: Show all exams with section distribution enabled
SELECT 
    id,
    title,
    enable_section_distribution,
    section_distribution,
    questions_per_candidate,
    created_at
FROM exams
WHERE enable_section_distribution = true
ORDER BY created_at DESC;

-- Query 2: Show the most recently updated exam with section distribution
SELECT 
    id,
    title,
    enable_section_distribution,
    section_distribution,
    questions_per_candidate,
    status,
    updated_at
FROM exams
ORDER BY updated_at DESC
LIMIT 1;

-- Query 3: Count exams with and without section distribution
SELECT 
    enable_section_distribution,
    COUNT(*) as exam_count
FROM exams
GROUP BY enable_section_distribution;

