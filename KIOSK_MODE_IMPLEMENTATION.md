# Kiosk Mode Implementation Guide

## Overview

Kiosk Mode has been implemented for the C-COS mobile exam application to ensure exam integrity by restricting students' ability to leave the exam app during testing. This feature works on both Android and iOS platforms.

## Features

### What Kiosk Mode Does

When a student **starts an exam** (not on the instruction screen), the following restrictions are activated:

1. **Back Button Disabled** (Android) - Students cannot use the hardware back button to exit
2. **Orientation Locked** - Screen is locked to portrait mode
3. **Task Switching Discouraged** - Attempts to switch apps are blocked/discouraged
4. **Screen Stays On** - Device screen remains active during the exam
5. **Immersive Mode** (Android) - Status bar and navigation buttons are hidden
6. **App Pinning Support** (Android) - If enabled, prevents leaving the app entirely

### When Kiosk Mode is Active

- ✅ **ACTIVE**: When student is taking the exam (on ExamScreen)
- ❌ **NOT ACTIVE**: On the instruction screen before exam starts
- ❌ **NOT ACTIVE**: After exam is submitted or completed

## Technical Implementation

### Files Created/Modified

#### 1. KioskMode Utility (`mobile/src/utils/KioskMode.js`)
Central manager for kiosk mode functionality:
- `activate()` - Enables kiosk mode when exam starts
- `deactivate()` - Disables kiosk mode when exam ends
- Platform-specific implementations for Android and iOS

#### 2. ExamScreen Updates (`mobile/src/screens/ExamScreen.js`)
- Activates kiosk mode in `initializeExam()` before starting the exam
- Deactivates kiosk mode when exam is submitted via `submitExam()`
- Deactivates kiosk mode on auto-submit (time expired or violations)
- Cleanup on component unmount

#### 3. Native Android Module (`mobile/modules/expo-kiosk-mode/`)
Custom Expo module for advanced Android kiosk features:
- `ExpoKioskModeModule.kt` - Native Kotlin implementation
- Enables immersive full-screen mode
- Requests app task lock (pinning)
- Keeps screen awake during exam

#### 4. App Configuration (`mobile/app.json`)
Added Android permissions:
- `SYSTEM_ALERT_WINDOW` - For overlay protection
- `DISABLE_KEYGUARD` - To prevent lock screen during exam
- `REORDER_TASKS` - For task management control

### Dependencies Installed

```json
{
  "expo-screen-orientation": "^9.0.8"
}
```

## Platform-Specific Behavior

### Android

**Automatic Features:**
- ✅ Back button disabled with warning alert
- ✅ Orientation locked to portrait
- ✅ Immersive full-screen mode (hides system UI)
- ✅ Screen stays awake
- ✅ Task lock/App pinning attempted automatically

**User Action Required (Optional but Recommended):**
For maximum security, students should manually enable App Pinning:
1. Go to Settings > Security
2. Enable "App Pinning" or "Screen Pinning"
3. Start the exam
4. Use Recent Apps button and tap the pin icon on the exam app

**How to Exit After Exam:**
- Exam automatically releases kiosk mode when submitted
- If App Pinning is enabled: Long-press Back + Recent Apps buttons

### iOS

**Automatic Features:**
- ✅ Orientation locked to portrait

**User Action Required:**
iOS requires manual activation of Guided Access for kiosk functionality:

**To Enable (Before/During Exam):**
1. Triple-click the Home button (or Side button on newer devices)
2. Select "Guided Access"
3. Draw circles around areas to disable (optional)
4. Tap "Start" in the top-right

**How to Exit After Exam:**
1. Triple-click Home/Side button again
2. Enter Guided Access passcode
3. Tap "End" to exit Guided Access

## User Experience Flow

### Starting an Exam

1. Student views exam instructions (Kiosk Mode NOT active yet)
2. Student taps "I Understand, Start Exam"
3. App navigates to ExamScreen
4. **Kiosk Mode activates automatically** 🔒
5. Student sees alert explaining security mode
   - Android: Info about back button, app switching restrictions
   - iOS: Instructions for Guided Access
6. Student takes exam with restrictions in place

### During the Exam

- Student cannot use back button (Android)
- Student cannot rotate screen
- Student gets warnings if attempting to leave app
- Violations are tracked if screen lock is enforced

### Completing the Exam

1. Student taps "Submit" button
2. Exam is submitted to server
3. **Kiosk Mode deactivates automatically** 🔓
4. Student can navigate freely again
5. iOS users reminded to disable Guided Access if enabled

## Testing the Implementation

### Android Testing

