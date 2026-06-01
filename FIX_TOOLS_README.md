# Production Issue Fix Tools - Quick Reference

## 📱 Your Issue

**Mobile app shows:** "Not enough questions in section 'Section 1'. Need 1, have 0"

**Quick Answer:** Your production database is missing questions or has section distribution misconfigured.

## 🚀 Quick Start (5 minutes)

**Option 1: Windows PowerShell**
```powershell
# 1. Test backend health
.\check-production-backend.ps1

# 2. If backend is healthy, SSH to server and run:
# ssh your-username@api.uiges.shop
# psql -U your_db_user -d ui_ges
# UPDATE exams SET enable_section_distribution = false;
# \q

# 3. Test mobile app - should work now!
```

**Option 2: Quick SSH Command**
```bash
ssh your-username@api.uiges.shop "psql -U your_db_user -d ui_ges -c 'UPDATE exams SET enable_section_distribution = false;'"
```

## 📁 Files I Created for You

### 1. Executive Summary
- **ISSUE_SUMMARY_AND_SOLUTION.md** ⭐ **START HERE**
  - Problem explanation
  - Quick fix steps
  - Comprehensive solutions
  - All you need in one document

### 2. Health Check Tools
- **check-production-backend.ps1** (Windows)
  - Tests if backend is running
  - Verifies database connection
  - Checks SSL certificate
  - Run this first!

- **check-production-backend.sh** (Linux/Mac)
  - Same as above for Linux/Mac users

### 3. Database Diagnostic Tools
- **diagnose-production-issue.sql**
  - 5 comprehensive diagnostic queries
  - Shows what data is missing
  - Identifies mismatches
  - Use after confirming backend is healthy

### 4. Database Fix Scripts
- **fix-production-exams.sql**
  - Multiple fix options
  - Safe preview mode
  - Verification queries
  - Choose appropriate fix for your situation

### 5. Detailed Guides
- **PRODUCTION_EXAM_FIX_GUIDE.md**
  - Step-by-step instructions
  - Multiple scenarios covered
  - Prevention tips
  - Troubleshooting section

### 6. Existing Debug Tools (already in your repo)
- **debug-exam-questions.sql**
- **check-section-distribution.sql**

## 🎯 Which File Should I Use?

### Scenario 1: "I just want to fix it NOW!"
1. Read: **ISSUE_SUMMARY_AND_SOLUTION.md** (Quick Fix section)
2. Run: SSH command to disable section distribution
3. Test: Mobile app

### Scenario 2: "I want to understand the problem"
1. Read: **ISSUE_SUMMARY_AND_SOLUTION.md** (full document)
2. Run: **check-production-backend.ps1**
3. Follow: Recommended Action Plan

### Scenario 3: "I need detailed diagnostics"
1. Read: **PRODUCTION_EXAM_FIX_GUIDE.md**
2. Run: **diagnose-production-issue.sql** on production DB
3. Apply: Appropriate fix from **fix-production-exams.sql**
4. Verify: Results

### Scenario 4: "I want to properly sync databases"
1. Read: **PRODUCTION_EXAM_FIX_GUIDE.md** (Option 2 section)
2. Export: Questions from local DB
3. Import: To production DB
4. Verify: Results

## 📊 Decision Tree

```
Start Here
    |
    v
Is backend running?
    |
    +-- No --> Check server, restart backend
    |
    +-- Yes --> Are there questions in production DB?
                    |
                    +-- No --> Import questions from local
                    |            (PRODUCTION_EXAM_FIX_GUIDE.md - Option 2)
                    |
                    +-- Yes --> Is section distribution enabled?
                                    |
                                    +-- Yes --> Do section names match?
                                    |               |
                                    |               +-- No --> Fix section names OR disable
                                    |               |          (fix-production-exams.sql)
                                    |               |
                                    |               +-- Yes --> Other issue, check logs
                                    |
                                    +-- No --> Questions might be in wrong exam_id
                                               (diagnose-production-issue.sql)
```

## 🔧 Tool Execution Guide

### Run Health Check (Windows)
```powershell
cd "C:\Users\Donation\Documents\ReactProjects\UI-GES-1"
.\check-production-backend.ps1
```

