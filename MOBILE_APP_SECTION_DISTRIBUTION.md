# Mobile App Section Distribution - Implementation Guide

## Overview
The section-based question distribution feature is now fully implemented for the mobile app (candidate side).

## What Was Changed

### Backend (`backend/routes/candidate.js`)

Updated the `/api/candidate/exams/:id/start` endpoint to support section-based distribution:

#### 1. Fetch Section Distribution Settings
Now retrieves `enable_section_distribution` and `section_distribution` from the exam:
```javascript
SELECT questions_per_candidate, randomize_questions, randomize_options, 
       enable_section_distribution, section_distribution, ...
FROM exams WHERE id = $1
```

#### 2. Section-Based Question Selection Logic
When a candidate starts an exam:

**If Section Distribution is ENABLED:**
1. Groups all questions by their `section_id`
2. Selects the specified number of questions from each section
3. Randomizes within each section (if `randomize_questions` is ON)
4. Shuffles the final selection to mix sections
5. Validates that each section has enough questions

**If Section Distribution is DISABLED:**
- Uses the original simple randomization
- Shuffles all questions and takes the first N

#### 3. Validation
- Checks if each section has enough questions
- Returns helpful error if a section doesn't have enough questions:
  ```
  "Not enough questions in section 'Algebra'. Need 8, have 5"
  ```

## How It Works for Candidates

### Example Scenario

**Teacher Setup:**
- Total questions in bank: 50
- Questions per candidate: 30
- Section distribution:
  - Algebra: 8 questions
  - Geometry: 6 questions
  - Trigonometry: 5 questions
  - Calculus: 4 questions
  - Statistics: 4 questions
  - Word Problems: 3 questions

**When Student A starts the exam:**
1. System randomly selects 8 questions from Algebra section
2. System randomly selects 6 questions from Geometry section
3. System randomly selects 5 questions from Trigonometry section
4. ... and so on for all sections
5. All 30 questions are shuffled together
6. Student A receives their unique set of 30 questions

**When Student B starts the exam:**
- Gets a DIFFERENT random selection from each section
- But still gets the SAME distribution (8 Algebra, 6 Geometry, etc.)
- Ensures fairness: everyone gets the same topic coverage

## Testing

### Test Case 1: With Section Distribution
1. Create an exam with section distribution enabled
2. Configure: Algebra (5), Geometry (5), Calculus (5) = 15 total
3. Ensure question bank has at least that many in each section
4. Mobile app candidate starts exam
5. Should receive exactly 5 from each section

### Test Case 2: Without Section Distribution
1. Create an exam with section distribution disabled
2. Set questions per candidate: 20
3. Mobile app candidate starts exam
4. Should receive 20 random questions from entire bank

### Test Case 3: Insufficient Questions
1. Create exam requiring 10 questions from "Algebra"
2. Only add 5 questions to Algebra section
3. Candidate tries to start exam
4. Should receive error: "Not enough questions in section 'Algebra'"

## Console Logs for Debugging

The backend now logs section distribution activity:

```
📊 Section-based distribution enabled: {"Algebra":8,"Geometry":6,...}
📚 Section "Algebra": 15 available, selecting 8
📚 Section "Geometry": 12 available, selecting 6
✅ Selected 30 questions using section distribution
```

Or for simple randomization:
```
✅ Selected 30 questions using simple randomization
```

## Mobile App - No Changes Required!

The mobile app doesn't need any code changes because:
- It already receives questions from the `/start` endpoint
- The selection logic happens on the backend
- The mobile app just displays whatever questions it receives
- Section names are already passed in the question data (`section_id`)

## Backward Compatibility

✅ **100% Backward Compatible**
- Existing exams without section distribution continue to work
- Old mobile app versions will continue to work
- No breaking changes to API responses
- Feature is opt-in (disabled by default)

## Database Requirements

Ensure the migration has been applied:
```sql
-- These columns must exist in the exams table
enable_section_distribution BOOLEAN DEFAULT false
section_distribution JSONB DEFAULT NULL
```

## API Response Format

The `/api/candidate/exams/:id/start` response remains unchanged:
```json
{
  "attempt_id": 123,
  "questions": [
    {
      "id": 1,
      "question_text": "What is 2+2?",
      "option_a": "3",
      "option_b": "4",
      "option_c": "5",
      "option_d": "6",
      "correct_answer": "B",
      "section_id": "Algebra",
      "instruction": "Choose the correct answer",
      "passage": null,
      "is_multi_answer": false,
      "points": 1
    }
    // ... more questions
  ]
}
```

## Summary

✅ Backend updated to support section distribution  
✅ Question selection logic implemented  
✅ Validation and error handling added  
✅ Mobile app works without changes  
✅ Backward compatible  
✅ Well-documented with logs  

The mobile app now fully supports section-based question distribution! 🎉

