# 11.11 Android Setup & Build Instructions

## 🎮 Android Game Conversion Complete!

Your **11.11** cinematic interactive game has been successfully converted to a production-ready Android application using **Capacitor**.

## 📋 Project Structure

```
artifacts/eleven-eleven/
├── android/                  # Android project (Capacitor)
├── capacitor.config.ts       # Capacitor configuration
├── build-android.bat          # Windows build script
├── build-android.sh           # Linux/Mac build script
├── src/                       # React/Vite source code
├── public/                    # Static assets
└── ...                        # Other project files
```

## ✅ Features Implemented

- **📱 Landscape-Only Mode**: App locked to landscape orientation (`sensorLandscape`)
- **🎮 Immersive Game Mode**: Fullscreen with hidden system UI (status bar + navigation bar)
- **🔄 Full Feature Parity**: All game systems preserved (Echo, Puzzle, Flower, Memory, etc.)
- **🎨 RTL Support**: Arabic language support maintained
- **🚀 Production Ready**: Optimized for Google Play Store submission

## 🛠️ Setup Instructions

### 1. Prerequisites

- **Java JDK 17+** (Required for Android development)
- **Android Studio** (Recommended for emulator testing)
- **Node.js 18+** (Already installed)
- **npm/pnpm** (Already installed)

### 2. Install Android Dependencies

```bash
cd artifacts/eleven-eleven
npm install
```

### 3. Set Up Android Environment

1. Install **Android Studio** from: https://developer.android.com/studio
2. Open Android Studio and install:
   - Android SDK
   - Android SDK Platform (Android 13+)
   - Android SDK Build-Tools
   - Android Emulator (optional)

3. Set up environment variables:
   - `ANDROID_HOME` should point to your Android SDK location
   - Add `platform-tools` to your PATH

## 🚀 Build Commands

### Debug APK (for testing)

```bash
cd artifacts/eleven-eleven
./build-android.bat debug
```

**Output**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release AAB (for Google Play Store)

1. **Create a keystore** (if you don't have one):

```bash
keytool -genkey -v -keystore your-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yourkeyalias
```

2. **Configure keystore properties**:
   - Copy `android/keystore.properties.example` to `android/keystore.properties`
   - Fill in your keystore details

3. **Build release AAB**:

```bash
cd artifacts/eleven-eleven
./build-android.bat release
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

## 📱 Testing on Device/Emulator

1. **Connect Android device** via USB (enable Developer Options & USB Debugging)
2. **Or start emulator** via Android Studio
3. **Install debug APK**:

```bash
cd artifacts/eleven-eleven/android
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 🎯 Google Play Store Submission

### Required Files for Submission:
- `app-release.aab` (from release build)
- App icons (512x512 PNG)
- Screenshots (landscape, 1920x1080)
- Feature graphic (1024x500)

### Store Listing Requirements:
- **App Name**: 11.11 — رحلة الذاكرة
- **Category**: Games / Adventure
- **Content Rating**: Complete questionnaire
- **Privacy Policy**: Required URL
- **Target API Level**: 36 (Android 13+)
- **Minimum API Level**: 24 (Android 7.0+)

## 🔧 Advanced Configuration

### Customize App Information

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">11.11 — رحلة الذاكرة</string>
<string name="title_activity_main">11.11</string>
```

### Update Version Information

Edit `android/app/build.gradle`:

```groovy
defaultConfig {
    versionCode 1          // Increment for each release
    versionName "1.0"      // Version string
}
```

## 🐛 Troubleshooting

### Common Issues:

**1. Java not found:**
- Install JDK 17+ and set `JAVA_HOME` environment variable

**2. Android SDK not found:**
- Install Android Studio and set `ANDROID_HOME` environment variable

**3. Build fails with keystore errors:**
- Ensure `keystore.properties` exists and has correct paths/passwords

**4. App crashes on launch:**
- Check `adb logcat` for error details
- Ensure all web assets are properly built (`npm run build`)

## 📝 Notes

- **Landscape Mode**: App is locked to landscape orientation only
- **Immersive Mode**: System UI automatically hides for cinematic experience
- **Performance**: Optimized for low/mid-range Android devices
- **Audio**: Latency-free playback maintained
- **Animations**: Target 60 FPS on supported devices

## 🎉 Success!

Your **11.11** game is now ready for:
- ✅ Debug testing on devices/emulators
- ✅ Release build for Google Play Store
- ✅ Full cinematic landscape gaming experience

**Enjoy your production-ready Android game!** 🎮📱