1. **Start Exam:**
   ```
   - Navigate to exam instructions
   - Tap "Start Exam"
   - Verify alert appears about kiosk mode
   - Check that status bar disappears
   ```

2. **Test Restrictions:**
   ```
   - Try pressing back button → Should show warning alert
   - Try rotating device → Should stay portrait
   - Try switching apps → Should be blocked/difficult
   - Check screen stays on
   ```

3. **Submit Exam:**
   ```
   - Complete and submit exam
   - Verify status bar returns
   - Verify back button works again
   ```

### iOS Testing

1. **Start Exam:**
   ```
   - Navigate to exam instructions
   - Tap "Start Exam"
   - Verify alert with Guided Access instructions appears
   ```

2. **Enable Guided Access:**
   ```
   - Triple-click Home/Side button
   - Enable Guided Access
   - Try exiting app → Should be blocked
   ```

3. **Submit Exam:**
   ```
   - Complete and submit exam
   - Verify alert reminds to disable Guided Access
   - Triple-click and end Guided Access
   ```

## Troubleshooting

### Android Issues

**Issue:** Back button still works
- **Solution:** Check that ExamScreen is calling `KioskMode.activate()`
- **Check:** Look for console log "🔒 Activating Kiosk Mode..."

**Issue:** Native kiosk module not working
- **Solution:** The app falls back to software restrictions automatically
- **Note:** Students can manually enable App Pinning for better security

**Issue:** Student can still switch apps
- **Solution:** This is expected without App Pinning enabled
- **Recommendation:** Instruct students to enable App Pinning manually

### iOS Issues

**Issue:** Student can exit the app
- **Solution:** Student must manually enable Guided Access
- **Note:** iOS doesn't allow programmatic kiosk mode activation

**Issue:** Guided Access not available
- **Solution:** Enable in Settings > Accessibility > Guided Access

## Security Considerations

### What Kiosk Mode Protects Against

✅ Accidental app exits
✅ Using back button to leave exam
✅ Checking other apps during exam
✅ Screen rotation distractions
✅ Quick app switching

### What Kiosk Mode Does NOT Protect Against

❌ Second device usage (students using another phone/computer)
❌ Someone else taking the exam
❌ Screenshots (would require additional permissions)
❌ Screen recording (would require additional permissions)

### Best Practices for Exam Security

1. **Combine with other features:**
   - Use `enforce_screen_lock` setting in exam configuration
   - Enable violation tracking (app minimization)
   - Set auto-submit after 3 violations

2. **Physical proctoring:**
   - In-person supervision when possible
   - Controlled exam environment
   - ID verification before exam

3. **Student instructions:**
   - Demonstrate App Pinning/Guided Access before exam
   - Provide clear written instructions
   - Have support available during exam

## Code Example: Manual Implementation

If you need to add kiosk mode to other screens:

```javascript
import KioskMode from '../utils/KioskMode';

// In your component
useEffect(() => {
  // Activate when component mounts
  const activateKiosk = async () => {
    try {
      await KioskMode.activate();
    } catch (error) {
      console.error('Failed to activate kiosk:', error);
    }
  };
  
  activateKiosk();

  // Deactivate when component unmounts
  return () => {
    KioskMode.deactivate().catch(err => 
      console.error('Cleanup error:', err)
    );
  };
}, []);
```

## Future Enhancements

### Potential Improvements

1. **Screenshot blocking** - Prevent screenshots during exams
2. **Screen recording detection** - Detect and block screen recording
3. **Network monitoring** - Alert if student switches WiFi/cellular
4. **Camera access** - Detect if camera is accessed during exam
5. **Auto App Pinning** - Request as device admin for automatic pinning
6. **Custom lockdown** - More granular control over allowed actions

### Known Limitations

1. **iOS Restrictions** - Cannot programmatically enable Guided Access
2. **Android Permissions** - Some features require device admin privileges
3. **User Cooperation** - Students can still use another device
4. **Battery Drain** - Keeping screen on may drain battery faster

## Summary

Kiosk Mode is now fully implemented and will automatically:
- ✅ Activate when student starts exam (not on instruction screen)
- ✅ Restrict app switching and back button
- ✅ Lock screen orientation
- ✅ Keep screen awake
- ✅ Deactivate when exam is submitted

Students will see appropriate instructions for their platform (Android/iOS) and can take exams with confidence that the app will help maintain exam integrity.

## Support

For issues or questions about Kiosk Mode:
1. Check console logs for "🔒 Kiosk" messages
2. Verify ExamScreen is calling activate/deactivate
3. Test on physical devices (not emulator/simulator)
4. Ensure all dependencies are installed

---

**Last Updated:** January 14, 2026
**Implementation Status:** ✅ Complete
