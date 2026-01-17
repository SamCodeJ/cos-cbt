# Student ID Per-Exam Uniqueness - Update

## Important Change

The system has been updated so that **Student IDs are unique per exam**, not system-wide.

## What This Means

### ✅ Allowed
- **Same student can take multiple exams** with the same Student ID
- Student `STU001` can be in "Mathematics Exam"
- Student `STU001` can be in "English Exam"  
- Student `STU001` can be in "Science Exam"

### ❌ Not Allowed
- **Same student cannot take the same exam twice**
- Student `STU001` cannot be in "Mathematics Exam" twice

## How It Works

### Before (System-Wide Unique)
```
Database Constraint: Each Student ID must be unique across ALL candidates
Result: STU001 can only belong to ONE candidate in the entire system
Problem: Same student cannot be added to multiple exams
```

### After (Per-Exam Unique)
```
Application Validation: Student ID must be unique within each exam
Result: STU001 can be in multiple exams, but not twice in the same exam
Benefit: Students can take multiple exams with the same Student ID
```

## Database Changes

### Removed
- ❌ System-wide unique constraint on `student_id`
- ❌ Check constraint requiring all candidates to have `student_id`
- ❌ Backend validation preventing duplicate `student_id` in database

### Added
- ✅ Non-unique index on `student_id` (for fast lookups)
- ✅ Validation: Student ID unique per exam (application level)
- ✅ Existing constraint: `UNIQUE(exam_id, candidate_id)` prevents duplicate assignments

## Validation Logic

### When Adding Candidates to Exam

**3 Checks Performed:**

1. **Duplicate in Upload Batch**
   - Checks if same Student ID appears multiple times in CSV
   - Error: "Duplicate Student IDs found in upload file"

2. **Already in This Exam**
   - Checks if Student ID is already assigned to THIS specific exam
   - Error: "Student ID already assigned to this exam: STU001 (John Doe)"

3. **Empty Student ID**
   - Checks if Student ID is provided
   - Error: "Student ID is required for candidate"

**Removed Check:**
- ~~System-wide duplicate check~~ (no longer needed)

## Migration Guide

### Apply the Update

```bash
cd backend
node database/migrations/apply-student-id-per-exam.js
```

This will:
- Remove system-wide unique constraint
- Add non-unique index for performance
- Preserve all existing data

### Verify Changes

```sql
-- Check that same student_id can exist multiple times
SELECT student_id, COUNT(*) as exam_count, string_agg(name, ', ') as names
FROM users 
WHERE role = 'candidate' AND student_id IS NOT NULL
GROUP BY student_id;

-- Verify a student cannot be in same exam twice
SELECT ec.exam_id, e.title, u.student_id, u.name, COUNT(*) as times
FROM exam_candidates ec
JOIN users u ON ec.candidate_id = u.id
JOIN exams e ON ec.exam_id = e.id
GROUP BY ec.exam_id, e.title, u.student_id, u.name
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

## Login Behavior

**Login still works the same way:**
```javascript
POST /api/candidate/auth/login
{
  "student_id": "STU001",
  "password": "password123"
}
```

**What happens:**
- System finds candidate with Student ID `STU001`
- Verifies password
- Returns token
- Candidate can see all exams they're assigned to

**Note:** If multiple candidates have the same `student_id`, the first one found will be used for login. It's recommended to keep student IDs unique per actual student for login purposes.

## Use Cases

### Scenario 1: Regular Student Taking Multiple Exams
```
John Doe (STU001):
  - Added to "Math Exam" ✅
  - Added to "English Exam" ✅
  - Tries to join "Math Exam" again ❌ (blocked)
```

### Scenario 2: CSV Upload with Multiple Students
```csv
name,email,student_id
John Doe,john@example.com,STU001
Jane Smith,jane@example.com,STU002
```
- Upload to "Math Exam" ✅
- Same CSV to "English Exam" ✅ (same students, different exam)
- Same CSV to "Math Exam" again ❌ (already in that exam)

### Scenario 3: Duplicate Student ID in Batch
```csv
name,email,student_id
John Doe,john@example.com,STU001
Jane Smith,jane@example.com,STU001  ← Same ID!
```
- Upload blocked ❌ (duplicate in file itself)
- Error: "Duplicate Student IDs found in upload file: STU001"

## API Examples

### Adding Candidate to Multiple Exams

**Add to Math Exam:**
```javascript
POST /api/exams/1/candidates
{
  "candidates": [
    { "name": "John Doe", "email": "john@example.com", "student_id": "STU001" }
  ]
}
// Response: 201 Created ✅
```

**Add Same Student to English Exam:**
```javascript
POST /api/exams/2/candidates
{
  "candidates": [
    { "name": "John Doe", "email": "john@example.com", "student_id": "STU001" }
  ]
}
// Response: 201 Created ✅ (allowed - different exam)
```

**Try Adding to Math Exam Again:**
```javascript
POST /api/exams/1/candidates
{
  "candidates": [
    { "name": "John Doe", "email": "john@example.com", "student_id": "STU001" }
  ]
}
// Response: 400 Bad Request ❌
// Error: "Student ID already assigned to this exam: STU001 (John Doe)"
```

## Benefits

### ✅ Flexibility
- Students can take multiple exams
- No need for separate accounts per exam
- Simplifies exam management

### ✅ Data Integrity
- Cannot assign same student to exam twice
- Clear error messages
- Transaction-safe operations

### ✅ Performance
- Non-unique index allows fast lookups
- Validation happens before database operations
- No performance degradation

## Rollback (If Needed)

To revert to system-wide uniqueness:

```sql
-- Re-create unique constraint
CREATE UNIQUE INDEX idx_unique_student_id_candidates 
ON users (student_id) 
WHERE role = 'candidate' AND student_id IS NOT NULL;

-- Remove non-unique index
DROP INDEX IF EXISTS idx_users_student_id;
```

**Warning:** This will fail if you have students with duplicate student IDs!

## Testing

### Test 1: Add Student to Multiple Exams
1. Create two exams
2. Add candidate with `STU001` to first exam ✅
3. Add same candidate to second exam ✅
4. Verify both assignments successful

### Test 2: Prevent Double Assignment
1. Add candidate with `STU001` to an exam ✅
2. Try adding `STU001` to same exam again ❌
3. Should get error message

### Test 3: Batch Upload Validation
1. Create CSV with duplicate student IDs
2. Try uploading to exam ❌
3. Should get "Duplicate Student IDs found in upload file"

### Test Script
```bash
cd backend
node test-duplicate-student-ids.js
```

## FAQ

**Q: Can the same person have multiple Student IDs?**  
A: No, each candidate should have one Student ID, but they can use it for multiple exams.

**Q: What if I want student IDs to be unique system-wide?**  
A: Run the rollback script above, but note this prevents students from taking multiple exams.

**Q: Does this affect login?**  
A: No, login works the same way with Student ID + password.

**Q: Can I see which exams a student is in?**  
A: Yes, query: 
```sql
SELECT e.title, e.start_date 
FROM exam_candidates ec 
JOIN exams e ON ec.exam_id = e.id 
JOIN users u ON ec.candidate_id = u.id 
WHERE u.student_id = 'STU001';
```

---

**Updated:** January 2026  
**Status:** ✅ Implemented  
**Related:** `DUPLICATE_STUDENT_ID_PREVENTION.md`
