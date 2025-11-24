# Profile Picture Upload Feature

## Overview
Users (Admins, Teachers, and Candidates) can now upload and manage their profile pictures across the web and mobile applications.

## Features

### ✅ Web App (Admin & Teachers)
- Upload profile picture from Settings page
- Preview before upload
- Delete profile picture
- Automatic old picture cleanup
- Supports: JPEG, PNG, GIF, WEBP
- Max file size: 5MB

### ✅ Mobile App (Candidates)
- Upload from camera or photo library
- Square crop editor built-in
- Delete profile picture
- Automatic old picture cleanup
- Supports: JPEG, PNG, GIF, WEBP
- Max file size: 5MB

## Database Migration

**IMPORTANT**: You need to run the database migration to add the `profile_picture` column.

### Option 1: Using psql

```bash
cd backend
psql -U your_username -d your_database_name -f database/migrations/add_profile_picture.sql
```

### Option 2: Manually in PostgreSQL

```sql
-- Connect to your database
psql -U your_username -d your_database_name

-- Run the migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);
```

### Verify Migration

```sql
-- Check if the column was added
\d users

-- You should see profile_picture in the list of columns
```

## Backend API Endpoints

### 1. Get Current User (Updated)
```
GET /api/auth/me
Authorization: Bearer <token>

Response includes profile_picture field:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "profile_picture": "/uploads/profile-pictures/1-1699876543210.jpg",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 2. Upload Profile Picture
```
POST /api/auth/upload-profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- profile_picture: (file)

Response:
{
  "message": "Profile picture uploaded successfully",
  "user": { ...updated user object }
}
```

### 3. Delete Profile Picture
```
DELETE /api/auth/profile-picture
Authorization: Bearer <token>

Response:
{
  "message": "Profile picture deleted successfully",
  "user": { ...updated user object }
}
```

## File Storage

### Location
- Backend: `backend/uploads/profile-pictures/`
- Format: `{userId}-{timestamp}.{extension}`
- Example: `1-1699876543210.jpg`

### Public Access
Files are served statically at:
```
http://localhost:3000/uploads/profile-pictures/{filename}
```

### Automatic Cleanup
- When user uploads new picture, old one is automatically deleted
- When user deletes picture, file is removed from filesystem

## Security

### Validation
- ✅ Only image files allowed (JPEG, PNG, GIF, WEBP)
- ✅ Max file size: 5MB
- ✅ File type validation on both client and server
- ✅ Authentication required for all endpoints

### File Naming
- Unique filename using userId + timestamp
- Prevents file conflicts
- Old files are cleaned up automatically

## Frontend Implementation

### Web (React)
Location: `src/pages/Settings.jsx`

Features:
- File input with drag & drop
- Image preview
- Upload progress
- Delete option
- Responsive design

### Mobile (React Native)
Location: `mobile/src/screens/ProfileScreen.js`

Features:
- Camera access
- Photo library access
- Built-in crop editor
- Upload progress
- Delete option

## Usage

### Web App

1. Navigate to **Settings** page
2. In the **Profile Picture** section:
   - Click **Upload Picture** to select an image
   - Or **Change Picture** if you already have one
3. Select an image (max 5MB)
4. Image uploads automatically
5. To remove: Click **Remove** button

### Mobile App

1. Navigate to **Profile** from Dashboard
2. Tap on the profile picture or camera icon
3. Choose:
   - **Take Photo**: Opens camera
   - **Choose from Library**: Opens photo gallery
   - **Delete Picture**: Removes current picture (if exists)
4. If taking/selecting photo:
   - Crop to square (1:1 ratio)
   - Tap **Choose** to upload
5. Image uploads automatically

## Display

Profile pictures are displayed in:
- ✅ Settings/Profile page (large, circular)
- 🔄 Sidebar/Header (small, circular) - Coming soon
- 🔄 User lists (small, circular) - Coming soon
- 🔄 Login welcome screen - Coming soon

## Error Handling

### Common Errors and Solutions

#### "No file uploaded"
- Make sure you selected a valid image file

#### "Only image files are allowed"
- File must be JPEG, PNG, GIF, or WEBP format
- Check file extension

#### "Image size should be less than 5MB"
- Compress or resize your image before uploading
- Use image editing software or online tools

#### "Failed to upload profile picture"
- Check backend server is running
- Check uploads directory exists and has write permissions
- Check database connection
- Look at backend console for detailed error

## Troubleshooting

### Pictures not displaying

1. **Check backend URL in frontend**:
   - Web: `src/api/client.js` - `API_BASE_URL`
   - Mobile: `mobile/src/api/client.js` and `mobile/src/screens/ProfileScreen.js` - `API_BASE_URL`

2. **Check uploads directory exists**:
   ```bash
   ls backend/uploads/profile-pictures/
   ```

3. **Check file permissions**:
   ```bash
   chmod -R 755 backend/uploads/
   ```

4. **Check static file serving**:
   - Visit: `http://localhost:3000/uploads/profile-pictures/test.jpg`
   - Should see the image or 404 (not 403 forbidden)

### Database errors

1. **Run migration**:
   ```bash
   psql -U your_username -d your_database_name -f backend/database/migrations/add_profile_picture.sql
   ```

2. **Verify column exists**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'profile_picture';
   ```

## Files Modified/Created

### Backend
- ✅ `backend/middleware/upload.js` - Multer configuration
- ✅ `backend/routes/auth.js` - Upload/delete endpoints
- ✅ `backend/server.js` - Static file serving
- ✅ `backend/database/migrations/add_profile_picture.sql` - Database migration

### Web Frontend
- ✅ `src/api/client.js` - API methods
- ✅ `src/pages/Settings.jsx` - UI implementation

### Mobile App
- ✅ `mobile/package.json` - Added expo-image-picker
- ✅ `mobile/src/api/client.js` - API methods
- ✅ `mobile/src/screens/ProfileScreen.js` - UI implementation

## Next Steps

Potential enhancements:
- [ ] Display profile pictures in sidebar/header
- [ ] Show profile pictures in teacher/candidate lists
- [ ] Image compression on upload
- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Profile picture on login screen
- [ ] Drag & drop upload for web
- [ ] Multiple image formats support
- [ ] Avatar generator for users without pictures

## Support

If you encounter any issues:
1. Check backend console for errors
2. Check browser/mobile console for errors
3. Verify database migration ran successfully
4. Check file permissions on uploads directory
5. Refer to TEACHER_CREATION_TROUBLESHOOTING.md for general debugging tips

