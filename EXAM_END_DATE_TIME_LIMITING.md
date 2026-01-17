# Exam End Date Time Limiting Feature

## Overview
This feature ensures that students who start an exam late cannot exceed the exam's official end time (`end_date`). Students are given the **minimum** of either the exam duration or the time remaining until the exam closes.

## Problem Statement
Previously, when a student started an exam, they would receive the full exam duration (+ any time extensions) regardless of how much time remained until the exam's `end_date`. This meant:

- If exam duration = 60 minutes and exam closes in 20 minutes
- Student would get 60 minutes (extending 40 minutes past the exam end time) ❌

## Solution
The system now calculates the student's available time by considering both:
1. **Allocated Time** = Base Duration + Global Extensions + Individual Extensions
2. **Time Until Exam Closes** = exam.end_date - current_time

**Student gets**: `MIN(Allocated Time, Time Until Exam Closes)`

## Implementation Details

### 1. Start Exam Endpoint (`POST /api/candidate/exams/:id/start`)

#### New Exam Start
```javascript
// Query now includes end_date and calculates minutes until exam closes
const examTimeDetails = await client.query(`
  SELECT 
    e.duration,
    e.global_time_extension_minutes,
    e.end_date,
    ea.time_extension_minutes,
    EXTRACT(EPOCH FROM (e.end_date - CURRENT_TIMESTAMP))/60 as minutes_until_exam_closes
  FROM exams e
  JOIN exam_attempts ea ON ea.exam_id = e.id
  WHERE e.id = $1 AND ea.id = $2
`, [id, attemptId]);

const allocatedTime = baseDuration + globalExtension + individualExtension;
const minutesUntilExamCloses = parseFloat(timeData.minutes_until_exam_closes) || 0;

// Give student the minimum of the two
const totalDuration = Math.min(allocatedTime, Math.ceil(minutesUntilExamCloses));
const timeRemainingSeconds = Math.max(0, totalDuration * 60);
```

#### Resuming Existing Attempt
```javascript
// Calculate remaining from allocation
const remainingFromAllocation = Math.max(0, allocatedTime - elapsedMinutes);

// But also respect the exam's end_date - give whichever is less
const actualRemaining = Math.min(remainingFromAllocation, minutesUntilExamCloses);
const remainingSeconds = Math.max(0, Math.floor(actualRemaining * 60));
```

### 2. Time Remaining Endpoint (`GET /api/candidate/exams/:id/time-remaining`)

This endpoint polls every 30 seconds during the exam. It also now considers the exam end_date:

```javascript
// For not-started exams
const availableTime = Math.min(allocatedTime, Math.ceil(minutesUntilExamCloses));

// For in-progress exams
const remainingFromAllocation = Math.max(0, allocatedTime - elapsedMinutes);
const actualRemaining = Math.min(remainingFromAllocation, minutesUntilExamCloses);
```

### 3. Response Format

Both endpoints now return:
```json
{
  "time_remaining_seconds": 600,
  "total_duration_minutes": 10,
  "limited_by_end_date": true
}
```

The `limited_by_end_date` flag indicates whether the student's time was capped by the exam's end_date.

## Example Scenarios

### Scenario 1: Student Starts On Time
```
Exam Details:
- Duration: 60 minutes
- Start: 9:00 AM
- End: 11:00 AM
- No extensions

Student logs in at: 9:05 AM
- Allocated time: 60 minutes
- Time until exam closes: 115 minutes (11:00 AM - 9:05 AM)
- Student gets: MIN(60, 115) = 60 minutes ✅
- Student can work until: 10:05 AM
```

### Scenario 2: Student Starts Late
```
Exam Details:
- Duration: 60 minutes
- Start: 9:00 AM
- End: 11:00 AM
- No extensions

Student logs in at: 10:30 AM
- Allocated time: 60 minutes
- Time until exam closes: 30 minutes (11:00 AM - 10:30 AM)
- Student gets: MIN(60, 30) = 30 minutes ✅
- Student can work until: 11:00 AM (exam end time)
- limited_by_end_date: true
```

### Scenario 3: Student Starts Very Late
```
Exam Details:
- Duration: 60 minutes
- Start: 9:00 AM
- End: 11:00 AM
- Extensions: +10 minutes

Student logs in at: 10:55 AM
- Allocated time: 70 minutes (60 + 10)
- Time until exam closes: 5 minutes (11:00 AM - 10:55 AM)
- Student gets: MIN(70, 5) = 5 minutes ✅
- Student can work until: 11:00 AM (exam end time)
- limited_by_end_date: true
```

