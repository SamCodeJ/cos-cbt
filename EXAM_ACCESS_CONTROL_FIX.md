# Exam Access Control Fix

## Issue Fixed
Candidates were able to start exams with 'scheduled' status before the scheduled time. This was a security vulnerability that allowed unauthorized access to exams.

## Root Cause
The `/api/candidate/exams/:id/start` endpoint did not validate:
1. **Exam Status**: Should only allow 'active' exams
2. **Start Time**: Current time should be >= start_date
3. **End Time**: Current time should be <= end_date

## Changes Made

### Backend (`backend/routes/candidate.js`)

#### 1. Start Exam Endpoint - Access Control
Added comprehensive validation in `POST /api/candidate/exams/:id/start`:

```javascript
// Check if exam is active
if (exam.status !== 'active') {
  let message = 'This exam is not available yet';
  if (exam.status === 'draft') {
    message = 'This exam is still in draft...';
  } else if (exam.status === 'scheduled') {
    message = `This exam is scheduled to start on ${startDate.toLocaleString()}...`;
  } else if (exam.status === 'completed') {
    message = 'This exam has been completed...';
  }
  return res.status(403).json({ error: message });
}

// Check if current time is within exam window
if (now < startDate) {
  return res.status(403).json({ 
    error: `This exam starts on ${startDate.toLocaleString()}...` 
  });
}

if (now > endDate) {
  return res.status(403).json({ 
    error: `This exam ended on ${endDate.toLocaleString()}...` 
  });
}
```

#### 2. Get Exams List - Availability Information
Enhanced `GET /api/candidate/exams` to include availability info:

```javascript
const examsWithAvailability = result.rows.map(exam => {
  const startDate = new Date(exam.start_date);
  const endDate = new Date(exam.end_date);
  const now = new Date();
  
  let is_available = exam.status === 'active' && now >= startDate && now <= endDate;
  let availability_message = null;
  
  // Set appropriate message based on status and time
  ...
  
  return {
    ...exam,
    is_available,
    availability_message
  };
});
```

#### 3. Get Exam Details - Availability Status
Enhanced `GET /api/candidate/exams/:id` to include availability status for single exam views.

### Mobile App (`mobile/src/screens/DashboardScreen.js`)

#### 1. Availability Banner
Added visual indicator when exam is not available:

```jsx
{exam.availability_message && !exam.has_taken && (
  <View style={styles.availabilityBanner}>
    <Text style={styles.availabilityText}>
      {exam.availability_message}
    </Text>
  </View>
)}
```

#### 2. Disabled Start Button
Start button now respects availability:

```jsx
<Button
  mode="contained"
  disabled={!exam.is_available}
  buttonColor={exam.is_available ? '#d97706' : '#94a3b8'}
>
  {exam.is_available ? 'Start Exam' : 'Not Available'}
</Button>
```

## Access Rules

### Exam Status Requirements

| Status | Can Start? | Reason |
|--------|-----------|---------|
| `draft` | ❌ No | Exam not published yet |
| `scheduled` | ❌ No | Must wait until start_date |
| `active` | ✅ Yes* | *Only if within time window |
| `completed` | ❌ No | Exam has ended |

### Time Window Requirements

For an **active** exam, candidates can only start if:
- Current time >= `start_date` AND
- Current time <= `end_date`

## Error Messages

### Backend Error Responses

**Draft Exam:**
```json
{
  "error": "This exam is still in draft. Please wait for your teacher to activate it."
}
```

**Scheduled Exam (before start time):**
```json
{
  "error": "This exam is scheduled to start on Nov 26, 2024, 2:00 PM. Please wait until the scheduled time."
}
```

**Active Exam (before start_date):**
```json
{
  "error": "This exam starts on Nov 26, 2024, 2:00 PM. Please try again at that time."
}
```

**Active Exam (after end_date):**
```json
{
  "error": "This exam ended on Nov 26, 2024, 4:00 PM. You can no longer take this exam."
}
```

**Completed Exam:**
```json
{
  "error": "This exam has been completed and is no longer available."
}
```

## Testing Guide

### Test 1: Scheduled Exam Before Start Time
1. Create an exam with status 'scheduled'
2. Set start_date to future time (e.g., tomorrow)
3. Assign candidate to exam
4. Login as candidate on mobile app
5. **Expected Result:**
   - ⚠️ Yellow banner showing "Starts [date/time]"
   - "Not Available" button (disabled, gray)
   - Clicking button does nothing
6. Try to start via API directly
7. **Expected Result:** 403 error with appropriate message