### Run Health Check (Linux/Mac)
```bash
cd ~/ReactProjects/UI-GES-1
chmod +x check-production-backend.sh
./check-production-backend.sh
```

### Run Database Diagnostics
```bash
# 1. Transfer to server
scp diagnose-production-issue.sql your-username@api.uiges.shop:/tmp/

# 2. SSH and run
ssh your-username@api.uiges.shop
psql -U your_db_user -d ui_ges -f /tmp/diagnose-production-issue.sql

# 3. Review output
```

### Apply Database Fix
```bash
# 1. Transfer to server
scp fix-production-exams.sql your-username@api.uiges.shop:/tmp/

# 2. SSH and connect
ssh your-username@api.uiges.shop
psql -U your_db_user -d ui_ges

# 3. Review and run appropriate fix from the file
\i /tmp/fix-production-exams.sql
```

## ⚡ One-Command Fixes

### Fix 1: Disable Section Distribution
```bash
ssh your-username@api.uiges.shop "psql -U your_db_user -d ui_ges -c 'UPDATE exams SET enable_section_distribution = false, section_distribution = NULL WHERE enable_section_distribution = true;'"
```

### Fix 2: Check Question Count
```bash
ssh your-username@api.uiges.shop "psql -U your_db_user -d ui_ges -c 'SELECT exam_id, COUNT(*) FROM questions GROUP BY exam_id;'"
```

### Fix 3: View Exam Configuration
```bash
ssh your-username@api.uiges.shop "psql -U your_db_user -d ui_ges -c 'SELECT id, title, enable_section_distribution, section_distribution, status FROM exams WHERE status = '\''active'\'';'"
```

## 📝 Notes

- **Replace placeholders:**
  - `your-username` with your SSH username
  - `your_db_user` with your PostgreSQL username (usually same as SSH username or 'postgres')
  - `ui_ges` with your database name (might be 'gesDB' based on your .env file)

- **Database name from your .env:**
  ```
  DB_NAME=gesDB  (local)
  ```
  Your production might use a different name. Check with:
  ```bash
  psql -U your_db_user -l
  ```

- **Security:** All SQL scripts include preview queries before making changes

## ✅ Success Indicators

After applying fixes, you should see:

1. **Backend health check passes** ✅
   ```
   ✅ Backend is running
   ✅ API is reachable
   ✅ Login endpoint is working
   ```

2. **Database has questions** ✅
   ```sql
   SELECT COUNT(*) FROM questions;
   -- Should return > 0
   ```

3. **Mobile app works** ✅
   - Login succeeds
   - Exam starts without error
   - Questions display
   - Timer works
   - Submission works

## 🆘 Still Having Issues?

### Check These:

1. **Backend Logs:**
   ```bash
   pm2 logs backend
   # or
   docker logs ui-ges-backend
   ```

2. **Database Connection:**
   ```bash
   psql -U your_db_user -d ui_ges -c "SELECT version();"
   ```

3. **Nginx/Apache Logs:** (if using reverse proxy)
   ```bash
   tail -f /var/log/nginx/error.log
   ```

4. **Firewall:**
   ```bash
   sudo ufw status
   # Ensure ports 80, 443, and 5432 are open
   ```

## 📞 Getting Help

If you're still stuck:

1. **Run full diagnostics:**
   ```bash
   .\check-production-backend.ps1 > health-check-results.txt
   ```

2. **Capture database state:**
   ```bash
   psql -U your_db_user -d ui_ges -f diagnose-production-issue.sql > diagnostic-results.txt
   ```

3. **Collect backend logs:**
   ```bash
   pm2 logs backend --lines 100 > backend-logs.txt
   ```

4. **Review all three files** to identify the issue

## 🎉 Summary

**Most likely fix:** Run this one command and your app will work:

```bash
ssh your-username@api.uiges.shop "psql -U your_db_user -d ui_ges -c 'UPDATE exams SET enable_section_distribution = false;'"
```

Then test your mobile app!

---

**Created:** January 19, 2026
**Purpose:** Fix "Not enough questions in section" error in production
**Status:** Ready to use
