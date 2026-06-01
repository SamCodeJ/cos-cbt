# Production Exam Error Fix Guide

## Problem Summary

**Error Message:** "Not enough questions in section 'Section 1'. Need 1, have 0"

**What's happening:** Your mobile app successfully connects to the production server at `https://api.uiges.shop` and candidates can log in, but when trying to start an exam, the backend can't find questions matching the configured section distribution.

## Root Cause

The exam has **section-based distribution enabled** but:
- ✗ No questions exist in the database for that exam, OR
- ✗ Questions exist but their `section_id` values don't match what's configured in `section_distribution`, OR
- ✗ Questions weren't migrated from local to production database

## Quick Fix (Recommended)

### Option 1: Disable Section Distribution

If you don't need section-based distribution right now, this is the fastest fix:

```sql
-- Connect to production database
psql -U your_db_user -d ui_ges

-- Disable section distribution for all exams
UPDATE exams
SET 
    enable_section_distribution = false,
    section_distribution = NULL
WHERE enable_section_distribution = true;
```

This will allow exams to use simple randomization instead of section-based distribution.

### Option 2: Migrate Questions from Local to Production

If your local database has the questions but production doesn't:

1. **Export from LOCAL database:**
   ```bash
   # On your local machine
   cd backend
   pg_dump -U postgres -d ui_ges -t questions --data-only > questions_backup.sql
   ```

2. **Transfer to production server:**
   ```bash
   scp questions_backup.sql your-username@api.uiges.shop:/tmp/
   ```

3. **Import to PRODUCTION database:**
   ```bash
   # SSH into production server
   ssh your-username@api.uiges.shop
   
   # Import questions
   psql -U your_db_user -d ui_ges < /tmp/questions_backup.sql
   ```

## Detailed Diagnostic Steps

### Step 1: Access Production Database

```bash
# SSH into your VPS
ssh your-username@api.uiges.shop

# Connect to PostgreSQL
psql -U your_db_user -d ui_ges
```

### Step 2: Run Diagnostic Queries

I've created a comprehensive diagnostic script: `diagnose-production-issue.sql`

**On your local machine:**
```bash
# Transfer the diagnostic script to production
scp diagnose-production-issue.sql your-username@api.uiges.shop:/tmp/
```

**On production server:**
```bash
# Run diagnostics
psql -U your_db_user -d ui_ges -f /tmp/diagnose-production-issue.sql
```

This will show:
- Which exams have section distribution enabled
- How many questions each exam has
- Whether section names match between configuration and actual questions
- Recent exam attempt history

### Step 3: Apply Appropriate Fix

Based on diagnostic results, use the appropriate fix from `fix-production-exams.sql`:

```bash
# Transfer fix script
scp fix-production-exams.sql your-username@api.uiges.shop:/tmp/

# Review and apply fixes
psql -U your_db_user -d ui_ges -f /tmp/fix-production-exams.sql
```

## Common Scenarios & Solutions

### Scenario 1: "Exam exists but has 0 questions"

**Solution:** You need to add questions to the exam. Either:
- Import questions from your local database (Option 2 above)
- Create questions through the web admin interface

### Scenario 2: "Section name mismatch (e.g., 'section 1' vs 'Section 1')"

**Solution:** Update the section_id in questions table:
```sql
UPDATE questions
SET section_id = 'Section 1'
WHERE exam_id = YOUR_EXAM_ID
AND section_id = 'section 1';
```

### Scenario 3: "Different data between local and production"

**Solution:** Sync your databases:
```bash
# Full database backup from local
pg_dump -U postgres ui_ges > ui_ges_full_backup.sql

# Restore on production (CAUTION: This will overwrite production data!)
psql -U your_db_user -d ui_ges < ui_ges_full_backup.sql
```

⚠️ **WARNING:** Only do this if you're sure you want to replace production data with local data.

## Verification

After applying fixes, verify everything works:

```sql
-- Check exam configuration
SELECT 
    id,
    title,
    enable_section_distribution,
    section_distribution,
    questions_per_candidate,
    (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count,
    status
FROM exams
WHERE status = 'active';
```

Expected result:
- If `enable_section_distribution = false`: Just needs `question_count >= questions_per_candidate`
- If `enable_section_distribution = true`: Questions must exist with matching `section_id` values

## Test the Mobile App

After fixing the database:

1. **Close and restart the mobile app** (to clear any cached errors)
2. **Try logging in again**
3. **Attempt to start the exam**

You should now be able to start the exam successfully!

## Prevention: Keep Databases in Sync

To avoid this in the future:

1. **Always test on production** before making exams live
2. **Use migrations** for database schema changes
3. **Export and import data** when deploying new exams
4. **Set up automated backups** of your production database

## Need More Help?

If the issue persists:

1. Check backend logs on production:
   ```bash
   pm2 logs backend
   # or
   docker logs ui-ges-backend
   ```

2. Look for detailed error messages like:
   - "No questions available for this exam"
   - "Not enough questions in section..."
   - Database connection errors

3. Verify your production backend is actually running:
   ```bash
   curl https://api.uiges.shop/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

## Contact Information

If you continue to experience issues, ensure:
- ✅ Backend server is running
- ✅ Database connection is working
- ✅ Questions exist in the database
- ✅ Section distribution settings match actual data
