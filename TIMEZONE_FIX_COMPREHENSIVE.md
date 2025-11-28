# Comprehensive Timezone Fix

## Problem
Times entered in the exam form (e.g., 12:03 PM) were being shifted by 1 hour (showing as 11:03 AM) when saved and reloaded.

## Root Causes Identified

### 1. **PostgreSQL Timezone Interpretation**
- PostgreSQL was using server timezone to interpret `TIMESTAMP` values
- When sending "2024-11-26T12:03:00", PostgreSQL interpreted it in server timezone
- Server timezone (likely GMT+1) caused 1-hour shifts

### 2. **Node.js pg Driver Date Parsing**
- The `pg` driver automatically parses TIMESTAMP values into JavaScript Date objects
- JavaScript Date objects include timezone information
- This caused automatic conversions back to local timezone

### 3. **Format Conversion Issues**
- Frontend was adding/removing 'Z' incorrectly
- Inconsistent handling of ISO 8601 formats

## Solutions Implemented

### Backend Changes (`backend/database/db.js`)

#### 1. Override Timestamp Parser
```javascript
const types = require('pg').types;

// OID 1114 is TIMESTAMP WITHOUT TIME ZONE
// Return raw string instead of parsing to Date object
types.setTypeParser(1114, (val) => val);
```

**Why:** Prevents automatic Date object creation and timezone conversions

#### 2. Set Connection Timezone to UTC
```javascript
pool.on('connect', (client) => {
  client.query('SET timezone = "UTC"');
});
```

**Why:** Ensures PostgreSQL interprets all timestamps consistently as UTC

### Frontend Changes (`src/pages/CreateExam.jsx`)

#### 1. Format for Backend (On Save)
```javascript
const formatDateForBackend = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  // datetime-local: "2024-11-26T12:03"
  // Send as: "2024-11-26T12:03:00.000" (no timezone)
  return `${dateTimeLocal}:00.000`;
};
```

**Why:** Sends naive datetime without timezone indicator

#### 2. Format for Input (On Load)
```javascript
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  // Receive: "2024-11-26T12:03:00" or "2024-11-26T12:03:00.000Z"
  // Extract: "2024-11-26T12:03"
  const withoutTimezone = dateString.replace('Z', '').split('.')[0];
  return withoutTimezone.substring(0, 16);
};
```

**Why:** Extracts just the datetime part, ignoring timezone

### Backend Logging (`backend/routes/exams.js`)

Added detailed logging to debug:
```javascript
console.log('📅 Dates being updated:', {
  start_date,
  end_date,
  start_parsed: start_date ? new Date(start_date).toString() : null,
  end_parsed: end_date ? new Date(end_date).toString() : null
});
```

## Data Flow

### Creating/Updating Exam

```
Frontend Input:           "12:03" (12:03 PM)
↓
datetime-local value:     "2024-11-26T12:03"
↓
formatDateForBackend:     "2024-11-26T12:03:00.000"
↓
Backend receives:         "2024-11-26T12:03:00.000" (string)
↓
PostgreSQL stores:        2024-11-26 12:03:00 (naive timestamp)
↓
PostgreSQL returns:       "2024-11-26T12:03:00" (string, thanks to parser override)
↓
Frontend receives:        "2024-11-26T12:03:00"
↓
formatDateForInput:       "2024-11-26T12:03"
↓
datetime-local shows:     "12:03" ✅
```

## Testing Guide

### Test 1: Create New Exam
1. Navigate to Create Exam
2. Set Start Date: **Today at 12:03 PM**
3. Set End Date: **Today at 12:45 PM**
4. Add candidates and questions
5. **Save exam**
6. **Expected:** No errors

### Test 2: Verify Saved Times
1. Navigate to My Exams
2. **Edit** the exam you just created
3. **Check Start Date:** Should show **12:03**
4. **Check End Date:** Should show **12:45**
5. **Expected:** Exact times, no shifts ✅

### Test 3: Update Times
1. While editing, change times to:
   - Start: **14:30** (2:30 PM)
   - End: **16:00** (4:00 PM)
2. **Save exam**
3. **Edit again**
4. **Expected:** Shows **14:30** and **16:00** ✅

### Test 4: Check Backend Logs
1. Open backend terminal
2. Look for log: `📅 Dates being updated:`
3. Verify the dates look correct
4. No timezone indicators (Z) should be present

### Test 5: Mobile App Display
1. Open mobile app
2. Check exam list
3. Verify times display correctly
4. **Expected:** Times match what was entered

## What to Check if Still Having Issues

