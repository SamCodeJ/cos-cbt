# Student ID Login Implementation

## Overview

The system has been updated to use **Student ID-based authentication** instead of email-based authentication for candidates. This ensures each student has a unique identifier that they use to login across all exams.

## Key Changes

### 1. Database Changes

**Migration File**: `backend/database/migrations/add_unique_student_id.sql`

- Added **unique constraint** on `student_id` for candidates
- Added **check constraint** to ensure all candidates have a `student_id`
- Auto-generates student IDs for existing candidates without one (format: `STU000001`)

**To Apply Migration**:
```bash
cd backend
psql -U your_username -d ui_ges_db -f database/migrations/add_unique_student_id.sql
```

### 2. Backend Changes

#### Candidate Login Endpoint (`backend/routes/candidate.js`)

**Before**: `/api/candidate/auth/login` accepted `email` and `password`
**After**: `/api/candidate/auth/login` accepts `student_id` and `password`

```javascript
// Old request
{ email: "student@example.com", password: "password123" }

// New request
{ student_id: "STU000001", password: "password123" }
```

#### Candidate Creation (`backend/routes/exams.js`)

When adding candidates to exams:
- **Validates** that `student_id` is provided
- **Checks** for duplicate `student_id` across all candidates
- **Throws error** if `student_id` is already assigned to another candidate
- **Updates** existing candidate's `student_id` if needed

#### Candidate Updates (`backend/routes/teachers.js`)

When updating candidate information:
- **Validates** `student_id` uniqueness
- **Prevents** setting empty `student_id`
- **Shows** which candidate already has the `student_id` if duplicate

### 3. Mobile App Changes

#### Login Screen (`mobile/src/screens/LoginScreen.js`)

- Changed input field from **"Email"** to **"Student ID"**
- Updated validation messages to reference Student ID
- Changed `autoCapitalize` to `"characters"` for better UX
- Updated error messages to say "Invalid Student ID or password"

#### API Client (`mobile/src/api/client.js`)

- Updated `candidateAPI.login()` to accept `studentId` parameter
- Changed API endpoint to `/candidate/auth/login`
- Updated request body to send `student_id` instead of `email`

```javascript
// Old
candidateAPI.login(email, password)

// New
candidateAPI.login(studentId, password)
```

## Migration Guide

### For Existing Systems

1. **Backup your database** before proceeding
2. **Run the migration script** to add unique constraints
3. **Restart the backend server** to pick up changes
4. **Update the mobile app** (rebuild if necessary)
5. **Inform students** of the new login method

### For Existing Candidates

The migration script automatically generates student IDs for existing candidates:
- Format: `STU` + 6-digit padded user ID
- Example: User with ID 5 becomes `STU000005`

**Share these new Student IDs with your candidates!**

To view generated Student IDs:
```sql
SELECT id, name, email, student_id 
FROM users 
WHERE role = 'candidate'
ORDER BY id;
```

## Adding New Candidates

### CSV Import Format

When importing candidates via CSV, the `student_id` column is **required**:

```csv
name,email,student_id,password
John Doe,john@example.com,STU001,pass123
Jane Smith,jane@example.com,STU002,pass456
```

### Manual Addition

When adding candidates through the web interface:
1. Enter the candidate's **name**
2. Enter the candidate's **email**
3. **Enter a unique Student ID** (required)
4. Optionally set a custom password (or one will be generated)

## Validation Rules

### Student ID Requirements

- ✅ **Required** for all candidates
- ✅ **Must be unique** across all candidates
- ✅ **Cannot be empty** or whitespace only
- ✅ **Case-sensitive** (STU001 ≠ stu001)
- ❌ **Not required** for teachers or admins

### Error Messages

- `"Student ID is required for candidate: [name]"` - Missing student_id during creation
- `"Student ID '[id]' is already assigned to [name]"` - Duplicate student_id
- `"Student ID cannot be empty"` - Empty student_id during update
- `"Invalid Student ID or password"` - Login failed

