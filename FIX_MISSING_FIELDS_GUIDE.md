# Fix Missing Instructions, Sections, and Passages

## 🔍 Problem Summary

Your mobile app is not showing:
- **Instructions** for questions/sections
- **Section headers** (e.g., "Section A", "Section B")  
- **Passages** for reading comprehension questions

## 🎯 Root Cause

The production database is missing three columns in the `questions` table:
- `section_id` - stores the section identifier (e.g., "Section A")
- `instruction` - stores specific instructions for questions
- `passage` - stores reading passages for comprehension questions

## 📁 Files Involved

### Mobile App (Already Correct)
- **File:** `mobile/src/screens/ExamScreen.js` (lines 615-649)
- **Status:** ✅ Correctly configured to display these fields
- The mobile app expects and displays these fields when present

### Backend API (Already Correct)
- **File:** `backend/routes/candidate.js` (lines 527-541)
- **Status:** ✅ Correctly sends these fields to mobile app
- The API includes `section_id`, `instruction`, and `passage` in the response

### Database Schema (NEEDS FIX)
- **File:** `backend/database/schema.sql`
- **Status:** ❌ Missing the three columns
- **Migration file:** `backend/database/add_question_fields.sql` (exists but not run)

## 🔧 How to Fix

### Step 1: Run the Migration on Production Database

I've created a migration file for you: `ADD_MISSING_QUESTION_FIELDS.sql`

**Option A: Using psql command line**

```bash
# Connect to your production database
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f ADD_MISSING_QUESTION_FIELDS.sql
```

**Option B: Using a database GUI (pgAdmin, DBeaver, etc.)**

1. Open your database management tool
2. Connect to your production database
3. Open the file `ADD_MISSING_QUESTION_FIELDS.sql`
4. Execute the entire script

**Option C: Direct SQL execution**

Connect to your database and run:

```sql
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS section_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS instruction TEXT,
ADD COLUMN IF NOT EXISTS passage TEXT;
```

### Step 2: Verify the Changes

Run this query to confirm the columns were added:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions'
AND column_name IN ('section_id', 'instruction', 'passage');
```

You should see output like:

```
 column_name  | data_type | character_maximum_length
--------------+-----------+-------------------------
 section_id   | character varying | 255
 instruction  | text      | 
 passage      | text      |
```

### Step 3: Add Data to Questions

After the migration, you can:

1. **Edit existing questions** in your admin panel to add:
   - Section IDs (e.g., "Section A", "Comprehension", "Mathematics")
   - Instructions (e.g., "Choose the best answer", "Read the passage and answer")
   - Passages (e.g., reading comprehension text)

2. **Create new questions** with these fields populated from the start

### Step 4: Test on Mobile

1. Open your mobile app
2. Start an exam with questions that have these fields
3. Verify that you now see:
   - 📚 Section headers
   - 📋 Instructions
   - 📖 Passages

## 🌐 Accessing Your Production Database

Your production database is likely hosted at: **https://api.ccos.shop**

### Common connection methods:

**Method 1: SSH into your server**
```bash
ssh your-user@your-server-ip
psql -U postgres -d your_database_name
# Then paste the migration SQL
```

**Method 2: Database URL (if you have it)**
```bash
psql postgresql://user:password@host:port/database -f ADD_MISSING_QUESTION_FIELDS.sql
```

**Method 3: Web-based admin panel**
- Some hosting providers offer web-based database management (like phpPgAdmin)
- Log in and execute the SQL directly

## 📋 Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Mobile App | ✅ Ready | None - already configured correctly |
| Backend API | ✅ Ready | None - already sends these fields |
| Database | ❌ Missing columns | **Run the migration SQL** |

## ⚠️ Important Notes

1. **Backup First:** Consider backing up your database before running migrations
2. **No Downtime:** This migration adds columns with default NULL values, so it won't break existing data
3. **Immediate Effect:** After running the migration, the fields will be available immediately
4. **Gradual Adoption:** You don't need to fill these fields for all questions immediately - they're optional

## 🆘 If You Need Help

If you're not sure how to access your production database, check:
- Your hosting provider's documentation
- Environment variables in your backend (`DATABASE_URL`, `DB_HOST`, etc.)
- Contact your server administrator

The migration is safe to run and uses `ADD COLUMN IF NOT EXISTS` to prevent errors if columns already exist.
