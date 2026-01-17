# ⏰ Time Extension Feature

This feature allows teachers to add extra time to examinations while students are taking them. Time can be extended for all students or for specific individuals.

## 🚀 Setup Instructions

### 1. Apply Database Migration

Before using this feature, you need to apply the database migration:

```bash
# Navigate to backend directory
cd backend

# Option A: Using the migration script (recommended)
node database/migrations/apply-time-extension.js

# Option B: Using psql directly
psql -U postgres -d ui_ges -f database/migrations/add_time_extension.sql
```

**Note:** Make sure to update the database credentials in your `.env` file or adjust them in the migration script.

### 2. Restart Backend Server

After applying the migration, restart your backend server:

```bash
cd backend
npm run dev
```

### 3. Verify Installation

The migration adds two new columns:
- `exams.global_time_extension_minutes` - Time added for all students
- `exam_attempts.time_extension_minutes` - Time added for individual students

## 📖 How to Use

### For Teachers (Web Portal)

#### Extending Time for All Students

1. Navigate to **"My Exams"** page
2. Find the exam you want to extend time for
3. Click the **three dots menu (⋮)** next to the exam
4. Select **"Extend Time"** (only visible for Active/Scheduled exams)
5. In the modal:
   - Enter the number of minutes to add in the "Additional Minutes" field
   - Click **"Extend All"** button
6. All students currently taking or yet to start the exam will receive the extra time

#### Extending Time for Individual Students

1. Open the **"Extend Time"** modal for an exam (same steps as above)
2. Scroll to the **"Active Students"** section
3. Find the student you want to extend time for
4. Enter the number of minutes in the input field next to their name
5. Click the **"Add"** button
6. That specific student will receive the extra time

### For Students (Mobile App)

Students don't need to do anything special:

1. The exam timer will automatically update when the teacher extends time
2. A notification will appear: "⏰ Time Extended - Your teacher has added X minute(s) to your exam time!"
3. The timer will reflect the new remaining time
4. Time extensions are checked every 30 seconds automatically

## 🎯 Features

### Global Time Extension
- ✅ Extends time for ALL students in an exam
- ✅ Applies to students currently taking the exam
- ✅ Applies to students who haven't started yet
- ✅ Cumulative (can extend multiple times)
- ✅ Shows total extension amount

### Individual Time Extension
- ✅ Extends time for a specific student only
- ✅ Only affects students who have started the exam
- ✅ Cumulative with global extensions
- ✅ Each student can have different amounts of extra time
- ✅ Shows time remaining for each active student

### Real-Time Updates
- ✅ Students receive time extensions without refreshing
- ✅ Automatic polling every 30 seconds
- ✅ In-app notification when time is extended
- ✅ Timer updates seamlessly

## 📊 UI Components

### Teacher Modal Features

The Time Extension Modal shows:

1. **Global Extension Section** (Top)
   - Input field for minutes
   - "Extend All" button
   - Information about who will be affected

2. **Active Students Section**
   - List of students currently taking the exam
   - Shows time remaining for each student
   - Individual extension input and button for each student
   - Color-coded time remaining:
     - 🟢 Green: More than 10 minutes remaining
     - 🔴 Red: Less than 10 minutes remaining
   - Shows individual extension amount if any

3. **Not Started Section**
   - List of students who haven't started yet
   - These students will receive global extensions

4. **Completed Section**
   - Shows count of students who finished
   - These students cannot receive extensions

## 🔧 API Endpoints

### For Teachers

#### Extend Time for All Students
```
POST /api/exams/:examId/extend-time
Body: { "minutes": 15 }
```

#### Extend Time for Individual Student
```
POST /api/exams/:examId/extend-time/:candidateId
Body: { "minutes": 10 }
```

#### Get Active Students List
```
GET /api/exams/:examId/active-students
```

### For Students

#### Get Current Time Remaining
```
GET /api/candidate/exams/:examId/time-remaining
```

