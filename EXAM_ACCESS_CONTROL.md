# Exam Access Control Implementation

## Overview
This document outlines the access control implementation ensuring only candidates who have been added to an exam can access and take that exam.

## Security Implementation

### Access Control Points

All candidate exam endpoints now verify that the candidate is assigned to the exam via the `exam_candidates` table before allowing any operations.

#### 1. **GET /api/candidate/exams**
- **Status**: ✅ Secured
- **Implementation**: Only returns exams where the candidate exists in `exam_candidates` table
- **Query**: Uses `JOIN` with `exam_candidates` filtered by `candidate_id`

#### 2. **GET /api/candidate/exams/:id** 
- **Status**: ✅ Secured
- **Implementation**: Checks assignment before returning exam details
- **Check**: 
  ```sql
  SELECT 1 FROM exam_candidates 
  WHERE exam_id = $1 AND candidate_id = $2
  ```
- **Response**: 403 Forbidden if not assigned

#### 3. **POST /api/candidate/exams/:id/start**
- **Status**: ✅ Secured
- **Implementation**: Verifies assignment before starting exam
- **Check**: Same query as above
- **Response**: 403 Forbidden if not assigned

#### 4. **POST /api/candidate/exams/:id/save-answer**
- **Status**: ✅ **NEWLY SECURED**
- **Implementation**: Added assignment check before saving answers
- **Check**: Verifies candidate is in `exam_candidates` table
- **Response**: 403 Forbidden if not assigned

#### 5. **POST /api/candidate/exams/:id/submit**
- **Status**: ✅ **NEWLY SECURED**
- **Implementation**: Added assignment check before submitting exam
- **Check**: Verifies candidate is in `exam_candidates` table
- **Response**: 403 Forbidden if not assigned with transaction rollback

#### 6. **GET /api/candidate/exams/:id/result**
- **Status**: ✅ **NEWLY SECURED**
- **Implementation**: Added assignment check before showing results
- **Check**: Verifies candidate is in `exam_candidates` table
- **Response**: 403 Forbidden if not assigned

## Database Schema

### exam_candidates Table
```sql
CREATE TABLE exam_candidates (
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (exam_id, candidate_id)
);
```

This table acts as the authoritative source for exam access control.

## Security Benefits

1. **Prevents Unauthorized Access**: Candidates cannot access exams they haven't been assigned to
2. **Defense in Depth**: Every endpoint checks authorization independently
3. **Consistent Error Handling**: All endpoints return 403 Forbidden with clear error messages
4. **Database-Enforced**: Uses database constraints (PRIMARY KEY) to prevent duplicate assignments

## Error Messages

- **Not Assigned**: `"You are not assigned to this exam"` (403 Forbidden)
- **No Active Attempt**: `"No active exam attempt found"` (404 Not Found)
- **Already Completed**: `"You have already completed this exam"` (400 Bad Request)

## Adding Candidates to Exams

Candidates are added to exams via:
- **Endpoint**: POST /api/exams/:id/candidates
- **Access**: Teachers (owner) and Admins only
- **Payload**: 
  ```json
  {
    "candidates": [
      {
        "name": "Student Name",
        "email": "student@example.com",
        "student_id": "STU001"
      }
    ]
  }
  ```

## Testing the Implementation

### Test Case 1: Assigned Candidate (Success)
```bash
# Candidate assigned to exam
GET /api/candidate/exams/1
Response: 200 OK with exam details

POST /api/candidate/exams/1/start
Response: 200 OK with questions

POST /api/candidate/exams/1/submit
Response: 200 OK with results
```

### Test Case 2: Unassigned Candidate (Failure)
```bash
# Candidate NOT assigned to exam
GET /api/candidate/exams/999
Response: 403 Forbidden
Body: { "error": "You are not assigned to this exam" }

POST /api/candidate/exams/999/start
Response: 403 Forbidden

POST /api/candidate/exams/999/save-answer
Response: 403 Forbidden

POST /api/candidate/exams/999/submit
Response: 403 Forbidden

GET /api/candidate/exams/999/result
Response: 403 Forbidden
```

## Code Changes

### File: backend/routes/candidate.js

**Lines 260-268**: Added assignment check to save-answer endpoint
**Lines 319-328**: Added assignment check to submit endpoint  
**Lines 434-442**: Added assignment check to result endpoint

Each check follows the same pattern:
1. Query `exam_candidates` table for matching record
2. Return 403 if no match found
3. Continue with normal operation if authorized

## Maintenance Notes

- The `exam_candidates` table uses `ON DELETE CASCADE` to automatically clean up assignments when exams or candidates are deleted
- All checks use the authenticated user's ID from `req.user.id` (set by JWT middleware)
- Transaction handling is properly implemented where needed (submit endpoint)

## Future Enhancements

Potential improvements to consider:
1. **Time-based Access**: Add start/end date validation for exam availability
2. **Attempt Limits**: Enforce maximum attempts per candidate
3. **IP Whitelisting**: Restrict exam access by IP address if needed
4. **Audit Logging**: Log all access attempts (successful and failed)

---

**Last Updated**: November 13, 2025  
**Status**: ✅ Complete and Secure

