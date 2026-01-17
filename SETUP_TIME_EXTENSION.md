# 🚀 Quick Setup: Time Extension Feature

## Step 1: Apply Database Migration

Run this command in your terminal:

```bash
# Navigate to backend directory
cd backend

# Apply the migration
node database/migrations/apply-time-extension.js
```

**Important:** Make sure your backend `.env` file has the correct database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ui_ges
DB_USER=postgres
DB_PASSWORD=your_password
```

## Step 2: Restart Backend

```bash
cd backend
npm run dev
```

## Step 3: Test the Feature

### As a Teacher:
1. Log into the web portal
2. Go to "My Exams"
3. Find an active exam
4. Click the menu (⋮) and select "Extend Time"
5. Add minutes globally or for individual students

### As a Student:
1. Start taking an exam on mobile app
2. Teacher extends time
3. Within 30 seconds, you'll see a notification
4. Timer will update automatically

## ✅ That's It!

The feature is now ready to use. For detailed documentation, see [TIME_EXTENSION_FEATURE.md](./TIME_EXTENSION_FEATURE.md)

## ⚠️ Troubleshooting

**Migration fails with "relation already exists":**
- The migration was already applied. You're good to go!

**Can't see "Extend Time" option:**
- Make sure the exam status is "active" or "scheduled"
- Only teachers can see this option
- Try refreshing the page

**Time not updating on mobile:**
- Make sure mobile app is running and connected
- Wait up to 30 seconds for automatic update
- Check that backend is accessible from mobile device