### 1. Check Backend Logs
Look for:
```
📅 Dates being updated: {
  start_date: '2024-11-26T12:03:00.000',
  end_date: '2024-11-26T12:45:00.000',
  start_parsed: 'Tue Nov 26 2024 12:03:00 GMT+0000 (UTC)',
  end_parsed: 'Tue Nov 26 2024 12:45:00 GMT+0000 (UTC)'
}
```

**Check:** Should show **GMT+0000 (UTC)**, not your local timezone

### 2. Check Database Directly
```sql
SELECT id, title, start_date, end_date FROM exams ORDER BY id DESC LIMIT 1;
```

**Expected:**
```
start_date: 2024-11-26 12:03:00
end_date: 2024-11-26 12:45:00
```

(No timezone indicator)

### 3. Check Browser Network Tab
1. Open browser DevTools
2. Go to Network tab
3. Save an exam
4. Check the PUT/POST request payload

**Expected in payload:**
```json
{
  "start_date": "2024-11-26T12:03:00.000",
  "end_date": "2024-11-26T12:45:00.000"
}
```

(No 'Z' at the end)

### 4. Check PostgreSQL Timezone Setting
```sql
SHOW timezone;
```

After our fix, each connection should show: `UTC`

## Technical Details

### PostgreSQL TIMESTAMP Types

1. **TIMESTAMP WITHOUT TIME ZONE** (current)
   - Stores naive datetime (no timezone info)
   - How we store: `2024-11-26 12:03:00`
   - No conversion on storage or retrieval

2. **TIMESTAMP WITH TIME ZONE** (not used)
   - Stores UTC + timezone info
   - Would cause conversions based on session timezone

### Why UTC for Database Connections?

Setting `timezone = "UTC"` ensures:
- Consistent interpretation of timestamp strings
- No ambiguity in timestamp values
- Works the same regardless of server location
- Mobile and web see the same times

### Alternative Approaches (Not Used)

#### Approach 1: TIMESTAMPTZ (Timestamp with Timezone)
```sql
ALTER TABLE exams 
ALTER COLUMN start_date TYPE TIMESTAMPTZ,
ALTER COLUMN end_date TYPE TIMESTAMPTZ;
```

**Pros:** Proper timezone handling  
**Cons:** Would require migration, more complex

#### Approach 2: Store in User's Timezone
**Pros:** More accurate for distributed users  
**Cons:** Need to track timezones per user, complex

#### Approach 3: Convert Everything to UTC
**Pros:** Standard practice  
**Cons:** Confusing for users entering times

**Our Choice:** Keep naive timestamps, treat all as UTC
- Simple
- No user confusion
- Works for single-timezone scenarios
- Easy to migrate to TIMESTAMPTZ later if needed

## Server Configuration

### PostgreSQL Setting
If you need to change the database timezone permanently:
```sql
ALTER DATABASE uiges_db SET timezone TO 'UTC';
```

Then reconnect to apply.

### Node.js pg Library
We're using the `types` module to override OID 1114 (TIMESTAMP) parser.

**Default behavior:**
```javascript
// pg returns: Date object with timezone
const result = await db.query('SELECT start_date FROM exams');
// result.rows[0].start_date is a Date object
```

**Our override:**
```javascript
types.setTypeParser(1114, (val) => val);
// result.rows[0].start_date is a string: "2024-11-26T12:03:00"
```

## Troubleshooting

### Issue: Times still shifting
**Check:**
1. Backend server restarted after changes?
2. Browser cache cleared?
3. Check backend logs for date format

### Issue: Validation errors
**Check:**
1. Dates in correct format: `YYYY-MM-DDTHH:mm`
2. End date after start date
3. No special characters in dates

### Issue: Exams show wrong time on mobile
**Check:**
1. Mobile app receiving correct data (check network)
2. Mobile app date formatting logic
3. Server sending correct format

## Future Enhancements

### 1. Timezone Selection
Allow users to specify their timezone:
```javascript
{
  start_date: "2024-11-26T12:03:00",
  timezone: "America/New_York"
}
```

### 2. Display in Local Time
Show times in user's local timezone:
```javascript
const displayTime = new Date(exam.start_date + 'Z').toLocaleString();
```

### 3. Migration to TIMESTAMPTZ
If needed in future:
```sql
ALTER TABLE exams ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date AT TIME ZONE 'UTC';
```

## Summary

✅ **Fixed:** Timezone conversion issues  
✅ **Method:** Naive timestamps + UTC connection  
✅ **Result:** Times stored exactly as entered  
✅ **Testing:** Comprehensive tests provided  

The system now treats all times as UTC and displays them without conversion. What you enter is what you get!

