# How to Apply Student ID Login Migration

## Quick Fix for 401 Error

If you're seeing `401 Authentication failed` errors after the update, this is because the mobile app has cached credentials from the old email-based login system.

### Solution 1: Clear Mobile App Data (Recommended)

**On the mobile device:**
1. Close the mobile app completely
2. Clear the app's cache/storage OR uninstall and reinstall
3. Open the app again
4. You'll see the new "Student ID" login field
5. Login with your Student ID instead of email

**Or simply restart the app** - it should automatically clear invalid tokens.

### Solution 2: Manual Token Reset (If app persists)

The app should automatically clear invalid tokens, but if issues persist:
1. On the mobile app, go to Profile/Settings
2. Logout completely
3. Login again with Student ID

## Step-by-Step Migration Process

### Step 1: Apply Database Migration

**Option A: Using psql command line**
```bash
cd backend
psql -U postgres -d ui_ges_db -f database/migrations/add_unique_student_id.sql
```

**Option B: Using Node.js script**
```bash
cd backend
node database/migrations/apply-student-id-migration.js
```

**Option C: Using pgAdmin or another PostgreSQL client**
- Open the migration file: `backend/database/migrations/add_unique_student_id.sql`
- Copy and paste into your SQL query window
- Execute the script

### Step 2: Verify Migration

After applying the migration, check that Student IDs were generated:

```sql
SELECT id, name, email, student_id, role 
FROM users 
WHERE role = 'candidate'
ORDER BY id;
```

You should see Student IDs in the format `STU000001`, `STU000002`, etc.

### Step 3: Restart Backend Server

```bash
cd backend
npm run dev
```

Look for the startup message confirming the server is running.

### Step 4: Update Mobile App

**If running in development:**
```bash
cd mobile
# Clear Metro bundler cache
npx expo start --clear

# Or rebuild completely
npx expo run:android
# or
npx expo run:ios
```

**If already installed on device:**
- The JavaScript changes will hot-reload automatically with Expo
- You may need to shake the device and press "Reload"

### Step 5: Test Login

1. Open mobile app
2. You should now see "Student ID" field instead of "Email"
3. Enter a Student ID (e.g., `STU000001`)
4. Enter the password
5. Login should work!

## Finding Your Student ID

If you don't know what Student IDs were assigned, run this query:

```sql
SELECT 
    student_id,
    name,
    email,
    is_active
FROM users 
WHERE role = 'candidate'
ORDER BY student_id;
```

Share these Student IDs with your candidates so they can login.

## Troubleshooting

### Error: "relation users does not exist"
- Make sure you're connected to the correct database
- Verify the database name is `ui_ges_db` (or your custom name)

### Error: "duplicate key value violates unique constraint"
- Some candidates already have duplicate Student IDs
- Run this to find duplicates:
  ```sql
  SELECT student_id, COUNT(*), string_agg(name, ', ') as names
  FROM users 
  WHERE role = 'candidate' AND student_id IS NOT NULL
  GROUP BY student_id 
  HAVING COUNT(*) > 1;
  ```
- Manually fix duplicates before running migration

### Mobile app still shows "Email" field
- Clear the Metro bundler cache: `npx expo start --clear`
- Fully close and reopen the app
- Check that you saved the changes to `LoginScreen.js`

### "Invalid credentials" on login
- Make sure you're using the Student ID, not email
- Student IDs are case-sensitive
- Check the database to verify the Student ID exists

## Quick Reference Commands

```bash
# Check PostgreSQL is running
pg_isready

# Connect to database
psql -U postgres -d ui_ges_db

# View all Student IDs
psql -U postgres -d ui_ges_db -c "SELECT student_id, name FROM users WHERE role = 'candidate' ORDER BY student_id;"

# Restart backend
cd backend && npm run dev

# Restart mobile app with cache clear
cd mobile && npx expo start --clear
```

## Need to Rollback?

If you need to undo the migration:

```sql
-- Remove constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_candidate_student_id;
DROP INDEX IF EXISTS idx_unique_student_id_candidates;

-- Optionally clear auto-generated Student IDs
UPDATE users 
SET student_id = NULL 
WHERE role = 'candidate' AND student_id LIKE 'STU%';
```

---

**Next Steps After Migration:**
- Share Student IDs with all candidates
- Test login with multiple candidates
- Update any documentation or training materials
- Consider customizing the Student ID format if needed
