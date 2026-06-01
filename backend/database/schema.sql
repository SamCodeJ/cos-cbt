-- UI-GES Database Schema
-- PostgreSQL

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS exam_violations CASCADE;
DROP TABLE IF EXISTS exam_answers CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exam_candidates CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (teachers, admins, candidates)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'candidate')),
    student_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    questions_per_candidate INTEGER NOT NULL,
    total_questions INTEGER DEFAULT 0,
    pass_mark DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    show_results BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT true,
    randomize_options BOOLEAN DEFAULT false,
    enforce_screen_lock BOOLEAN DEFAULT true,
    require_pin_check BOOLEAN DEFAULT false,
    exam_pin VARCHAR(20),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table (question bank)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    difficulty VARCHAR(50) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(10) NOT NULL CHECK (correct_answer ~ '^[A-D](,[A-D])*$'),
    points INTEGER DEFAULT 1,
    is_multi_answer BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam candidates (junction table)
CREATE TABLE exam_candidates (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, candidate_id)
);

-- Exam questions assigned to candidates (for randomization)
CREATE TABLE exam_questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    shuffled_correct_answer VARCHAR(10) CHECK (shuffled_correct_answer IS NULL OR shuffled_correct_answer ~ '^[A-D](,[A-D])*$'), -- Stores correct answer(s) after option randomization
    shuffled_option_a TEXT,
    shuffled_option_b TEXT,
    shuffled_option_c TEXT,
    shuffled_option_d TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, candidate_id, question_id)
);

-- Exam attempts (when candidate starts exam)
CREATE TABLE exam_attempts (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_taken INTEGER, -- in minutes
    score_percentage DECIMAL(5,2),
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER,
    passed BOOLEAN,
    violations_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
    UNIQUE(exam_id, candidate_id)
);

-- Exam answers
CREATE TABLE exam_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer VARCHAR(10) CHECK (answer IS NULL OR answer ~ '^[A-D](,[A-D])*$'),
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

-- Exam violations
CREATE TABLE exam_violations (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_is_multi_answer ON questions(is_multi_answer);
CREATE INDEX idx_exam_candidates_exam_id ON exam_candidates(exam_id);
CREATE INDEX idx_exam_candidates_candidate_id ON exam_candidates(candidate_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_candidate_id ON exam_attempts(candidate_id);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update exam status based on dates
CREATE OR REPLACE FUNCTION update_exam_status()
RETURNS void AS $$
BEGIN
    -- Update to active if start_date has passed and end_date hasn't
    UPDATE exams
    SET status = 'active'
    WHERE status = 'scheduled'
    AND start_date <= CURRENT_TIMESTAMP
    AND end_date > CURRENT_TIMESTAMP;

    -- Update to completed if end_date has passed
    UPDATE exams
    SET status = 'completed'
    WHERE status IN ('scheduled', 'active')
    AND end_date <= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores all user types: admins, teachers, and candidates';
COMMENT ON TABLE exams IS 'Exam definitions with settings and configuration';
COMMENT ON TABLE questions IS 'Question bank - can be reused across exams';
COMMENT ON TABLE exam_candidates IS 'Junction table linking exams to assigned candidates';
COMMENT ON TABLE exam_questions IS 'Randomized questions assigned to each candidate';
COMMENT ON TABLE exam_attempts IS 'Tracks each candidate''s exam attempt with results';
COMMENT ON TABLE exam_answers IS 'Individual answers for each question in an attempt';
COMMENT ON TABLE exam_violations IS 'Logs screen lock violations during exams';
COMMENT ON TABLE audit_logs IS 'System-wide activity tracking for admins';

