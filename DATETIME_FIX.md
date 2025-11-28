# Date & Time Fields Fix

## Issue Fixed
The admin/teacher view was not retaining the **Start Date & Time** and **End Date & Time** fields when editing exams. The dates would be lost when viewing or editing an existing exam.

## Root Cause
1. **Format Mismatch**: Database returns dates in ISO 8601 format (`2024-11-26T10:00:00.000Z`), but HTML5 `datetime-local` inputs require format `2024-11-26T10:00`
2. **Missing Conversion on Load**: When loading an exam for editing, dates weren't being converted to the correct format
3. **Missing Conversion on Save**: When submitting the form, datetime-local values weren't being converted to ISO format for the database

## Changes Made

### Frontend (`src/pages/CreateExam.jsx`)

#### 1. Date Format Conversion on Load
```javascript
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
```

#### 2. Date Format Conversion on Save
```javascript
const formattedData = {
  ...data,
  start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
  end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
};
```

#### 3. Enhanced Validation
- Required field validation for both dates
- Validation to ensure end date is after start date
- Clear error messages for validation failures

### Backend (`backend/routes/exams.js`)

#### 1. Added Date Validation
```javascript
body('start_date').notEmpty().withMessage('Start date is required')
  .isISO8601().withMessage('Invalid start date format'),
body('end_date').notEmpty().withMessage('End date is required')
  .isISO8601().withMessage('Invalid end date format'),
```

#### 2. Date Comparison Validation
- Both CREATE and UPDATE endpoints now validate that end_date > start_date
- Returns clear error message if validation fails

## How to Test

### Test 1: Create New Exam
1. Navigate to **Create Exam** page
2. Fill in all basic details
3. Set **Start Date & Time**: Tomorrow at 9:00 AM
4. Set **End Date & Time**: Tomorrow at 11:00 AM
5. Add at least one candidate and question
6. Click **Save Exam**
7. ✅ Verify exam is created successfully

### Test 2: Edit Existing Exam
1. Navigate to **My Exams**
2. Click **Edit** on an existing exam
3. ✅ Verify Start Date & Time displays correctly in the form
4. ✅ Verify End Date & Time displays correctly in the form
5. Change the dates to new values
6. Click **Save Exam**
7. Edit the exam again
8. ✅ Verify the updated dates are retained and displayed correctly

### Test 3: Date Validation
1. Create or edit an exam
2. Set **End Date & Time** to be BEFORE **Start Date & Time**
3. Try to save
4. ✅ Verify you get an error: "End date must be after start date"

### Test 4: Required Field Validation
1. Create a new exam
2. Leave Start Date or End Date empty
3. Try to save
4. ✅ Verify you get validation errors for required fields

### Test 5: View Existing Exam (Read-Only)
1. Navigate to **My Exams** 
2. Click on an exam to view it
3. ✅ Verify dates are displayed correctly in the exam details

## Database Schema
The dates are stored as PostgreSQL `TIMESTAMP` fields:
```sql
start_date TIMESTAMP NOT NULL,
end_date TIMESTAMP NOT NULL,
```

## Format Flow
```
User Input (datetime-local) → "2024-11-26T10:00"
    ↓ (onSubmit - Convert to ISO)
Backend Receives → "2024-11-26T10:00:00.000Z"
    ↓ (Store in database)
Database Stores → TIMESTAMP
    ↓ (Retrieve from database)
Backend Returns → "2024-11-26T10:00:00.000Z"
    ↓ (loadExam - Convert for input)
User Sees → "2024-11-26T10:00" (in datetime-local input)
```

## Browser Compatibility
The `datetime-local` input type is supported in all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox  
- ✅ Safari
- ✅ Opera

Note: Different browsers may display the datetime picker UI differently, but the underlying value format is standardized.

## Future Considerations

### Timezone Handling
Currently, dates are stored in UTC but displayed in the user's local timezone. This is generally correct behavior, but if you need explicit timezone control, consider:
1. Adding a timezone selector
2. Storing timezone information separately
3. Displaying timezone in the UI

### Date Range Validation
Additional validations could be added:
- Minimum notice period (e.g., exam can't start in the past)
- Maximum duration (e.g., exam can't run for more than X days)
- Business hours restrictions

### Recurring Exams
If you need recurring exams in the future, consider:
- Adding recurrence rules (daily, weekly, etc.)
- Generating multiple exam instances
- Using a more sophisticated date/time library like `date-fns` or `dayjs`

## Technical Notes

### Why Two Conversions?
1. **On Load**: Database → datetime-local format (for the HTML input)
2. **On Save**: datetime-local format → ISO 8601 (for the database)

### Why ISO 8601?
- Standard format for date/time interchange
- Unambiguous (includes timezone)
- Sortable as strings
- Supported by all databases and programming languages

### Testing Checklist
- [x] Dates display correctly when editing
- [x] Dates save correctly when creating
- [x] Dates update correctly when editing
- [x] Validation prevents end date before start date
- [x] Required field validation works
- [x] No console errors
- [x] Backend logs show correct date format

