# 🔧 Quick Diagnostic - Time Issue

## 🐛 The Problem:
- Mobile shows initial time: 30 minutes ✅
- After 30 seconds, backend says: 60 minutes elapsed ❌
- This causes immediate auto-submit

## 🔍 Root Cause:
The backend is using an OLD `started_at` timestamp from 60 minutes ago, not from when this candidate just started the exam.

---

## ✅ Quick Fix Option 1: Clear Old Attempts

Run this SQL to clean up old in-progress attempts:

```sql
-- Connect to your database
psql -U postgres -d gesDB

-- Check current attempts
SELECT id, candidate_id, exam_id, started_at, status, 
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60 as minutes_ago
FROM exam_attempts 
WHERE exam_id = 15 AND status = 'in_progress';

-- If you see attempts from 60+ minutes ago with status='in_progress', mark them as auto_submitted:
UPDATE exam_attempts 
SET status = 'auto_submitted', 
    submitted_at = CURRENT_TIMESTAMP
WHERE exam_id = 15 
  AND status = 'in_progress' 
  AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60 > 35;
  
-- This clears attempts older than 35 minutes that are still marked as in_progress
```

---

## ✅ Quick Fix Option 2: Delete Test Attempts

If these are just test attempts, you can delete them:

```sql
-- DANGER: This deletes ALL attempts for exam 15
-- Only do this if it's a test exam!
DELETE FROM exam_attempts WHERE exam_id = 15;
```

---

## ✅ Quick Fix Option 3: Use Node Script

From your project root:

```bash
node backend/check-exam-attempts-by-candidate.js 15
```

This will show all attempts for exam 15. Then you can manually clean up old ones.

---

## 🔍 Debug: Check Backend Logs

Look for these lines in your backend terminal (terminal 1 or 2):

```
🔍 Query result: {
  exam_id: 15,
  candidate_id: XX,  ← What candidate?
  started_at: '...',  ← When did it start?
}

⏱️ Time calculation for exam: 15 / candidate: XX
   Started at: 2026-01-14 XX:XX:XX  ← Compare this time!
   Current time: 2026-01-14 XX:XX:XX
   Elapsed: XX minutes  ← Should be ~0.5 minutes, not 60!
```

---

## 📊 Expected vs Actual:

### ✅ What SHOULD happen:
```
Candidate starts exam → New attempt created with started_at = NOW
After 30 seconds:
- Elapsed: 0.5 minutes
- Remaining: 29.5 minutes
```

### ❌ What's happening:
```
Candidate starts exam → Query finds OLD attempt from 60 min ago
After 30 seconds:
- Elapsed: 60 minutes (using old started_at!)
- Remaining: -30 minutes → 0
```

---

## 🚀 Quick Solution:

**Option A (Safest):** Run the SQL to mark old attempts as auto_submitted
**Option B (Test only):** Delete all attempts for this exam
**Option C (Debug first):** Share backend logs so I can see the exact issue

---

**Which option do you want to try first?**