### Scenario 4: Student Resumes After Crash
```
Exam Details:
- Duration: 60 minutes
- Start: 9:00 AM
- End: 11:00 AM

Student started at: 9:30 AM
App crashed, student rejoins at: 10:15 AM
- Allocated time: 60 minutes
- Elapsed time: 45 minutes (10:15 AM - 9:30 AM)
- Remaining from allocation: 15 minutes (60 - 45)
- Time until exam closes: 45 minutes (11:00 AM - 10:15 AM)
- Student gets: MIN(15, 45) = 15 minutes ✅
- Student can work until: 10:30 AM
```

### Scenario 5: Teacher Extends Time During Exam
```
Exam Details:
- Duration: 60 minutes
- Start: 9:00 AM
- End: 11:00 AM

Student started at: 9:00 AM
At 10:30 AM, teacher adds 30-minute global extension
Student's timer polls at 10:30 AM:
- Allocated time: 90 minutes (60 + 30)
- Elapsed time: 90 minutes (10:30 AM - 9:00 AM)
- Remaining from allocation: 0 minutes
- Time until exam closes: 30 minutes (11:00 AM - 10:30 AM)
- Student gets: MIN(0, 30) = 0 minutes

Wait... this would end the exam! ❌

To support mid-exam extensions properly, teachers should also extend the end_date.
```

## Important Notes

### End Date Must Be Extended Too
If a teacher wants to give students more time **during** an exam, they must:
1. Add time extension (global or individual)
2. **Also extend the exam's end_date**

Otherwise, students who have already used their allocated time will not benefit from the extension if the exam end_date is approaching.

### Polling Frequency
The mobile app polls the `/time-remaining` endpoint every 30 seconds. This means:
- Time limits due to end_date are enforced dynamically
- If exam end_date changes, students will see the updated time within 30 seconds

### Auto-Submit
The mobile app auto-submits when:
- Timer reaches 0 (which now considers end_date)
- This ensures all students finish by the exam's end_date

## Database Schema
No changes required. We use existing fields:
```sql
exams (
  duration INTEGER NOT NULL,           -- Base duration in minutes
  start_date TIMESTAMP NOT NULL,       -- When exam opens
  end_date TIMESTAMP NOT NULL,         -- When exam closes (hard deadline)
  global_time_extension_minutes INTEGER DEFAULT 0
)

exam_attempts (
  started_at TIMESTAMP,                -- When student started
  time_extension_minutes INTEGER DEFAULT 0
)
```

## Testing Recommendations

### Test 1: Late Start
1. Create exam: 60 min duration, ends in 30 minutes
2. Student starts exam
3. ✅ Verify student gets 30 minutes (not 60)
4. ✅ Verify timer shows 30:00

### Test 2: Very Late Start
1. Create exam: 60 min duration, ends in 5 minutes
2. Student starts exam
3. ✅ Verify student gets 5 minutes
4. ✅ Verify exam auto-submits after 5 minutes

### Test 3: Resume After Late Start
1. Student starts late (gets 20 minutes instead of 60)
2. Student uses 10 minutes
3. App crashes and student rejoins
4. ✅ Verify student gets remaining 10 minutes

### Test 4: On-Time Start
1. Create exam: 60 min duration, starts now, ends in 2 hours
2. Student starts immediately
3. ✅ Verify student gets full 60 minutes
4. ✅ Verify `limited_by_end_date: false`

## Console Logs
The implementation includes detailed logging:

```
⏱️ Time calculation for new exam start: {
  baseDuration: 60,
  globalExtension: 0,
  individualExtension: 0,
  allocatedTime: '60 minutes',
  minutesUntilExamCloses: '30.00 minutes',
  givenTime: '30 minutes (1800 seconds)',
  limited: true
}
```

Monitor these logs during testing to verify correct behavior.

## Related Files
- `backend/routes/candidate.js` - All time calculation logic
- `mobile/src/screens/ExamScreen.js` - Receives and uses time_remaining_seconds
- `backend/database/schema.sql` - Database schema (no changes)

## Future Enhancements
- Add UI warning when student starts exam with limited time
- Show countdown to exam end_date on exam list page
- Auto-notify students when exam is about to close
- Prevent starting exam if less than X minutes remain

---

**Implementation Date**: January 17, 2026
**Status**: ✅ Complete and Ready for Testing
