# 🎨 Save Your Lightbulb Logo Here

## Quick Action - Save These Images Now!

Right-click on your lightbulb logo image and save it to these exact locations:

### For Web Application (Right-click → Save Image As):

1. **Main Logo**
   ```
   Path: public/images/logo.png
   Size: 512x512px
   ```

2. **Small Logo (optional)**
   ```
   Path: public/images/logo-sm.png  
   Size: 64x64px
   ```

### For Mobile Application:

3. **App Icon**
   ```
   Path: mobile/assets/icon.png
   Size: 1024x1024px
   Background: Transparent
   ```

4. **Splash Screen**
   ```
   Path: mobile/assets/splash.png
   Size: 1284x2778px  
   Background: Amber (#d97706)
   Logo: Centered
   ```

5. **Android Adaptive Icon**
   ```
   Path: mobile/assets/adaptive-icon.png
   Size: 1024x1024px
   Background: Transparent
   Note: Keep logo in center 66% area
   ```

## ⚡ After Saving Images

### Web App
Just refresh your browser - logos will appear automatically!

### Mobile App
```bash
cd mobile
npx expo start --clear
```

## ✅ What's Already Configured

- [x] Web sidebar logo
- [x] Web login page logo
- [x] Web mobile header logo
- [x] Browser favicon/tab icon
- [x] Mobile app icon
- [x] Mobile splash screen
- [x] Android adaptive icon
- [x] Fallback logos (if images not found)

## 🎯 Image Quick Reference

| Image | Where Used | Size |
|-------|-----------|------|
| logo.png | Web app everywhere | 512×512 |
| logo-sm.png | Mobile web view | 64×64 |
| icon.png | Mobile app icon | 1024×1024 |
| splash.png | Mobile launch screen | 1284×2778 |
| adaptive-icon.png | Android only | 1024×1024 |

## Need to Create Splash Screen?

Use your logo editor (Photoshop, Figma, Canva):
1. Create 1284x2778px canvas
2. Fill with amber color: #d97706
3. Place your logo in the center (max 600x600px)
4. Export as PNG
5. Save to `mobile/assets/splash.png`

That's it! Your logo is ready to shine across all platforms! ✨

