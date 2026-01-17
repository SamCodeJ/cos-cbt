# Exam Submission Logout Feature

## Overview
When students submit their exam, the app now automatically logs them out and displays the appropriate screen based on whether results are shown or not.

## Implementation Summary

### 1. New Screen: ThankYouScreen
**File:** `mobile/src/screens/ThankYouScreen.js`

A new screen that displays when results are NOT shown to students after submission.

**Features:**
- ✅ Success icon and congratulatory message
- 📋 Information about what happens next
- 🔑 "Return to Login" button that:
  - Clears authentication tokens
  - Logs out the user
  - Redirects to login screen

### 2. Updated: ExamScreen
**File:** `mobile/src/screens/ExamScreen.js`

**Changes:**
- Imported `useAuthStore` to access logout functionality
- Modified `submitExam()` function to:
  - Clear auth tokens (`auth_token` and `candidate`)
  - Call `logout()` to clear store
  - Route to `ResultScreen` if `exam.show_results` is true
  - Route to `ThankYouScreen` if `exam.show_results` is false
  
- Modified `handleAutoSubmitWithViolations()` function with same logout logic

### 3. Updated: ResultScreen
**File:** `mobile/src/screens/ResultScreen.js`

**Changes:**
- Imported `useAuthStore` and `AsyncStorage`
- Added `handleReturnToLogin()` function that:
  - Clears authentication tokens
  - Logs out the user
  - Resets navigation to login screen
  
- Changed "Back to Dashboard" button to "Return to Login" button
- Added login icon to button

### 4. Updated: App.js
**File:** `mobile/App.js`

**Changes:**
- Imported `ThankYouScreen` component
- Registered `ThankYou` route in navigation stack

## User Flow

### When Results Are Shown:
```
Student submits exam
    ↓
Navigate to ResultScreen (token still valid)
    ↓
ResultScreen loads results from API
    ↓
Student views results
    ↓
Student clicks "Return to Login"
    ↓
Auto logout (clear tokens + store)
    ↓
Navigate to LoginScreen
```

### When Results Are NOT Shown:
```
Student submits exam
    ↓
Auto logout (clear tokens + store)
    ↓
Navigate to ThankYouScreen
    ↓
Student clicks "Return to Login"
    ↓
Navigate to LoginScreen
```

## Security Benefits
1. **Automatic Logout**: Students are logged out after viewing results or on thank you screen
2. **Token Clearing**: All authentication tokens are removed from storage
3. **Forced Re-authentication**: Students must log in again to access the system
4. **Session Isolation**: Each exam session is completely isolated
5. **Smart Token Management**: Token remains valid only long enough to fetch results (if needed), then immediately cleared

## Technical Details

### Authentication Cleanup Process
```javascript
// Clear AsyncStorage
await AsyncStorage.removeItem('auth_token');
await AsyncStorage.removeItem('candidate');

// Clear Zustand store
logout();

// Reset navigation
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});
```

### Navigation Methods
- `navigation.replace()`: Used after exam submission to prevent going back
- `navigation.reset()`: Used to completely reset navigation stack to login

## Testing Checklist
- [ ] Submit exam with `show_results = true` → Should see ResultScreen → Click "Return to Login" → Should reach LoginScreen
- [ ] Submit exam with `show_results = false` → Should see ThankYouScreen → Click "Return to Login" → Should reach LoginScreen
- [ ] Verify cannot navigate back after submission
- [ ] Verify tokens are cleared from AsyncStorage
- [ ] Verify auto-submit (time expiry) also triggers logout
- [ ] Verify auto-submit (violations) also triggers logout

## Files Modified
1. `mobile/src/screens/ExamScreen.js` - Added logout on submission
2. `mobile/src/screens/ResultScreen.js` - Added "Return to Login" button with logout
3. `mobile/src/screens/ThankYouScreen.js` - **NEW FILE** - Thank you screen for no-results case
4. `mobile/App.js` - Registered ThankYouScreen route

## Notes
- **Smart Logout Timing**: 
  - When results are shown: Token stays valid until results are fetched, then logout happens when user clicks "Return to Login"
  - When results are NOT shown: Logout happens immediately after submission before showing ThankYouScreen
- Navigation uses `replace` to prevent students from using the back button
- Both screens (Result and ThankYou) provide a clear path back to login
- Kiosk mode is deactivated before navigation to ensure proper cleanup
- This prevents "AxiosError: Request failed" by ensuring the token is available when ResultScreen needs it
