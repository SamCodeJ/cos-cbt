# 🧪 UI-GES Complete Testing Guide

## 📋 Pre-Testing Checklist

Before you start, make sure you have:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 12+ installed
- [ ] A terminal/command prompt open
- [ ] A web browser ready
- [ ] Expo Go app on your phone (for mobile testing)

---

## 🚀 Part 1: Setup Backend (10 minutes)

### Step 1: Install PostgreSQL (if needed)

**Already installed?** Skip to Step 2.

**Windows:**
```bash
# Download from: https://www.postgresql.org/download/windows/
# During installation, remember your postgres password!
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Open PostgreSQL terminal
psql -U postgres

# You'll be prompted for password (the one you set during installation)
# In the psql terminal, run:
CREATE DATABASE uiges_db;

# Verify it was created:
\l

# You should see uiges_db in the list
# Exit psql:
\q
```

### Step 3: Install Backend Dependencies

```bash
# Navigate to backend folder
cd backend

# Install dependencies (takes 1-2 minutes)
npm install
```

### Step 4: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Open .env in your editor and update:
```

Edit `backend/.env`:
```env
PORT=3000
NODE_ENV=development

# ⚠️ IMPORTANT: Change YOUR_POSTGRES_PASSWORD to your actual password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uiges_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

JWT_SECRET=ui-ges-super-secret-key-2024
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### Step 5: Initialize Database

```bash
# Create all tables
npm run db:migrate

# You should see:
# 📝 Creating tables...
# ✅ Tables created successfully!

# Insert demo data
npm run db:seed

# You should see:
# 🌱 Seeding database...
# ✅ Database seeded successfully!
# Demo Credentials displayed
```

### Step 6: Start Backend Server

```bash
# Start the server
npm run dev

# You should see:
# 🚀 UI-GES Backend Server running on port 3000
# 📊 Environment: development
# 🔗 API Base URL: http://localhost:3000/api
# ✅ Database connection successful
```

**✅ Backend is running!** Keep this terminal open.

### Step 7: Test Backend (Quick Check)

Open a new terminal or browser:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}
```

Or open in browser: http://localhost:3000/health

**✅ If you see the health response, backend is working!**

---

## 🌐 Part 2: Setup Web Portal (5 minutes)

### Step 1: Install Web Dependencies

Open a **NEW terminal** (keep backend running):

```bash
# Navigate to project root (not backend folder)
cd ..

# Or if you're somewhere else:
cd C:\Users\Donation\Documents\ReactProjects\UI-GES

# Install dependencies
npm install
```

### Step 2: Verify API Configuration

The web portal should already be configured correctly. Let's verify:

```bash
# Check if .env exists
ls .env

# If it doesn't exist, create it:
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
```

### Step 3: Start Web Portal

```bash
# Start development server
npm run dev

# You should see:
# VITE v6.1.0  ready in X ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

**✅ Web portal is running!** Keep this terminal open too.

### Step 4: Test Web Portal

Open your browser and go to: **http://localhost:5173**

You should see the UI-GES login page! 🎉

---

## 📱 Part 3: Setup Mobile App (5 minutes)

### Step 1: Install Mobile Dependencies

Open a **NEW terminal** (keep backend and web running):

```bash
cd mobile
npm install
```

### Step 2: Configure API URL

**IMPORTANT:** Mobile app needs your computer's IP address (not localhost)

**Find your IP:**
```bash
# Windows:
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100

# Mac/Linux:
ifconfig
# Look for "inet" under your active network adapter
```

Edit `mobile/src/api/client.js`:
```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:3000/api';

// To your computer's IP:
const API_BASE_URL = 'http://192.168.1.100:3000/api';  // Use YOUR IP
```

### Step 3: Start Mobile App

```bash
npm start

# Expo will start and show a QR code
```

### Step 4: Test on Your Phone

1. **Install Expo Go** on your phone:
   - iOS: App Store → Search "Expo Go"
   - Android: Play Store → Search "Expo Go"

2. **Scan QR Code:**
   - iOS: Use Camera app → Scan QR → Open in Expo Go
   - Android: Open Expo Go → Scan QR code

3. Wait for app to load (30 seconds - 1 minute)

**✅ You should see the candidate login screen!** 🎉

---

## 🧪 Part 4: Complete System Test

Now let's test the entire workflow! You should have:
- ✅ Backend running (Terminal 1)
- ✅ Web portal running (Terminal 2)
- ✅ Mobile app on your phone

### Test 1: Teacher Login (Web)

1. Go to **http://localhost:5173**
2. Enter credentials:
   - Email: `teacher@uiges.com`
   - Password: `password`
3. Click "Sign In"

**✅ Expected:** You should see the Teacher Dashboard with:
- Stat cards (Total Exams, Candidates, etc.)
- Charts
- Recent exams list

### Test 2: View Existing Exams (Web)

1. Click "My Exams" in sidebar
2. You should see demo exams:
   - Mathematics Midterm Exam
   - Computer Science Quiz

**✅ Expected:** Table showing exams with status badges

### Test 3: Create New Exam (Web)