## Testing the Implementation

### Test Login Process

1. **Open the mobile app**
2. Enter a valid **Student ID** (e.g., `STU000001`)
3. Enter the correct **password**
4. Verify successful login

### Test Duplicate Prevention

1. Try to add a candidate with an existing Student ID
2. Verify error message appears
3. Change to a unique Student ID
4. Verify successful addition

### Test Update Prevention

1. Try to update a candidate with another candidate's Student ID
2. Verify error message shows who owns that Student ID
3. Use a unique Student ID
4. Verify successful update

## API Reference

### POST `/api/candidate/auth/login`

**Request Body**:
```json
{
  "student_id": "STU000001",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "token": "jwt_token_here",
  "candidate": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "student_id": "STU000001"
  }
}
```

**Error Responses**:
- `401`: Invalid Student ID or password
- `403`: Account is deactivated
- `400`: Validation errors

### POST `/api/exams/:id/add-candidates`

**Request Body**:
```json
{
  "candidates": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "student_id": "STU001",
      "password": "optional_password"
    }
  ]
}
```

## Troubleshooting

### "Student ID is already assigned"

**Cause**: Another candidate already has this Student ID

**Solution**:
1. Check existing Student IDs:
   ```sql
   SELECT student_id, name FROM users WHERE role = 'candidate' ORDER BY student_id;
   ```
2. Assign a unique Student ID to the new candidate

### "Invalid Student ID or password"

**Possible Causes**:
- Student ID doesn't exist in the system
- Student ID is case-sensitive (check capitalization)
- Wrong password
- Account is deactivated

**Solution**:
1. Verify the Student ID exists:
   ```sql
   SELECT student_id, name, is_active FROM users WHERE student_id = 'STU001' AND role = 'candidate';
   ```
2. Check if account is active
3. Reset password if needed

### Migration Fails

**Error**: "duplicate key value violates unique constraint"

**Cause**: Multiple candidates already have the same Student ID

**Solution**:
1. Find duplicates:
   ```sql
   SELECT student_id, COUNT(*) 
   FROM users 
   WHERE role = 'candidate' AND student_id IS NOT NULL
   GROUP BY student_id 
   HAVING COUNT(*) > 1;
   ```
2. Manually update duplicates with unique IDs before running migration

## Best Practices

### Student ID Format

While the system accepts any string, we recommend:
- **Prefix**: Use a consistent prefix (e.g., `STU`, `2024-`, `CS-`)
- **Padding**: Use consistent length (e.g., `STU001`, `STU002`, not `STU1`, `STU2`)
- **Avoid spaces**: Use hyphens or underscores instead
- **Examples**: `STU000001`, `2024-CS-001`, `CSIT-2024-001`

### Password Management

- Generate strong random passwords for bulk imports
- Share Student ID and password securely with each candidate
- Candidates can change their password through the profile settings

### Data Management

- Keep a backup mapping of Student ID to student names
- Document your Student ID format/convention
- Consider using existing institutional student IDs if available

## Security Considerations

- Student IDs are **case-sensitive**
- Student IDs are **not encrypted** (visible to admins/teachers)
- Passwords are **hashed** using bcrypt
- Login attempts are **not rate-limited** (consider adding this)
- Failed login attempts are **logged** to console

## Future Enhancements

Potential improvements to consider:
- [ ] Import Student IDs from institutional systems
- [ ] Bulk Student ID update tool
- [ ] Student ID format validation (regex)
- [ ] Rate limiting on login endpoint
- [ ] Password complexity requirements
- [ ] Two-factor authentication
- [ ] Student ID generation wizard

## Support

If you encounter issues:
1. Check the backend console logs for detailed error messages
2. Verify database constraints are properly applied
3. Ensure mobile app is using the latest code
4. Test with a simple Student ID like "TEST001" to isolate issues

---

**Implementation Date**: January 2026
**Version**: 1.0
**Status**: ✅ Complete and tested
