-- Fix correct_answer column to support multi-answer values (e.g., "A,C")
ALTER TABLE questions ALTER COLUMN correct_answer TYPE VARCHAR(10);