1. Click "Create Exam" button
2. **Tab 1 - Basic Info:**
   - Title: "Test Exam"
   - Subject: "Testing"
   - Duration: 30
   - Questions Per Candidate: 5
   - Pass Mark: 60
   - Start Date: Today
   - End Date: Tomorrow
3. Click Next or go to **Tab 2 - Candidates**
4. Add a candidate manually:
   - Name: "Test Student"
   - Email: "test@student.com"
   - Student ID: "TS001"
   - Click "Add"
5. Go to **Tab 3 - Questions**
6. Add a question:
   - Question: "What is 1+1?"
   - Option A: "1"
   - Option B: "2"
   - Option C: "3"
   - Option D: "4"
   - Correct Answer: B
   - Points: 1
   - Click "Add"
7. Add 4 more questions (similar format)
8. Go to **Tab 4 - Settings**
   - Keep defaults
9. Click "Create Exam"

**✅ Expected:** Success message and redirect to My Exams

### Test 4: View Question Bank (Web)

1. Click "Question Bank" in sidebar
2. You should see 50+ demo questions
3. Try filtering by subject or difficulty
4. Try adding a new question

**✅ Expected:** Questions displayed with filter options working

### Test 5: View Results (Web)

1. Click "Results" in sidebar
2. You should see results from demo data
3. Try clicking "Details" on a result
4. View charts and analytics

**✅ Expected:** Results table with pass/fail distribution chart

### Test 6: Candidate Login (Mobile)

1. On your phone in the Expo Go app
2. You should see the login screen
3. Enter credentials:
   - Email: `candidate@uiges.com`
   - Password: `password`
4. Click "Sign In"

**✅ Expected:** Dashboard with assigned exams

### Test 7: View Exam Instructions (Mobile)

1. You should see "Mathematics Midterm Exam" card
2. Click "View Instructions"
3. Read through the instructions
4. Notice the proctoring warning

**✅ Expected:** Instructions screen with exam details

### Test 8: Take Exam (Mobile) - THE BIG TEST!

1. Click "I Understand, Start Exam"
2. Wait for questions to load (randomization happening)
3. You should see:
   - ✅ Timer counting down at top
   - ✅ Question counter (1/40)
   - ✅ Question with radio options
   - ✅ Previous/Next buttons
   - ✅ Palette button

4. **Answer some questions:**
   - Select an option
   - Click "Next"
   - Repeat for 5-10 questions

5. **Test Flag Feature:**
   - Click the flag icon
   - Question should be marked

6. **Test Question Palette:**
   - Click "Palette" button
   - See grid of all questions
   - Color coding: green (answered), amber (flagged), gray (unanswered)
   - Click a question number to jump to it

7. **Test Screen Lock (IMPORTANT!):**
   - Press home button to minimize app
   - Wait 2 seconds
   - Open app again
   - **✅ Expected:** Warning alert about violation

8. **Submit Exam:**
   - Navigate to last question
   - Click "Submit"
   - Confirm submission

**✅ Expected:** Success! Results screen appears

### Test 9: View Results (Mobile)

After submitting, you should see:
- Score percentage
- Pass/Fail status
- Correct vs incorrect answers
- Time taken
- Question-by-question review (if enabled)

**✅ Expected:** Complete results breakdown

### Test 10: Admin Features (Web)

1. Logout from teacher account
2. Login as admin:
   - Email: `admin@uiges.com`
   - Password: `password`
3. You should see additional sidebar items:
   - Admin Dashboard
   - Manage Teachers
   - Audit Logs

4. **Test Admin Dashboard:**
   - Click "Admin Dashboard"
   - See system-wide stats

5. **Test Manage Teachers:**
   - Click "Manage Teachers"
   - Try adding a new teacher
   - See all teachers in system

6. **Test Audit Logs:**
   - Click "Audit Logs"
   - See all system activities logged

**✅ Expected:** Admin can see and do everything

---

## 🎯 Quick Test Checklist

Copy this checklist and mark items as you test:

### Backend Tests
- [ ] Backend server starts without errors
- [ ] Health endpoint returns OK
- [ ] Database connection successful
- [ ] Demo data loaded (50+ questions)

### Web Portal Tests
- [ ] Login page loads
- [ ] Teacher can login
- [ ] Dashboard displays correctly
- [ ] My Exams shows demo exams
- [ ] Can create new exam
- [ ] Can add candidates (manual)
- [ ] Can add questions (manual)
- [ ] CSV upload works (optional)
- [ ] Question Bank displays
- [ ] Results page shows data
- [ ] Charts render correctly
- [ ] Admin can login
- [ ] Admin sees all exams
- [ ] Admin can manage teachers
- [ ] Audit logs display

### Mobile App Tests
- [ ] App loads in Expo Go
- [ ] Login screen displays
- [ ] Candidate can login
- [ ] Dashboard shows assigned exams
- [ ] Instructions screen loads
- [ ] Can start exam
- [ ] Questions randomized
- [ ] Timer counts down
- [ ] Can answer questions
- [ ] Can navigate (Prev/Next)
- [ ] Can flag questions
- [ ] Palette shows all questions
- [ ] Screen lock detection works
- [ ] Can submit exam
- [ ] Results display correctly
- [ ] Question review works

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend won't start

