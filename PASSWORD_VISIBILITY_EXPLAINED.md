# Understanding Password Visibility When Editing Exams

## Why You're Seeing "Password set (hidden after save)"

### The Issue

When you **edit an existing exam**, you'll see that candidate passwords show as:
```
"Password set (hidden after save)"
```

This is **expected behavior** and here's why:

### How It Works

#### 1. **When Creating a NEW Exam**
✅ Add candidates with passwords  
✅ Passwords visible in table (green text)  
✅ Can copy passwords to share  
✅ **SAVE PASSWORDS BEFORE SAVING EXAM!**  

#### 2. **After Saving the Exam**
🔒 Passwords are hashed in database (secure!)  
🔒 Plain text passwords cannot be retrieved  
🔒 When you re-open the exam, passwords are hidden  

#### 3. **When Editing an Existing Exam**
✅ Existing candidates show: "Password set (hidden after save)"  
✅ Add NEW candidates → Their passwords ARE visible  
✅ NEW candidate passwords shown in green  
✅ Copy NEW passwords before saving  

---

## What Happened in Your Case

Based on your screenshot showing 2 candidates both with hidden passwords:

**Scenario 1: You Saved the Exam Already**
- If you added a candidate and then clicked "Save Exam"
- The page reloaded and fetched candidates from database
- Database only has hashed passwords (security)
- So both show as hidden

**Scenario 2: They Were Already There**
- Both candidates existed before
- Their passwords were set previously
- Passwords hidden for security

---

## How to Get Passwords for Candidates

### Method 1: Write Them Down When Adding (Best!)
When you add a candidate, you'll see a **large toast notification** with:
```
✅ John Doe added!
📧 Email: john@example.com
🔑 Password: abc12345

⚠️ Save this password! It won't be visible after saving the exam.
```

**→ Copy this password immediately!** It stays visible for 10 seconds.

### Method 2: Copy from Table Before Saving
- After adding candidates, passwords show in GREEN in the table
- Copy them from the table
- Save to a document or email them to candidates
- **THEN** click "Save Exam"

### Method 3: For Existing Candidates - Reset Password
If you need to see a candidate's password again:
1. Find the candidate in the table
2. Click the ❌ to remove them
3. Re-add them with a new password
4. Copy the new password from the toast or table
5. Save the exam

---

## Best Practice Workflow

### For New Exams:

1. **Create Exam** (Basic Info tab)
2. **Add All Candidates** (Candidates tab)
3. **IMPORTANT:** Copy all passwords shown in table
4. **Save to a document:**
   ```
   Math Final Exam - Candidate Credentials
   
   1. John Doe - john@example.com - password: abc12345
   2. Jane Smith - jane@example.com - password: def67890
   3. Bob Wilson - bob@example.com - password: ghi24680
   ```
5. **Share credentials with candidates** (email, print, etc.)
6. **THEN Save the Exam**

### For Editing Existing Exams:

1. **Open Exam** for editing
2. **See existing candidates** (passwords hidden - that's OK!)
3. **Add NEW candidates** if needed
4. **Copy NEW candidate passwords** from toast or table (green text)
5. **Save passwords** before clicking "Save Exam"
6. **Save the Exam**

---

## Visual Guide

### Adding a Candidate - What You'll See:

#### Step 1: Fill Form and Click "Add"
```
Name: John Doe
Email: john@example.com  
Password: [leave empty for auto-generate]
[Add Button]
```

#### Step 2: Large Toast Appears (10 seconds)
```
╔═══════════════════════════════════════════╗
║ ✅ John Doe added!                         ║
║ 📧 Email: john@example.com                 ║
║ 🔑 Password: abc12345                      ║
║                                            ║
║ ⚠️ Save this password!                     ║
║    It won't be visible after saving.      ║
╚═══════════════════════════════════════════╝
```

#### Step 3: Candidate Appears in Table
```
| Name      | Email              | Student ID | Password  |
|-----------|--------------------|-----------|-----------| 
| John Doe  | john@example.com   | ST001     | abc12345  | ← GREEN TEXT
```

#### Step 4: After Saving Exam
```
| Name      | Email              | Student ID | Password               |
|-----------|--------------------|-----------|-----------------------| 
| John Doe  | john@example.com   | ST001     | Password set (hidden)  | ← GRAY TEXT
```

---

## Why Can't I See Passwords After Saving?

**Security Best Practice:**

🔒 Passwords are **hashed** using bcrypt before storing in database  
🔒 Hashing is **one-way** - cannot be reversed  
🔒 Even admins/developers cannot see plain passwords  
🔒 This protects candidates if database is compromised  

**How Candidates Login:**
- They enter their password
- System hashes what they enter
- Compares hashed version with stored hash
- If match → Login successful ✅

---

## FAQ

### Q: I forgot to copy a password before saving. What now?

**A:** You have 2 options:

**Option 1:** Reset the password (Recommended)
1. Remove the candidate from exam
2. Re-add them with new password
3. Copy the new password
4. Share with candidate
5. Save exam

**Option 2:** Use backend to reset
(Ask developer to update password directly in database)

### Q: Can I export all passwords at once?

**A:** Currently, passwords are shown:
- In the toast notification (for up to 5 candidates)
- In the table with green text (before saving)

**Tip:** Take a screenshot of the candidate table before saving!

### Q: The candidate says their password doesn't work

**A:** Check:
- Email is exactly correct (no typos)
- Password is case-sensitive
- No extra spaces before/after password
- Candidate is actually assigned to the exam
- Try resetting their password

### Q: Can candidates change their own passwords?

**A:** Not currently. Teachers must update passwords by re-adding candidates.

---

## Summary

✅ **New candidates:** Passwords visible (green) before saving  
✅ **Existing candidates:** Passwords hidden for security  
✅ **Copy passwords immediately** when adding candidates  
✅ **Large toast notification** shows password for 10 seconds  
✅ **Reset password** by removing and re-adding candidate  

⚠️ **ALWAYS COPY PASSWORDS BEFORE SAVING THE EXAM!**

---

## What Changed in Your UI

### Before Update:
- All candidates showed "Auto-generated" (confusing!)
- No warning about password visibility
- No toast with password info

### After Update:
- **NEW candidates:** Password shown in GREEN
- **Existing candidates:** "Password set (hidden after save)" in gray
- **Blue info banner:** Explains password visibility when editing
- **Large toast notification:** Shows password for 10 seconds
- **Better visual feedback:** Know which passwords are visible

---

**For more details, see:** `CANDIDATE_PASSWORD_FEATURE.md`

**Quick Start Guide:** `QUICK_CANDIDATE_SETUP.md`

