package expo.modules.kioskmode

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.view.WindowManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoKioskModeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KioskMode")

    Function("enableKioskMode") {
      val activity = appContext.currentActivity ?: return@Function false
      
      try {
        // Enable immersive mode (hide navigation and status bars)
        enableImmersiveMode(activity)
        
        // Keep screen on
        activity.runOnUiThread {
          activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        
        // Request app pinning (task lock) if available
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          val activityManager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
          if (activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) {
            try {
              activity.startLockTask()
              return@Function true
            } catch (e: Exception) {
              // Lock task mode requires device owner or whitelisted app
              // Fall back to immersive mode only
              android.util.Log.w("KioskMode", "Could not start lock task mode: ${e.message}")
            }
          }
        }
        
        return@Function true
      } catch (e: Exception) {
        android.util.Log.e("KioskMode", "Error enabling kiosk mode", e)
        return@Function false
      }
    }

    Function("disableKioskMode") {
      val activity = appContext.currentActivity ?: return@Function false
      
      try {
        // Disable immersive mode
        disableImmersiveMode(activity)
        
        // Allow screen to sleep again
        activity.runOnUiThread {
          activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        
        // Stop app pinning if active
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          val activityManager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
          if (activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE) {
            try {
              activity.stopLockTask()
            } catch (e: Exception) {
              android.util.Log.w("KioskMode", "Could not stop lock task mode: ${e.message}")
            }
          }
        }
        
        return@Function true
      } catch (e: Exception) {
        android.util.Log.e("KioskMode", "Error disabling kiosk mode", e)
        return@Function false
      }
    }

    Function("isKioskModeActive") {
      val activity = appContext.currentActivity ?: return@Function false
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        val activityManager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return@Function activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
      }
      
      return@Function false
    }
  }

  private fun enableImmersiveMode(activity: Activity) {
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // Android 11 and above
        activity.window.setDecorFitsSystemWindows(false)
        activity.window.insetsController?.let { controller ->
          controller.hide(android.view.WindowInsets.Type.systemBars())
          controller.systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_DEFAULT
        }
      } else {
        // Android 10 and below - Use IMMERSIVE_STICKY to prevent swipe gestures
        @Suppress("DEPRECATION")
        activity.window.decorView.systemUiVisibility = (
          android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
          or android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
        
        // Set listener to re-apply immersive mode if system UI becomes visible
        activity.window.decorView.setOnSystemUiVisibilityChangeListener { visibility ->
          if ((visibility and android.view.View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
            // System UI is visible, hide it again
            activity.window.decorView.systemUiVisibility = (
              android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
              or android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
              or android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
              or android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
              or android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
              or android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            )
          }
        }
      }
    }
  }

  private fun disableImmersiveMode(activity: Activity) {
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // Android 11 and above
        activity.window.setDecorFitsSystemWindows(true)
        activity.window.insetsController?.show(android.view.WindowInsets.Type.systemBars())
      } else {
        // Android 10 and below
        @Suppress("DEPRECATION")
        activity.window.decorView.systemUiVisibility = android.view.View.SYSTEM_UI_FLAG_VISIBLE
        // Remove the listener
        activity.window.decorView.setOnSystemUiVisibilityChangeListener(null)
      }
    }
  }
}
