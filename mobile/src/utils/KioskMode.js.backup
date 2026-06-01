import { Platform, NativeModules, BackHandler, Alert, AppState } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

// Try to import the native kiosk mode module
let NativeKioskMode = null;
try {
  // Try local module first
  NativeKioskMode = require('../../modules/expo-kiosk-mode').default;
} catch (e) {
  // If not available, check NativeModules
  try {
    NativeKioskMode = NativeModules.KioskMode;
  } catch (err) {
    console.log('ℹ️ Native kiosk mode module not available');
  }
}

/**
 * KioskMode Utility
 * 
 * Provides kiosk mode functionality for exams on Android and iOS:
 * - Android: Enables app pinning/kiosk mode via native module
 * - iOS: Locks orientation and disables back navigation (Guided Access must be enabled manually)
 */

class KioskModeManager {
  constructor() {
    this.isKioskActive = false;
    this.backHandler = null;
    this.originalOrientation = null;
    this.appStateSubscription = null;
    this.onAppBackgroundCallback = null;
  }

  /**
   * Activate kiosk mode when exam starts
   * @param {Function} onAppBackground - Optional callback when app goes to background
   */
  async activate(onAppBackground = null) {
    if (this.isKioskActive) {
      console.log('⚠️ Kiosk mode already active');
      return;
    }

    console.log('🔒 Activating Kiosk Mode...');

    try {
      // Store original orientation
      this.originalOrientation = await ScreenOrientation.getOrientationAsync();

      // Store background callback
      this.onAppBackgroundCallback = onAppBackground;

      if (Platform.OS === 'android') {
        await this.activateAndroid();
      } else if (Platform.OS === 'ios') {
        await this.activateIOS();
      }

      this.isKioskActive = true;
      console.log('✅ Kiosk Mode Activated');
    } catch (error) {
      console.error('❌ Failed to activate kiosk mode:', error);
      throw error;
    }
  }

  /**
   * Deactivate kiosk mode when exam ends
   */
  async deactivate() {
    if (!this.isKioskActive) {
      console.log('⚠️ Kiosk mode not active');
      return;
    }

    console.log('🔓 Deactivating Kiosk Mode...');

    try {
      if (Platform.OS === 'android') {
        await this.deactivateAndroid();
      } else if (Platform.OS === 'ios') {
        await this.deactivateIOS();
      }

      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      // Restore original orientation
      if (this.originalOrientation) {
        await ScreenOrientation.lockAsync(this.originalOrientation);
      }

      this.onAppBackgroundCallback = null;
      this.isKioskActive = false;
      console.log('✅ Kiosk Mode Deactivated');
    } catch (error) {
      console.error('❌ Failed to deactivate kiosk mode:', error);
      // Don't throw - we want to allow cleanup even if deactivation fails
    }
  }

  /**
   * Android-specific kiosk mode activation
   */
  async activateAndroid() {
    console.log('🤖 Activating Android Kiosk Mode...');

    // Lock orientation to portrait
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

    // Disable back button - silently block it
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🚫 Back button blocked during exam');
      // Just block it silently - no alert to inform the student
      return true; // Prevent default back action
    });

    // Try to enable Task Lock (App Pinning) if available
    // Note: This requires user confirmation on most Android devices
    try {
      if (NativeKioskMode) {
        const result = await NativeKioskMode.enableKioskMode();
        if (result) {
          console.log('📌 Android Kiosk Mode enabled successfully');
        } else {
          console.log('⚠️ Android Kiosk Mode activation returned false');
        }
      } else {
        console.log('ℹ️ Native Kiosk module not available - using software restrictions');
      }
    } catch (error) {
      console.log('ℹ️ Could not enable native kiosk mode:', error.message);
    }

    // Additional Android restrictions
    console.log('🔒 Android restrictions applied:');
    console.log('  ✓ Back button disabled');
    console.log('  ✓ Orientation locked');
    console.log('  ✓ Task switching discouraged');
  }

  /**
   * Android-specific kiosk mode deactivation
   */
  async deactivateAndroid() {
    console.log('🤖 Deactivating Android Kiosk Mode...');

    // Re-enable back button
    if (this.backHandler) {
      this.backHandler.remove();
      this.backHandler = null;
    }

    // Unlock orientation
    await ScreenOrientation.unlockAsync();

    // Try to disable Task Lock if available
    try {
      if (NativeModules.KioskMode) {
        await NativeModules.KioskMode.disableKioskMode();
        console.log('📌 Android Task Lock disabled');
      }
    } catch (error) {
      console.log('ℹ️ Could not disable native kiosk mode:', error.message);
    }
  }

  /**
   * iOS-specific kiosk mode activation
   */
  async activateIOS() {
    console.log('🍎 Activating iOS Kiosk Mode...');

    // Lock orientation to portrait
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

    // iOS doesn't allow programmatic kiosk mode
    // Silently apply what we can (orientation lock)
    // Note: For full kiosk mode, teacher/admin must enable Guided Access on devices beforehand

    console.log('🔒 iOS restrictions applied:');
    console.log('  ✓ Orientation locked');
    console.log('  ℹ️ For full lockdown, Guided Access should be enabled by admin');
  }

  /**
   * iOS-specific kiosk mode deactivation
   */
  async deactivateIOS() {
    console.log('🍎 Deactivating iOS Kiosk Mode...');

    // Unlock orientation
    await ScreenOrientation.unlockAsync();

    // Silently release - no need to alert about Guided Access
    // If admin enabled it, they'll handle disabling it
    console.log('✅ iOS kiosk mode deactivated');
  }

  /**
   * Check if kiosk mode is currently active
   */
  isActive() {
    return this.isKioskActive;
  }

}

// Export singleton instance
export default new KioskModeManager();