### Test 2: Scheduled Exam At/After Start Time
1. Use same exam from Test 1
2. Change status to 'active'
3. Set start_date to current time or past
4. Set end_date to future time
5. Refresh mobile app
6. **Expected Result:**
   - No warning banner
   - "Start Exam" button (enabled, orange)
   - Can successfully start exam

### Test 3: Active Exam Before Time Window
1. Create exam with status 'active'
2. Set start_date to 1 hour in future
3. Set end_date to 2 hours in future
4. Try to start as candidate
5. **Expected Result:** 403 error "This exam starts on..."

### Test 4: Active Exam After Time Window
1. Create exam with status 'active'
2. Set start_date to 2 hours ago
3. Set end_date to 1 hour ago
4. Try to start as candidate
5. **Expected Result:** 403 error "This exam ended on..."

### Test 5: Draft Exam
1. Create exam with status 'draft'
2. Try to start as candidate
3. **Expected Result:**
   - Banner: "Not yet published"
   - Cannot start exam
   - 403 error if attempted via API

### Test 6: Completed Exam
1. Create exam with status 'completed'
2. Try to start as candidate
3. **Expected Result:**
   - Banner: "Exam has ended" or "Completed"
   - Cannot start exam
   - 403 error if attempted via API

### Test 7: Resume In-Progress Exam
1. Start an exam successfully (active, within time window)
2. Close app without submitting
3. Reopen app and try to start same exam
4. **Expected Result:** Successfully resumes with existing questions

## Security Considerations

### Server-Side Validation (✅ Implemented)
- All validation happens on the backend
- Cannot be bypassed by modifying mobile app
- Validation occurs at the database query level
- Transaction rollback on validation failure

### Client-Side Enhancement (✅ Implemented)
- Mobile UI prevents obvious invalid attempts
- Improves user experience with clear messaging
- Does NOT replace server-side validation
- Availability info refreshes with pull-to-refresh

### Attack Vectors Prevented
1. ❌ **Direct API calls**: Backend validates all requests
2. ❌ **Modified mobile app**: Server-side validation enforced
3. ❌ **Time manipulation**: Server uses server time, not client time
4. ❌ **Status bypass**: Status check is mandatory before exam start

## Workflow Example

### Teacher Workflow
1. Create exam → Status: 'draft'
2. Add questions and candidates
3. Set start_date: Nov 26, 2024, 2:00 PM
4. Set end_date: Nov 26, 2024, 4:00 PM
5. Change status to 'scheduled' (candidates can see it but not start)
6. At 2:00 PM, change status to 'active' (candidates can now start)
7. After 4:00 PM, candidates can no longer start (automatic)
8. Change status to 'completed' when done reviewing results

### Candidate Experience
- **Before 2:00 PM**: Sees exam, banner shows "Starts Nov 26, 2:00 PM", button disabled
- **2:00 PM - 4:00 PM** (if active): Can start exam, no banner, button enabled
- **After 4:00 PM**: Cannot start, banner shows "Ended Nov 26, 4:00 PM"

## Status vs. Time Window

**Important Distinction:**
- **Status** = Teacher control (draft, scheduled, active, completed)
- **Time Window** = Automatic enforcement (start_date to end_date)

Both must be satisfied:
- Status must be 'active'
- Current time must be within [start_date, end_date]

## Future Enhancements

### Automatic Status Updates
Consider implementing a scheduled job to:
- Auto-change 'scheduled' → 'active' at start_date
- Auto-change 'active' → 'completed' at end_date

### Grace Period
- Allow 5-10 minute buffer after end_date for in-progress attempts
- Prevent new starts but allow submission of started exams

### Time Zone Support
- Currently uses server timezone
- Consider adding explicit timezone selection
- Display times in candidate's local timezone

### Notification System
- Send push notification when exam becomes available
- Remind candidates before exam ends
- Alert on status changes

## Technical Notes

### Date Comparisons
```javascript
const now = new Date();
const startDate = new Date(exam.start_date);
const endDate = new Date(exam.end_date);

// Within window check
const isWithinWindow = now >= startDate && now <= endDate;
```

### Transaction Safety
All validation happens within a database transaction:
```javascript
const client = await db.getClient();
await client.query('BEGIN');
// ... validations and operations ...
await client.query('COMMIT'); // or ROLLBACK on error
```

### Performance
- Availability calculations done in-memory (fast)
- No additional database queries for time checks
- Date objects created once per exam
- Minimal overhead on list/detail endpoints

## Migration Notes

### Existing Exams
- All existing exams should have status and dates set
- Review 'scheduled' exams and update status as needed
- Check that date ranges are logical (end > start)

### Database Constraints
Existing schema already has constraints:
```sql
status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed'))
start_date TIMESTAMP NOT NULL
end_date TIMESTAMP NOT NULL
```

No migration needed - validation layer only.

