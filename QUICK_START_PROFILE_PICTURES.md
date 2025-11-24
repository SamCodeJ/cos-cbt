# Quick Start: Profile Picture Feature

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run the migration (replace with your database credentials)
psql -U postgres -d uiges -f database/migrations/add_profile_picture.sql
```

Or if you're already connected to psql:
```sql
\i database/migrations/add_profile_picture.sql
```

### Step 2: Restart Backend Server

```bash
# In backend directory
npm start
```

The backend will automatically:
- Create the `uploads/profile-pictures` directory
- Serve profile pictures at `/uploads/profile-pictures/`

### Step 3: Start Using!

**Web App** (Admin/Teachers):
1. Login → Settings → Profile Picture section
2. Click "Upload Picture" → Select image → Done!

**Mobile App** (Candidates):
1. Login → Profile button (top right)
2. Tap profile picture → Choose from library or camera → Done!

## ✅ Feature Checklist

- [x] Database migration completed
- [x] Backend server restarted
- [x] Web app settings page updated
- [x] Mobile app profile screen updated
- [x] Image upload working (max 5MB)
- [x] Image delete working
- [x] Profile pictures displaying

## 🎯 Try It Out

### Test on Web:
1. Open `http://localhost:5173` (or your Vite port)
2. Login as admin or teacher
3. Go to Settings
4. Upload a profile picture

### Test on Mobile:
1. Start mobile app with `npm start`
2. Login as candidate
3. Tap Profile button
4. Tap on picture to upload

## 📁 Where Are Pictures Stored?

```
backend/
  └── uploads/
      └── profile-pictures/
          ├── 1-1699876543210.jpg  (User ID 1's picture)
          ├── 2-1699876545678.png  (User ID 2's picture)
          └── ...
```

Access via: `http://localhost:3000/uploads/profile-pictures/{filename}`

## 🔧 Troubleshooting

### Migration fails?
```sql
-- Check if column already exists
\d users

-- If it exists, you're good to go!
```

### Pictures not uploading?
1. Check backend console for errors
2. Verify `backend/uploads/profile-pictures/` directory exists
3. Check file size (must be < 5MB)
4. Check file format (JPEG, PNG, GIF, WEBP only)

### Pictures not displaying?
1. Check API_BASE_URL in frontend matches your backend URL:
   - Web: `src/api/client.js`
   - Mobile: `mobile/src/api/client.js` and `mobile/src/screens/ProfileScreen.js`

## 📚 Full Documentation

For complete details, see:
- `PROFILE_PICTURE_FEATURE.md` - Complete feature documentation
- `backend/database/migrations/README.md` - Migration guide

## 🎨 UI Preview

### Web Settings Page
```
┌─────────────────────────────────────┐
│  Profile Picture                    │
├─────────────────────────────────────┤
│    ⚪  [Upload Picture]  [Remove]   │
│    Your current picture             │
└─────────────────────────────────────┘
```

### Mobile Profile Screen
```
┌─────────────────────┐
│  ⚪  📷              │
│  Tap to change      │
│                     │
│  [Profile Info]     │
│  [Change Password]  │
└─────────────────────┘
```

## ✨ What's New

### Backend
- ✅ Multer file upload configured
- ✅ Profile picture upload endpoint
- ✅ Profile picture delete endpoint
- ✅ Automatic old picture cleanup
- ✅ Static file serving for uploads

### Web Frontend
- ✅ Profile picture upload UI in Settings
- ✅ Image preview before upload
- ✅ Delete picture option
- ✅ Circular display with fallback icon

### Mobile App
- ✅ Camera access for taking photos
- ✅ Photo library access
- ✅ Built-in crop editor (square/1:1)
- ✅ Delete picture option
- ✅ Circular display with initial fallback

## 🚀 Ready to Go!

That's it! Profile pictures are now fully functional across your application.

**Happy coding! 🎉**