Returns:
```json
{
  "total_duration_minutes": 75,
  "time_remaining_seconds": 3600,
  "elapsed_minutes": 15,
  "base_duration": 60,
  "global_extension": 10,
  "individual_extension": 5,
  "status": "in_progress"
}
```

## 💡 Use Cases

### Common Scenarios

1. **Technical Issue**
   - A student has connection problems
   - Teacher can add 5-10 minutes for that specific student

2. **Entire Class Needs More Time**
   - Exam is harder than expected
   - Teacher extends time by 15 minutes for everyone

3. **Special Accommodations**
   - Student with disability needs extra time
   - Teacher can add time individually before or during exam

4. **Late Start**
   - Student starts exam late due to valid reason
   - Teacher can compensate with individual time extension

## 🔒 Security & Permissions

- ✅ Only teachers can extend time
- ✅ Teachers can only extend time for their own exams
- ✅ Students cannot extend their own time
- ✅ All time extensions are logged in audit logs
- ✅ Extensions cannot be negative

## 📝 Database Schema

### New Columns Added

**exams table:**
```sql
global_time_extension_minutes INTEGER DEFAULT 0
```
- Tracks cumulative time added for all students
- Applies to all current and future attempts

**exam_attempts table:**
```sql
time_extension_minutes INTEGER DEFAULT 0
```
- Tracks cumulative time added for this specific student
- Only applies to this student's attempt

### Total Time Calculation

```
Total Time = Base Duration + Global Extension + Individual Extension
```

Example:
- Base Duration: 60 minutes
- Global Extension: 10 minutes (teacher added 5 min twice)
- Individual Extension: 5 minutes
- **Total Time: 75 minutes**

## 🐛 Troubleshooting

### Time Extension Not Showing for Student

1. Check that the student has started the exam
2. Verify the mobile app is running and not minimized
3. Wait up to 30 seconds for the automatic check
4. Check backend logs for errors

### Modal Not Opening

1. Ensure exam status is "active" or "scheduled"
2. Check browser console for errors
3. Verify user is logged in as a teacher
4. Try refreshing the page

### Database Migration Failed

1. Check PostgreSQL is running
2. Verify database credentials in `.env`
3. Check if columns already exist (migration may have been applied)
4. Review error message in terminal

## 🎓 Best Practices

1. **Communicate with Students**
   - Let students know time is being extended
   - They'll see a notification but verbal confirmation helps

2. **Document Extensions**
   - Extensions are automatically logged
   - Consider keeping notes on why time was extended

3. **Be Fair**
   - Use individual extensions for legitimate reasons
   - Global extensions are more equitable for all students

4. **Test Before Exams**
   - Practice using the feature before actual exams
   - Ensure mobile devices can receive updates

5. **Monitor Active Students**
   - Use the modal to see who's taking the exam
   - Check time remaining before extending

## 📚 Related Features

- **Exam Timer**: Students see countdown timer
- **Auto-Submit**: Exam submits when time expires
- **Audit Logs**: All extensions are logged for review
- **Screen Lock**: Continues working during time extensions

## 🔗 Files Modified

### Backend
- `backend/database/migrations/add_time_extension.sql` - Database schema changes
- `backend/database/migrations/apply-time-extension.js` - Migration script
- `backend/routes/exams.js` - Teacher endpoints
- `backend/routes/candidate.js` - Student endpoint

### Frontend
- `src/components/TimeExtensionModal.jsx` - Time extension UI component
- `src/pages/MyExams.jsx` - Integration with exams list

### Mobile
- `mobile/src/screens/ExamScreen.js` - Timer polling and updates
- `mobile/src/api/client.js` - API method for checking time

---

## ✅ Quick Start Checklist

- [ ] Apply database migration
- [ ] Restart backend server
- [ ] Test with a sample exam
- [ ] Verify mobile app receives updates
- [ ] Read through this documentation

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review backend logs for errors
3. Verify all files were updated correctly
4. Check that migration was applied successfully

---

**Feature developed for UI-GES Examination System**
Version: 1.0
Date: January 2026

