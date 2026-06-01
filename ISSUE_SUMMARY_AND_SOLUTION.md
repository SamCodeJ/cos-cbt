# Issue Summary & Solution

## 🔴 Problem

**Mobile App Error:** "Not enough questions in section 'Section 1'. Need 1, have 0"

**Symptoms:**
1. ✅ Mobile app connects to production server at `https://api.uiges.shop`
2. ✅ Candidates can log in successfully
3. ❌ When trying to start exam, error appears: "Not enough questions in section 'Section 1'. Need 1, have 0"
4. ⚠️ Connection warning appears (though login still works)

## 🎯 Root Cause

The production backend server is running fine, but the **exam has section-based distribution enabled** with no matching questions in the database.

### Technical Details

Looking at your backend code (`backend/routes/candidate.js`, lines 367-393):

```javascript
if (exam.enable_section_distribution && exam.section_distribution) {
  // System tries to select questions from specific sections
  for (const [sectionName, count] of Object.entries(distribution)) {
    const sectionQuestions = questionsBySection[sectionName] || [];
    
    if (sectionQuestions.length < count) {
      // ERROR THROWN HERE ❌
      return res.status(400).json({ 
        error: `Not enough questions in section "${sectionName}". Need ${count}, have ${sectionQuestions.length}` 
      });
    }
  }
}
```

The exam's `section_distribution` field is configured with `{"Section 1": 1}` (or similar), but when the backend queries the database, it finds **0 questions** with `section_id = "Section 1"`.

## 🛠️ Solutions

### ⚡ Quick Fix (5 minutes)

**Disable section distribution for all exams:**

```bash
# 1. SSH into your production server
ssh your-username@api.uiges.shop

# 2. Connect to database
psql -U your_db_user -d ui_ges

# 3. Disable section distribution
UPDATE exams SET enable_section_distribution = false, section_distribution = NULL WHERE enable_section_distribution = true;

# 4. Verify
SELECT id, title, enable_section_distribution FROM exams WHERE status = 'active';

# 5. Exit
\q
```

✅ **Result:** Exams will work immediately using simple random question selection.

### 🎓 Proper Fix (15-30 minutes)

**Sync questions from local to production:**

**Step 1: Check your local database has questions**
```bash
# On Windows (PowerShell)
cd backend
# Connect to local database
psql -U postgres -d gesDB

# Check questions
SELECT exam_id, COUNT(*) as question_count FROM questions GROUP BY exam_id;
```

**Step 2: Export questions from local**
```bash
# Export all questions
pg_dump -U postgres -d gesDB -t questions --data-only --column-inserts > questions_export.sql

# Also export exams table to ensure consistency
pg_dump -U postgres -d gesDB -t exams --data-only --column-inserts > exams_export.sql
```

**Step 3: Transfer to production**
```bash
# Using SCP (or WinSCP on Windows)
scp questions_export.sql your-username@api.uiges.shop:/tmp/
scp exams_export.sql your-username@api.uiges.shop:/tmp/
```

**Step 4: Import to production**
```bash
# SSH into production
ssh your-username@api.uiges.shop

# Backup existing data first
pg_dump -U your_db_user ui_ges > /tmp/backup_before_import.sql

# Import data
psql -U your_db_user -d ui_ges -f /tmp/exams_export.sql
psql -U your_db_user -d ui_ges -f /tmp/questions_export.sql

# Verify
psql -U your_db_user -d ui_ges -c "SELECT exam_id, COUNT(*) FROM questions GROUP BY exam_id;"
```

## 📋 Diagnostic Tools I've Created

I've created several tools to help you diagnose and fix this issue:

### 1. **check-production-backend.ps1** (Windows PowerShell)
- Tests if your production backend is running
- Verifies database connectivity
- Checks API endpoints
- **Run this first to confirm backend is healthy**

**Usage:**
```powershell
.\check-production-backend.ps1
```

### 2. **diagnose-production-issue.sql**
- Comprehensive database diagnostic queries
- Shows which exams have questions
- Identifies section distribution mismatches
- **Use this to find the exact problem**

**Usage:**
```bash
# Transfer to production server
scp diagnose-production-issue.sql your-username@api.uiges.shop:/tmp/

# Run on production database
ssh your-username@api.uiges.shop
psql -U your_db_user -d ui_ges -f /tmp/diagnose-production-issue.sql
```

