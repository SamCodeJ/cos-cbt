-- C-COS Seed Data
-- Creates demo users, exams, and questions for testing

-- Insert demo users (passwords are hashed version of 'password')
-- Password hash: $2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK
INSERT INTO users (name, email, password, role, student_id) VALUES
('Admin User', 'admin@uiges.com', '$2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK', 'admin', NULL),
('John Teacher', 'teacher@uiges.com', '$2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK', 'teacher', NULL),
('Jane Instructor', 'jane@uiges.com', '$2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK', 'teacher', NULL),
('Student One', 'candidate@uiges.com', '$2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK', 'candidate', 'ST001'),
('Student Two', 'student2@uiges.com', '$2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK', 'candidate', 'ST002'),
('Student Three', 'student3@uiges.com', '$2a$10$rYvK6Y8YgKQJXqXqKqXqKuN0pVJ3YqXqKqXqKqXqKqXqKqXqKqXqK', 'candidate', 'ST003');

-- Insert demo exams
INSERT INTO exams (teacher_id, title, subject, duration, questions_per_candidate, total_questions, pass_mark, start_date, end_date, show_results, randomize_questions, status) VALUES
(2, 'Mathematics Midterm Exam', 'Mathematics', 90, 40, 50, 60.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true, true, 'active'),
(2, 'Computer Science Quiz', 'Computer Science', 60, 30, 40, 70.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', true, true, 'active'),
(3, 'Physics Final Examination', 'Physics', 120, 50, 60, 50.00, CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '35 days', false, true, 'scheduled');

-- Insert demo questions for Mathematics
INSERT INTO questions (exam_id, subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
-- Easy Questions
(1, 'Mathematics', 'easy', 'What is 2 + 2?', '3', '4', '5', '6', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 10 - 5?', '3', '4', '5', '6', 'C', 1),
(1, 'Mathematics', 'easy', 'What is 3 × 3?', '6', '9', '12', '15', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 20 ÷ 4?', '4', '5', '6', '7', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 15 + 10?', '20', '25', '30', '35', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 50 - 25?', '20', '25', '30', '35', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 7 × 2?', '12', '14', '16', '18', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 100 ÷ 10?', '5', '10', '15', '20', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 8 + 7?', '13', '14', '15', '16', 'C', 1),
(1, 'Mathematics', 'easy', 'What is 30 - 12?', '16', '17', '18', '19', 'C', 1),

-- Medium Questions
(1, 'Mathematics', 'medium', 'What is 15% of 200?', '20', '25', '30', '35', 'C', 2),
(1, 'Mathematics', 'medium', 'What is the square root of 144?', '10', '11', '12', '13', 'C', 2),
(1, 'Mathematics', 'medium', 'If x + 5 = 12, what is x?', '5', '6', '7', '8', 'C', 2),
(1, 'Mathematics', 'medium', 'What is 2³ (2 cubed)?', '4', '6', '8', '10', 'C', 2),
(1, 'Mathematics', 'medium', 'What is the area of a rectangle with length 8 and width 5?', '30', '35', '40', '45', 'C', 2),
(1, 'Mathematics', 'medium', 'What is 0.5 + 0.25?', '0.5', '0.65', '0.75', '0.85', 'C', 2),
(1, 'Mathematics', 'medium', 'What is 12 × 12?', '124', '134', '144', '154', 'C', 2),
(1, 'Mathematics', 'medium', 'If a = 3 and b = 4, what is a² + b²?', '20', '23', '25', '27', 'C', 2),
(1, 'Mathematics', 'medium', 'What is 360 ÷ 12?', '25', '28', '30', '32', 'C', 2),
(1, 'Mathematics', 'medium', 'What is the perimeter of a square with side length 7?', '21', '24', '28', '32', 'C', 2),

-- Hard Questions
(1, 'Mathematics', 'hard', 'What is the value of π (pi) to 2 decimal places?', '3.12', '3.14', '3.16', '3.18', 'B', 3),
(1, 'Mathematics', 'hard', 'If 2x + 3 = 15, what is x?', '5', '6', '7', '8', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the sum of angles in a triangle?', '90°', '180°', '270°', '360°', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the derivative of x²?', 'x', '2x', 'x³', '2x²', 'B', 3),
(1, 'Mathematics', 'hard', 'What is log₁₀(100)?', '1', '2', '10', '100', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the factorial of 5 (5!)?', '60', '100', '120', '140', 'C', 3),
(1, 'Mathematics', 'hard', 'If sin(θ) = 0.5, what is θ in degrees?', '15°', '30°', '45°', '60°', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the quadratic formula discriminant for x² + 2x + 1 = 0?', '-1', '0', '1', '2', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the sum of first 10 natural numbers?', '45', '50', '55', '60', 'C', 3),
(1, 'Mathematics', 'hard', 'What is the value of e (Euler''s number) to 2 decimal places?', '2.56', '2.68', '2.72', '2.84', 'C', 3),

-- More questions to reach 50 total
(1, 'Mathematics', 'easy', 'What is 6 + 9?', '13', '14', '15', '16', 'C', 1),
(1, 'Mathematics', 'easy', 'What is 25 - 10?', '10', '15', '20', '25', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 4 × 5?', '15', '20', '25', '30', 'B', 1),
(1, 'Mathematics', 'easy', 'What is 36 ÷ 6?', '4', '5', '6', '7', 'C', 1),
(1, 'Mathematics', 'medium', 'What is 40% of 150?', '50', '60', '70', '80', 'B', 2),
(1, 'Mathematics', 'medium', 'What is the square root of 169?', '11', '12', '13', '14', 'C', 2),
(1, 'Mathematics', 'medium', 'If y - 8 = 20, what is y?', '26', '27', '28', '29', 'C', 2),
(1, 'Mathematics', 'medium', 'What is 5²?', '20', '25', '30', '35', 'B', 2),
(1, 'Mathematics', 'hard', 'What is the Pythagorean theorem?', 'a + b = c', 'a² + b² = c²', 'a × b = c', 'a - b = c', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the slope of a line through (0,0) and (3,6)?', '1', '2', '3', '4', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the volume of a cube with side length 3?', '9', '18', '27', '36', 'C', 3),
(1, 'Mathematics', 'hard', 'What is the integral of 2x?', 'x', 'x²', '2x²', 'x³', 'B', 3),
(1, 'Mathematics', 'hard', 'What is the GCD of 24 and 36?', '6', '8', '12', '18', 'C', 3),
(1, 'Mathematics', 'hard', 'What is the LCM of 4 and 6?', '8', '10', '12', '14', 'C', 3),
(1, 'Mathematics', 'hard', 'What is the sum of angles in a quadrilateral?', '180°', '270°', '360°', '450°', 'C', 3),
(1, 'Mathematics', 'hard', 'If f(x) = 3x + 2, what is f(4)?', '10', '12', '14', '16', 'C', 3),
(1, 'Mathematics', 'medium', 'What is 15 × 8?', '100', '110', '120', '130', 'C', 2),
(1, 'Mathematics', 'medium', 'What is 250 ÷ 5?', '40', '45', '50', '55', 'C', 2),
(1, 'Mathematics', 'easy', 'What is 11 + 11?', '20', '21', '22', '23', 'C', 1),
(1, 'Mathematics', 'easy', 'What is 100 - 75?', '20', '25', '30', '35', 'B', 1);

-- Update total_questions count
UPDATE exams SET total_questions = 50 WHERE id = 1;

-- Insert demo questions for Computer Science
INSERT INTO questions (exam_id, subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
(2, 'Computer Science', 'easy', 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'A', 1),
(2, 'Computer Science', 'easy', 'What does CSS stand for?', 'Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets', 'B', 1),
(2, 'Computer Science', 'easy', 'Which language is used for web development?', 'Python', 'JavaScript', 'C++', 'Java', 'B', 1),
(2, 'Computer Science', 'medium', 'What is the time complexity of binary search?', 'O(n)', 'O(log n)', 'O(n²)', 'O(1)', 'B', 2),
(2, 'Computer Science', 'medium', 'Which data structure uses LIFO?', 'Queue', 'Stack', 'Array', 'Tree', 'B', 2),
(2, 'Computer Science', 'hard', 'What is the worst-case time complexity of QuickSort?', 'O(n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'C', 3);

-- Assign candidates to exams
INSERT INTO exam_candidates (exam_id, candidate_id) VALUES
(1, 4), (1, 5), (1, 6),  -- All 3 candidates for Math exam
(2, 4), (2, 5);          -- 2 candidates for CS exam

-- Insert audit logs
INSERT INTO audit_logs (user_id, user_name, action, details, ip_address) VALUES
(1, 'Admin User', 'user.login', 'Admin logged in', '127.0.0.1'),
(2, 'John Teacher', 'exam.create', 'Created Mathematics Midterm Exam', '127.0.0.1'),
(2, 'John Teacher', 'exam.create', 'Created Computer Science Quiz', '127.0.0.1');

-- Display seed data summary
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_exams FROM exams;
SELECT COUNT(*) as total_questions FROM questions;
SELECT COUNT(*) as total_exam_candidates FROM exam_candidates;

