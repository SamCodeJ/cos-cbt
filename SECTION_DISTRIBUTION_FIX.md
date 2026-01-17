# Section Distribution Settings Not Saving - FIX GUIDE

## The Problem
When you toggled on "Section-Based Question Distribution" in the Settings tab, made custom choices, saved the exam, and came back to edit it, the toggle was OFF and your custom choices were cleared.

## Root Cause
The frontend was sending the `enable_section_distribution` and `section_distribution` settings to the backend, but:
1. **The database didn't have columns** to store these settings
2. **The backend API wasn't handling** these new fields

## The Solution
I've implemented a complete fix involving:
1. ✅ Database migration to add new columns
2. ✅ Backend API updates to handle the new fields
3. ✅ Migration scripts and documentation

---

## How to Apply the Fix

### Step 1: Apply the Database Migration

Choose **ONE** of these methods:

#### Method A: Using the Node.js Script (Easiest)
```bash
cd backend
node database/migrations/apply-section-distribution.js
```

#### Method B: Using psql Command Line
```bash
psql -U your_username -d uiges_db -f backend/database/migrations/add_section_distribution.sql
```

#### Method C: Using pgAdmin or GUI Tool
1. Open pgAdmin and connect to your database
2. Open the SQL query tool
3. Copy the contents of `backend/database/migrations/add_section_distribution.sql`
4. Execute the query

### Step 2: Restart Your Backend Server
```bash
# If using nodemon (it might auto-restart)
# Or manually restart:
cd backend
npm start
```

### Step 3: Test the Feature
1. Go to your exam creation/editing page
2. Navigate to the **Settings** tab
3. Enable "Section-Based Question Distribution"
4. Configure your distribution (or use auto-distribution)
5. **Save the exam**
6. Go back to edit the same exam
7. ✅ The toggle should stay ON and your choices should be preserved!

---

## What Was Changed

### 1. Database Schema (`add_section_distribution.sql`)
Added two new columns to the `exams` table:

```sql
ALTER TABLE exams 
ADD COLUMN enable_section_distribution BOOLEAN DEFAULT false;

ALTER TABLE exams 
ADD COLUMN section_distribution JSONB DEFAULT NULL;
```

**Example of stored data:**
```json
{
  "enable_section_distribution": true,
  "section_distribution": {
    "Algebra": 8,
    "Geometry": 6,
    "Trigonometry": 5,
    "Calculus": 4,
    "Statistics": 4,
    "Word Problems": 3
  }
}
```

### 2. Backend API (`backend/routes/exams.js`)
Updated three endpoints to handle the new fields:

#### POST `/api/exams` (Create Exam)
- Now accepts `enable_section_distribution` and `section_distribution`
- Stores them in the database

#### PUT `/api/exams/:id` (Update Exam)
- Now accepts and updates `enable_section_distribution` and `section_distribution`
- Preserves your settings when you save

#### POST `/api/exams/:id/duplicate` (Duplicate Exam)
- Now copies the section distribution settings to the duplicated exam

### 3. Frontend (`src/pages/CreateExam.jsx`)
The frontend was already updated in the previous changes to:
- Display the section distribution toggle and configuration UI
- Send the settings to the backend
- Load and display saved settings when editing

---

## Verification

After applying the fix, you can verify it worked:

### 1. Check Database Columns
```sql
-- Connect to your database and run:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exams' 
  AND column_name IN ('enable_section_distribution', 'section_distribution');
```

Expected output:
```
      column_name         |  data_type
--------------------------+------------
 enable_section_distribution | boolean
 section_distribution        | jsonb
```

### 2. Check Saved Exam
```sql
-- Check an exam that you've configured with section distribution:
SELECT id, title, enable_section_distribution, section_distribution 
FROM exams 
WHERE enable_section_distribution = true;
```

---

## Understanding the Feature

### How Auto-Distribution Works
When you have **6 sections** and students need to answer **30 questions**:
- System calculates: 30 ÷ 6 = **5 questions per section**
- Each student gets a random selection of 5 questions from each section

If the division isn't even (e.g., 31 questions ÷ 6 sections):
- Result: 5, 5, 5, 5, 5, **6** (remainder distributed to first sections)

### Manual Distribution Example
For an exam with 30 questions total:
```
Algebra: 8 questions       (26.7% of exam)
Geometry: 6 questions      (20.0% of exam)
Trigonometry: 5 questions  (16.7% of exam)
Calculus: 4 questions      (13.3% of exam)
Statistics: 4 questions    (13.3% of exam)
Word Problems: 3 questions (10.0% of exam)
─────────────────────────────────────────
Total: 30 questions        (100% ✅)
```

---

## Troubleshooting

### Problem: "Column already exists" error
**Solution:** The migration was already applied. Skip to Step 2 (restart server).

### Problem: Settings still not saving
**Checklist:**
1. ✅ Did you run the migration?
2. ✅ Did you restart the backend server?
3. ✅ Are you connected to the correct database?
4. ✅ Check browser console for API errors
5. ✅ Check backend logs for errors

### Problem: Can't connect to database
**Solution:** Check your database connection settings in `backend/database/db.js` or `.env` file.

---

## Files Modified/Created

### Created:
- ✅ `backend/database/migrations/add_section_distribution.sql` - Database migration
- ✅ `backend/database/migrations/apply-section-distribution.js` - Migration script
- ✅ `backend/database/migrations/APPLY_SECTION_DISTRIBUTION.md` - Migration guide
- ✅ `SECTION_DISTRIBUTION_FIX.md` - This guide

### Modified:
- ✅ `backend/routes/exams.js` - Added handling for new fields
- ✅ `src/pages/CreateExam.jsx` - Already updated (previous changes)

---

## Backward Compatibility

✅ **This fix is 100% backward compatible:**
- Existing exams automatically have `enable_section_distribution = false`
- Old exams continue to work exactly as before
- New exams can optionally use section distribution
- No data loss or breaking changes

---

## Need Help?

If you encounter any issues:
1. Check the backend console logs for error messages
2. Check the browser console (F12) for API errors
3. Verify the migration was applied successfully
4. Ensure your database user has ALTER TABLE privileges

Happy distributing questions! 🎉

