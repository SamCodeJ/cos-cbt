# Testing Exam Creation - Quick Guide

## 🎯 What I've Fixed

1. ✅ **Database**: Migrated and seeded with demo data
2. ✅ **Backend**: Added detailed error logging
3. ✅ **Frontend**: Enhanced error messages to show specific issues
4. ✅ **Backend Server**: Restarted with new changes

## 📝 Step-by-Step Test Process

### Step 1: Verify Services are Running

**Check Backend:**
Open http://localhost:3000/health in browser
- ✅ Should show: `{"status":"ok","timestamp":"..."}`
- ❌ If not working: See "Backend Not Running" section below

**Check Frontend:**
Your app should be running on http://localhost:5173
- ✅ Should show the login page
- ❌ If not: Run `npm run dev` in the project root

### Step 2: Login

Use the demo teacher account:
- **Email**: `teacher@uiges.com`
- **Password**: `password`

### Step 3: Create a Test Exam

#### A. Navigate to Create Exam
Click "Create Exam" in the sidebar

#### B. Fill Basic Info Tab
- **Title**: `Sample Test Exam`
- **Subject**: `Mathematics`
- **Duration**: `30` (minutes)
- **Questions per Candidate**: `2`
- **Pass Mark**: `50`
- **Start Date**: Pick today's date + time
- **End Date**: Pick tomorrow's date + time

#### C. Add Candidates (Tab 2)
Click "+ Add Candidate" and enter:
- **Name**: `Test Student`
- **Email**: `student@test.com`
- **Student ID**: `ST001`

Click "Add" button. You should see the candidate in the table.

#### D. Add Questions (Tab 3)
Click "Add New Question" form and enter:

**Question 1:**
- **Question Text**: `What is 2 + 2?`
- **Option A**: `3`
- **Option B**: `4`
- **Option C**: `5`
- **Option D**: `6`
- **Correct Answer**: Select `B`
- **Points**: `1`
Click "+ Add"

**Question 2:**
- **Question Text**: `What is 3 + 3?`
- **Option A**: `5`
- **Option B**: `6`
- **Option C**: `7`
- **Option D**: `8`
- **Correct Answer**: Select `B`
- **Points**: `1`
Click "+ Add"

You should see both questions in the table below.

#### E. Review Settings (Tab 4)
Keep default settings or adjust as needed:
- Show Results After Test: ✓
- Randomize Questions: ✓
- Randomize Answer Options: ✗
- Enforce Screen Lock: ✓

#### F. Create the Exam
Click the green "Create Exam" button at the top right.

### Step 4: What to Watch For

**✅ SUCCESS:**
- Green toast message: "Exam created successfully"
- Redirected to "My Exams" page
- Your new exam appears in the list

**❌ FAILURE - Check These:**

1. **Open Browser Console (F12)**
   - Look for: `Save exam error:` with details
   - This will show the exact problem

2. **Open Network Tab (F12 → Network)**
   - Filter by "Fetch/XHR"
   - Click the failed request (red)
   - Click "Response" tab
   - Read the error message

3. **Check Backend Terminal**
   - Look for console logs showing:
     - "Creating exam with data: ..."
     - Or error messages

## 🐛 Common Issues & Quick Fixes

### Issue: "Validation failed"

**What you'll see**: Specific error like "duration: Duration must be at least 10 minutes"

**Fix**: Adjust the field mentioned in the error message

---

### Issue: "Failed to create exam" (no details)

**Possible causes:**
1. Backend not running
2. Database connection issue
3. Not logged in / token expired

**Fix:**
```powershell
# Stop all node processes
Get-Process node | Stop-Process -Force

# Restart backend
cd backend
npm run dev

# In another terminal, restart frontend
cd ..
npm run dev
```

---

### Issue: Network Error / Cannot reach server

**Fix:**
1. Verify backend is running: http://localhost:3000/health
2. Check CORS settings in backend/.env:
   ```
   CORS_ORIGIN=http://localhost:5173
   ```
3. Restart backend server

---

### Issue: Token expired / Unauthorized

**Fix:**
1. Logout
2. Login again with: `teacher@uiges.com` / `password`

---

### Issue: Database errors in backend console

**Examples:**
- `relation "exams" does not exist`
- `column "teacher_id" does not exist`

**Fix:**
```powershell
cd backend
npm run db:migrate
npm run db:seed
npm run dev
```

## 🎓 What's Different Now?

### Before:
- Generic error: "Failed to create exam"
- No details about what went wrong

### After:
- **Detailed errors** showing exact fields with issues
- **Console logs** in both browser and backend
- **Better validation** messages
- **Network tab** shows full error response

## 📊 Expected Backend Console Output (Success)

When you create an exam successfully, you should see:

```
Creating exam with data: {
  teacher_id: 2,
  title: 'Sample Test Exam',
  subject: 'Mathematics',
  duration: 30,
  questions_per_candidate: 2,
  pass_mark: 50,
  ...
}
Exam created successfully: 3
```

## 🎯 Next Steps After Successful Creation

1. **View Your Exams**: Go to "My Exams" - your new exam should be listed
2. **Edit the Exam**: Click on it to add more questions/candidates
3. **Test on Mobile**: Use the mobile app to take the exam as a candidate

## 🆘 Still Having Issues?

If you still see errors, please share:
1. The **exact error message** from the browser console (F12 → Console)
2. The **response** from Network tab (F12 → Network → Failed request → Response)
3. Any **errors** from the backend terminal

The enhanced logging will show us exactly what's going wrong! 🔍