### 3. **fix-production-exams.sql**
- Multiple fix scripts for different scenarios
- Includes verification queries
- Safe to run with preview mode first
- **Use this to apply the fix**

**Usage:**
```bash
# Transfer to production
scp fix-production-exams.sql your-username@api.uiges.shop:/tmp/

# Run on production database
ssh your-username@api.uiges.shop
psql -U your_db_user -d ui_ges
# Then manually run the appropriate fix from the script
```

### 4. **PRODUCTION_EXAM_FIX_GUIDE.md**
- Detailed step-by-step guide
- Covers all scenarios
- Includes prevention tips
- **Your comprehensive reference document**

## 🚀 Recommended Action Plan

### Phase 1: Immediate Fix (Do this now)

1. **Test backend health:**
   ```powershell
   .\check-production-backend.ps1
   ```

2. **Apply quick fix (disable section distribution):**
   ```bash
   ssh your-username@api.uiges.shop
   psql -U your_db_user -d ui_ges
   UPDATE exams SET enable_section_distribution = false, section_distribution = NULL;
   \q
   ```

3. **Test mobile app:**
   - Close and restart the mobile app
   - Try to start an exam
   - ✅ Should work now!

### Phase 2: Proper Solution (Do this later)

1. **Run diagnostics** to understand what data is missing
2. **Export questions** from your local database
3. **Import to production** database
4. **Re-enable section distribution** if needed
5. **Test thoroughly**

## 🔍 Understanding the Connection Warning

The first image shows: "Connection Warning - Backend server may not be reachable"

**This is a false alarm** because:
- The mobile app successfully logs in (connection works)
- The error only appears when starting the exam (data issue, not connection)
- The warning is from the `testConnection()` function which might timeout on slower networks

**To fix this warning**, you can either:
1. **Ignore it** (it's cosmetic - login still works)
2. **Increase timeout** in `mobile/src/api/client.js`:
   ```javascript
   timeout: 10000, // Increase to 15000 or 20000
   ```

## ✅ Verification Checklist

After applying the fix:

- [ ] Backend health check passes: `.\check-production-backend.ps1`
- [ ] Exams have questions: `SELECT COUNT(*) FROM questions;` returns > 0
- [ ] Section distribution is disabled OR matches question data
- [ ] Mobile app can login
- [ ] Mobile app can start exam
- [ ] Timer starts correctly
- [ ] Questions display properly
- [ ] Answers can be submitted

## 📞 If You Still Have Issues

### Check Backend Logs
```bash
# If using PM2
pm2 logs backend

# If using Docker
docker logs ui-ges-backend

# If using systemd
journalctl -u ui-ges-backend -f
```

### Check Database Connection
```bash
# On production server
psql -U your_db_user -d ui_ges -c "SELECT COUNT(*) FROM questions;"
```

### Verify Backend is Running
```bash
curl https://api.uiges.shop/health
# Should return: {"status":"ok","timestamp":"..."}
```

## 📚 Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `check-production-backend.ps1` | Health check script | Run first to verify backend |
| `diagnose-production-issue.sql` | Database diagnostics | Find exact data problems |
| `fix-production-exams.sql` | Fix scripts | Apply database fixes |
| `PRODUCTION_EXAM_FIX_GUIDE.md` | Detailed guide | Step-by-step instructions |
| `ISSUE_SUMMARY_AND_SOLUTION.md` | This file | Quick reference |

## 🎓 Key Takeaway

**The backend is working fine!** The issue is just missing/mismatched question data in your production database. Apply the quick fix above and your mobile app will work immediately. Then you can properly sync your data at your convenience.

---

**Quick Command Reference:**

```bash
# Quick Fix (disable section distribution)
ssh your-username@api.uiges.shop
psql -U your_db_user -d ui_ges -c "UPDATE exams SET enable_section_distribution = false;"

# Check if it worked
psql -U your_db_user -d ui_ges -c "SELECT id, title, enable_section_distribution FROM exams;"
```

**Expected result:** `enable_section_distribution` should be `f` (false) for all exams.

Now test your mobile app - it should work! 🎉
