# Quick Start: Adding Candidates with Passwords

## For Teachers

### Method 1: Manual Entry (Recommended for Small Groups)

1. **Go to Create/Edit Exam → Candidates Tab**

2. **Fill in the form:**
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Student ID: `ST001` (optional)
   - Password: `john123` (leave empty for auto-generation)

3. **Click "Add"**
   - Password will appear in the table
   - Copy the password to share with the candidate

4. **Repeat for each candidate**

5. **Save Exam**

---

### Method 2: CSV Upload (Recommended for Large Groups)

1. **Go to Create/Edit Exam → Candidates Tab**

2. **Click "Template" button**
   - Downloads `candidates_template.csv`

3. **Edit the CSV file:**
   ```csv
   name,email,student_id,password
   John Doe,john@example.com,ST001,john123
   Jane Smith,jane@example.com,ST002,jane456
   Bob Wilson,bob@example.com,ST003,
   ```
   *Note: Empty password will auto-generate*

4. **Click "Upload CSV"**
   - Select your filled CSV file
   - Candidates added instantly
   - Passwords shown in table

5. **Save Exam**

---

### Sharing Passwords with Candidates

After adding candidates, you'll see a table like this:

| Name | Email | Student ID | Password |
|------|-------|------------|----------|
| John Doe | john@example.com | ST001 | `john123` |
| Jane Smith | jane@example.com | ST002 | `jane456` |
| Bob Wilson | bob@example.com | ST003 | `a3f4c9e8` |

**Share these credentials with your candidates securely:**
- Email them individually
- Print and hand out
- Share via secure messaging
- Display in class (for practice exams only)

---

## For Candidates

### Logging Into the Mobile App

1. **Open the Candidate Mobile App**

2. **Enter Your Credentials:**
   - Email: `john@example.com`
   - Password: `john123`

3. **Tap "Login"**

4. **You'll See Your Assigned Exams:**
   - Only exams you've been added to will appear
   - Tap an exam to start

---

## Quick Tips

### For Teachers

✅ **Password Tips:**
- Use simple passwords for practice exams
- Use strong passwords for important exams
- Leave password empty for auto-generation (secure!)
- Update passwords by re-adding the candidate

✅ **CSV Tips:**
- Don't use commas in passwords
- Make sure header row is: `name,email,student_id,password`
- Test with small file first
- Password column can be empty for auto-generation

✅ **Access Control:**
- Candidates only see exams they're assigned to
- Add the same candidate to multiple exams for multiple exam access
- Remove candidates by deleting them from the table

### For Candidates

✅ **Login Tips:**
- Use email provided by teacher (exactly as given)
- Password is case-sensitive
- No spaces before/after password
- Contact teacher if login fails

✅ **After Login:**
- You'll only see exams you're assigned to
- If no exams appear, contact your teacher
- Make sure you're added to the correct exam

---

## Example Workflow

### Scenario: Math Final Exam with 30 Students

**Step 1:** Teacher creates exam "Math Final 2024"

**Step 2:** Teacher prepares CSV file:
```csv
name,email,student_id,password
Alice Johnson,alice@school.com,2024001,
Bob Smith,bob@school.com,2024002,
Charlie Brown,charlie@school.com,2024003,
...
```
*Empty passwords = auto-generated for security*

**Step 3:** Teacher uploads CSV
- All 30 students added in seconds
- Passwords auto-generated

**Step 4:** Teacher exports candidate list
- Copy the table to a document
- Email to each student privately
- Example email:
  ```
  Hi Alice,
  
  Your Math Final Exam credentials:
  Email: alice@school.com
  Password: a3f4c9e8
  
  Login to the Candidate App before exam day to test your access.
  ```

**Step 5:** Students login and take exam
- Each student logs in with their credentials
- Only sees "Math Final 2024" exam
- Takes exam on scheduled date

---

## Common Questions

**Q: What if I forget to add a password?**  
A: No problem! The system automatically generates a secure 8-character password.

**Q: Can I change a candidate's password?**  
A: Yes! Just re-add the candidate with a new password. The system will update it.

**Q: Can candidates change their own passwords?**  
A: Not currently. Teachers must update passwords if needed.

**Q: What if a candidate is assigned to multiple exams?**  
A: They use the same email/password to login and will see all their assigned exams.

**Q: How secure are auto-generated passwords?**  
A: Very secure! They use cryptographic random generation (8 hex characters).

**Q: Can I reuse emails across different exams?**  
A: Yes! The same candidate can be added to multiple exams.

---

## Troubleshooting

### "Invalid credentials" error on login

- ✓ Check email is exactly as provided (no typos)
- ✓ Check password (case-sensitive, no spaces)
- ✓ Verify candidate was added to exam
- ✓ Ask teacher to verify candidate list

### "No exams available" after login

- ✓ Verify you were added to an exam
- ✓ Check exam dates (might not be published yet)
- ✓ Contact teacher to re-add you

### CSV upload not working

- ✓ Use the template file as a starting point
- ✓ Make sure header is exact: `name,email,student_id,password`
- ✓ No commas in any fields
- ✓ Save as CSV UTF-8 format

---

## Summary

### Adding Candidates: 2 Ways
1. **Manual** - Good for small groups, custom passwords
2. **CSV** - Good for large groups, bulk operations

### Passwords: 3 Options
1. **Custom** - Teacher chooses (e.g., "john123")
2. **Auto-generated** - System creates (e.g., "a3f4c9e8")
3. **Mixed** - Some custom, some auto

### Candidate Access
- Login with email + password
- See only assigned exams
- Take exams on mobile app

---

**Need Help?** Refer to the complete documentation in `CANDIDATE_PASSWORD_FEATURE.md`

**Ready to Go!** 🎉 Your candidates now have secure, custom credentials for exam access.

