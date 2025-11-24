# Logo Setup Instructions

## Save Your Logo Image

Please save the lightbulb logo image you provided to the following locations:

### 1. Web Application Logo
Save the image as:
- `public/images/logo.png` (512x512px recommended)
- `public/images/logo-sm.png` (64x64px for smaller displays)

### 2. Mobile Application
Save the image as:
- `mobile/assets/icon.png` (1024x1024px - App icon)
- `mobile/assets/splash.png` (1284x2778px - Splash screen, centered)
- `mobile/assets/adaptive-icon.png` (1024x1024px - Android adaptive icon)

### 3. Favicon (Web)
- `public/favicon.ico` (32x32px)

## Image Specifications

**App Icon (mobile/assets/icon.png)**
- Size: 1024x1024px
- Format: PNG with transparency
- Used for: iOS/Android app icon

**Splash Screen (mobile/assets/splash.png)**
- Size: 1284x2778px (iPhone 14 Pro Max resolution)
- Format: PNG
- Background: Amber/Orange gradient matching your brand
- Logo centered in the image

**Adaptive Icon (mobile/assets/adaptive-icon.png)**
- Size: 1024x1024px  
- Format: PNG with transparency
- Safe area: 66% of total size (avoid corners)

**Web Logo**
- Size: 512x512px (high resolution)
- Format: PNG with transparency
- Will be displayed at various sizes

## After Saving Images

Once you've saved all the images, run:

```bash
# For mobile app - regenerate native code
cd mobile
npx expo prebuild --clean

# Restart the development server
npm start
```

The logo will now appear in:
- ✅ Web app sidebar and login page
- ✅ Mobile app splash screen  
- ✅ Mobile app icon
- ✅ Browser favicon/tab

