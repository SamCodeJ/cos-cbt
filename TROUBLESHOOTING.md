# C-COS Troubleshooting Guide

## ✅ What I've Fixed

1. **Database Setup**: Ran migrations and seeded demo data
2. **Improved Error Messages**: Enhanced CreateExam component to show detailed error messages
3. **Backend Server**: Restarted the backend server

## 🧪 Testing the Fix

### Step 1: Verify Backend is Running

Open a browser and go to: `http://localhost:3000/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T..."
}
```

### Step 2: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try creating an exam again
4. Look for any error messages - they will now be more detailed!

### Step 3: Check Network Tab

1. In Developer Tools, go to the **Network** tab
2. Filter by "XHR" or "Fetch"
3. Try creating an exam
4. Click on the failed request
5. Check the **Response** tab to see the exact error from the backend

### Step 4: Try Creating a Simple Exam

Use these minimal values to test:

**Basic Info Tab:**
- Title: `Test Exam`
- Subject: `Testing`
- Duration: `30` minutes
- Questions per Candidate: `2`
- Pass Mark: `50`
- Start Date: Choose any date in the future
- End Date: Choose a date after start date

**Candidates Tab:**
- Add at least one candidate manually:
  - Name: `John Doe`
  - Email: `john@test.com`
  - Student ID: `ST001`

**Questions Tab:**
- Add at least 2 questions manually (matching questions per candidate):
  - Question 1: `What is 1+1?`
  - Options: `1`, `2`, `3`, `4`
  - Correct: `B` (2)
  - Points: `1`

**Settings Tab:**
- Keep all default settings

Then click **Create Exam**.

## 🔍 Common Issues & Solutions

### Issue 1: "Failed to create exam" with no details

**Cause**: Backend server not running or database not connected

**Solution**:
```bash
# In backend directory
cd backend
npm run dev
```

### Issue 2: CORS Error

**Cause**: Frontend and backend URL mismatch

**Solution**: Check that:
- Backend is running on `http://localhost:3000`
- Frontend is running on `http://localhost:5173`
- Backend `.env` has: `CORS_ORIGIN=http://localhost:5173`

### Issue 3: Database Connection Error

**Cause**: PostgreSQL not running or wrong credentials

**Solution**:
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If not running, start it
net start postgresql-x64-18
```

Check your `backend/.env` file has correct database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uiges_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Issue 4: Validation Errors

**Now you'll see specific errors like:**
- `duration: Duration must be at least 10 minutes`
- `title: Title is required`

Fix the specific fields mentioned in the error.

## 📊 Demo Credentials

You can login with these demo accounts:

**Admin:**
- Email: `admin@uiges.com`
- Password: `password`

**Teacher:**
- Email: `teacher@uiges.com`
- Password: `password`

**Candidate (Mobile):**
- Email: `candidate@uiges.com`
- Password: `password`

## 🎯 What Should Happen After the Fix

1. Better error messages in toast notifications
2. Console logs showing the exact error
3. Network tab showing detailed backend response
4. If successful: You'll be redirected to "My Exams" page

## 🆘 Still Having Issues?

If you still see "Failed to create exam", check the browser console and share:
1. The exact error message from the console
2. The response from the Network tab
3. Any errors shown in the backend terminal

The improved error handling will now show you exactly what's wrong!