**Error:** "Cannot connect to database"

**Solution:**
```bash
# Check PostgreSQL is running
# Windows:
net start postgresql-x64-14

# Mac:
brew services restart postgresql@14

# Linux:
sudo systemctl restart postgresql

# Verify database exists:
psql -U postgres -l | grep uiges_db

# If not found, create it:
psql -U postgres -c "CREATE DATABASE uiges_db;"
```

### Issue 2: Web portal shows "Network Error"

**Solution:**
1. Check backend is running (Terminal 1)
2. Check `.env` has correct API URL
3. Try restarting web portal:
   ```bash
   # Stop (Ctrl+C) and restart
   npm run dev
   ```

### Issue 3: Mobile app won't connect

**Error:** "Network request failed"

**Solution:**
```javascript
// In mobile/src/api/client.js
// Make sure you're using your computer's IP, not localhost

// WRONG:
const API_BASE_URL = 'http://localhost:3000/api';

// RIGHT (use your actual IP):
const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

**Find your IP:**
```bash
# Windows:
ipconfig
# Look for IPv4 Address

# Mac/Linux:
ifconfig
# Look for inet
```

Also ensure your phone and computer are on the **same WiFi network**!

### Issue 4: "Duplicate key error" when seeding

**Solution:**
```bash
# Database already has data, that's OK!
# Either:
# 1. Use existing data (recommended)
# OR
# 2. Reset database:
psql -U postgres -d uiges_db

# In psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Then re-run:
npm run db:migrate
npm run db:seed
```

### Issue 5: Questions not appearing in exam

**Solution:**
- Make sure you added at least as many questions as "Questions Per Candidate"
- If exam needs 40 questions, question bank needs 40+ questions
- Check Question Bank page to verify questions exist

### Issue 6: Screen lock not detecting minimization

**Solution:**
- Screen lock detection works better on **physical devices** than simulators
- Make sure "Enforce Screen Lock" is enabled in exam settings
- Try pressing home button and returning to app
- Violation should be logged

---

## 📊 Expected Behavior Summary

### When Everything Works:

**Backend:**
- Starts on port 3000
- Connects to PostgreSQL
- Serves API endpoints
- Logs requests in terminal

**Web Portal:**
- Loads at localhost:5173
- Beautiful UI with amber accents
- Sidebar navigation works
- All pages load without errors
- Charts render
- Forms submit successfully

**Mobile App:**
- Loads in Expo Go
- Login works
- Questions load and randomize
- Timer counts down
- Can answer and submit
- Results display

**Integration:**
- Web creates exams → Mobile can take them
- Mobile submits → Web shows results
- All roles have correct permissions
- Data flows smoothly between all parts

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Backend logs show successful database connection
2. ✅ You can login as all 3 roles (admin, teacher, candidate)
3. ✅ You can create an exam on web portal
4. ✅ Exam appears on mobile app
5. ✅ You can complete an exam on mobile
6. ✅ Results appear on web portal
7. ✅ Screen lock violations are logged
8. ✅ Question randomization works (each candidate gets different questions)
9. ✅ Admin can see everything
10. ✅ Teacher can only see their own exams

---

## 🚀 Performance Expectations

**Backend:**
- Startup time: 2-3 seconds
- API response time: < 100ms
- Database queries: < 50ms

**Web Portal:**
- Initial load: 2-3 seconds
- Page navigation: Instant
- Chart rendering: < 1 second

**Mobile App:**
- Initial load in Expo: 30-60 seconds (first time)
- Login: 1-2 seconds
- Start exam: 2-3 seconds (randomizing questions)
- Submit exam: 1-2 seconds
- Reload: 5-10 seconds

---

## 📞 Need Help?

If something doesn't work:

1. **Check all 3 terminals** - Make sure backend, web, and mobile are all running
2. **Check browser console** - Press F12 in browser to see errors
3. **Check backend terminal** - Look for error messages
4. **Verify credentials** - Make sure you're using the correct demo accounts
5. **Restart everything** - Sometimes a fresh start helps:
   ```bash
   # Stop all (Ctrl+C in each terminal)
   # Then restart in order:
   # 1. Backend: cd backend && npm run dev
   # 2. Web: npm run dev (in root)
   # 3. Mobile: cd mobile && npm start
   ```

---

## 🎓 Test Scenarios to Try

After basic testing, try these scenarios:

1. **Bulk Upload** - Use CSV templates to upload candidates and questions
2. **Duplicate Exam** - Use the duplicate button on an exam
3. **Different Pass Marks** - Create exams with different passing thresholds
4. **Long Exams** - Create exam with 50+ questions
5. **Multiple Violations** - Minimize app 3 times and see auto-submit
6. **Expired Timer** - Wait for timer to reach 0 and see auto-submit
7. **Multiple Candidates** - Login with different candidate accounts
8. **Admin vs Teacher** - Compare what each role can see

---

**Ready to start testing?** 🚀

Follow the steps above in order, and you'll have a fully working CBT system!

**Good luck!** 🎉

