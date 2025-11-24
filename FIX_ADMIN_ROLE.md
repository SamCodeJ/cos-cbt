# Fix Admin Role - Quick Guide

## Issue
The user `admin@uiges.com` should have the `admin` role, not `teacher`.

## Quick Fix

### Option 1: Using SQL Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run the fix script
psql -U your_username -d your_database_name -f database/fix_admin_role.sql
```

### Option 2: Direct SQL Command

Connect to your database and run:

```sql
-- Update admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@uiges.com';

-- Verify
SELECT id, name, email, role FROM users WHERE email = 'admin@uiges.com';
```

### Option 3: Using psql Interactive

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the update
UPDATE users SET role = 'admin' WHERE email = 'admin@uiges.com';

# Check the result
SELECT email, role FROM users WHERE email = 'admin@uiges.com';

# Exit psql
\q
```

## Verify the Fix

After running the fix, you can verify in two ways:

### 1. Check Database
```sql
SELECT id, name, email, role, is_active 
FROM users 
WHERE email = 'admin@uiges.com';
```

Expected result:
```
 id |    name    |      email        |  role  | is_active 
----+------------+-------------------+--------+-----------
  1 | Admin User | admin@uiges.com   | admin  | t
```

### 2. Try Logging In

1. Clear your browser cache/localStorage:
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   ```

2. Go to login page: `http://localhost:5173/login`

3. Login with:
   - Email: `admin@uiges.com`
   - Password: `password`

4. After login, check the sidebar:
   - You should see "Admin" badge/label
   - Admin menu items should be visible

## Check All User Roles

To see all users and their roles:

```sql
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at
FROM users
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'teacher' THEN 2
        WHEN 'candidate' THEN 3
    END,
    created_at;
```

## Expected Demo Users

Your database should have these users:

| Email                  | Role      | Password   |
|-----------------------|-----------|------------|
| admin@uiges.com       | **admin** | password   |
| teacher@uiges.com     | teacher   | password   |
| jane@uiges.com        | teacher   | password   |
| candidate@uiges.com   | candidate | password   |
| student2@uiges.com    | candidate | password   |
| student3@uiges.com    | candidate | password   |

## If Issue Persists

### Check if User Exists

```sql
SELECT * FROM users WHERE email = 'admin@uiges.com';
```

If no results:
- User doesn't exist
- Run seed script: `npm run db:seed`

### Check Database Connection

```bash
# Test connection
psql -U your_username -d your_database_name -c "SELECT current_database(), current_user;"
```

### Reseed Database

If you want to start fresh:

```bash
# WARNING: This will delete all data!
cd backend
npm run db:migrate  # Recreate tables
npm run db:seed     # Insert demo data
```

## Why This Might Have Happened

Possible reasons the role changed:

1. **Manual Update**: Someone manually changed it in the database
2. **Teacher Creation**: If admin email was accidentally used when creating a teacher
3. **Data Import**: Importing users from a file might have overwritten the role
4. **Migration Issue**: A database migration might have affected the role

## Prevention

To prevent this in future:

1. **Don't use admin email for other accounts**
2. **Check email uniqueness** before creating users
3. **Backup database** regularly
4. **Test in development** before running on production

## Admin Features Checklist

After fixing, verify admin has access to:

- ✅ Dashboard (all users)
- ✅ My Exams
- ✅ Create Exam
- ✅ Question Bank
- ✅ Results
- ✅ Candidates
- ✅ Settings
- ✅ **Admin Dashboard** (admin only)
- ✅ **Manage Teachers** (admin only)
- ✅ **Audit Logs** (admin only)

## Files Reference

- **Seed Definition**: `backend/database/seed.sql` (line 7)
- **Seed Script**: `backend/database/seed.js` (line 20)
- **Fix Script**: `backend/database/fix_admin_role.sql`

Both seed files correctly define admin@uiges.com with role='admin'.

---

**Need Help?**

If you continue having issues, check:
1. Backend console for errors
2. Browser console for auth errors
3. JWT token is valid
4. Database connection is working

