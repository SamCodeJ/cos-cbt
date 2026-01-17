# Fix: 401 Token Error and "Question not found"

## Problem

After implementing Student ID login, you're getting:
1. `401: Access token required` when starting exams
2. "Question not found" error

## Root Cause

The mobile app had cached credentials from the old email-based login system. When you switched to student_id login, the old token was invalidated but still cached, causing authentication failures.

## Solution Applied

### Updated Token Management

**File**: `mobile/src/api/client.js`

**Changes Made:**

1. **Clear old tokens on login**:
   - Now clears any existing tokens before logging in
   - Prevents conflicts between old and new authentication

2. **Added token verification**:
   - Verifies token is stored after login
   - Logs confirmation of successful storage

3. **Enhanced logging**:
   - Shows when token is attached to requests
   - Warns when no token found

## How to Fix

### Step 1: Clear App Data

**On your mobile device:**

1. **Force close the app** completely
2. **Clear app storage** (or uninstall/reinstall)
3. **Reopen the app**

### Step 2: Fresh Login

1. Enter your **Student ID** (e.g., `STU000001`)
2. Enter your **password**
3. Login

The new code will:
- Clear any old tokens
- Store new token properly
- Verify it's saved correctly

### Step 3: Check Logs

Look for these logs in the terminal:
```
🧹 Cleared old credentials
✅ Login successful
🔑 Token stored successfully
💾 Stored user data for: [Your Name]
✅ Token verification successful
🔑 Token attached to request
```

## Quick Test Commands

### Test if backend is receiving token:

In your backend terminal, you should see the request coming through with proper authentication.

### Test token storage in mobile app:

The logs will show:
- `🔑 Token attached to request` - Good! Token is being sent
- `⚠️ No token found in AsyncStorage` - Bad! Token not saved

## Common Issues & Solutions

### Issue 1: Still getting 401 after login

**Solution:**
```bash
# Completely rebuild the mobile app
cd mobile
npx expo start --clear
# Then press 'r' to reload
```

### Issue 2: Token not persisting

**Check AsyncStorage permissions:**
- Make sure app has storage permissions
- Try uninstall/reinstall

### Issue 3: "Question not found" error

This happens when the token is invalid. Once the 401 error is fixed, this will go away.

**Why**: The app tries to load questions but fails authentication, resulting in "Question not found".

## Verification Steps

### 1. Check Login Flow

After login, you should see:
```
🔐 Attempting login for student ID: STU001
📡 Connecting to: http://[IP]:3001/api/candidate/auth/login
🧹 Cleared old credentials
✅ Login successful
🔑 Token stored successfully
💾 Stored user data for: John Doe
✅ Token verification successful
```

### 2. Check Exam Start

When starting an exam, you should see:
```
🔑 Token attached to request
```

And NO 401 errors.

### 3. Check Backend Logs

In the backend terminal, you should NOT see:
```
❌ Access token required
```

Instead, you should see successful requests.

## Prevention

The updated code now:
- ✅ Clears old tokens before new login
- ✅ Verifies token storage
- ✅ Logs token status
- ✅ Better error messages

This prevents the issue from happening again when you update the login system.

## Code Changes Summary

### Before:
```javascript
// Just stored token without cleanup
await AsyncStorage.setItem('auth_token', response.data.token);
```

### After:
```javascript
// Clear old tokens first
await AsyncStorage.removeItem('auth_token');
await AsyncStorage.removeItem('candidate');

// Store new token
await AsyncStorage.setItem('auth_token', response.data.token);

// Verify it was stored
const verifyToken = await AsyncStorage.getItem('auth_token');
if (verifyToken) {
  console.log('✅ Token verification successful');
}
```

## Testing

1. **Logout** (if logged in)
2. **Close app** completely
3. **Reopen app**
4. **Login with Student ID**
5. **Go to an exam**
6. **Start exam**
7. Should work without 401 errors!

## Need More Help?

If still not working:

1. **Check backend is running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check mobile app connection**:
   - Look for backend IP in mobile terminal
   - Verify you're on same WiFi

3. **Check student ID exists**:
   ```sql
   SELECT student_id, name FROM users WHERE student_id = 'STU001';
   ```

4. **Restart everything**:
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Mobile (in new terminal)
   cd mobile
   npx expo start --clear
   ```

---

**Status**: ✅ Fixed  
**Date**: January 2026  
**Affects**: Mobile app authentication after Student ID implementation
