@echo off
REM 11.11 Android Build Script for Windows
REM Builds the React/Vite app and creates Android APK/AAB packages

SETLOCAL ENABLEDELAYEDEXPANSION

REM Colors for output
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

call :ColorText 0e "🚀 Starting 11.11 Android Build Process..."
echo.

REM Step 1: Build web assets with Vite
call :ColorText 0a "📦 Building web assets with Vite..."
cd artifacts\eleven-eleven
npm run build

REM Step 2: Copy web assets to Capacitor
call :ColorText 0a "📁 Copying web assets to Capacitor..."
npx cap copy

REM Step 3: Sync Capacitor project
call :ColorText 0a "🔄 Syncing Capacitor project..."
npx cap sync

REM Check build type
if "%1" == "debug" (
    call :ColorText 0e "🛠️  Building DEBUG APK..."
    echo.

    REM Build debug APK
    cd android
    call gradlew assembleDebug

    REM Output debug APK location
    call :ColorText 0a "✅ DEBUG APK built successfully!"
    call :ColorText 0e "📱 APK Location: android\app\build\outputs\apk\debug\app-debug.apk"

) else if "%1" == "release" (
    call :ColorText 0e "🎯 Building RELEASE AAB (Google Play Bundle)..."
    echo.

    REM Check if keystore properties exist
    if not exist "keystore.properties" (
        call :ColorText 0c "❌ Error: keystore.properties file not found!"
        echo.
        echo Please create a keystore.properties file in the android\ directory with your signing configuration:
        call :ColorText 0e "storeFile=your-keystore.jks"
        call :ColorText 0e "storePassword=yourpassword"
        call :ColorText 0e "keyAlias=youralias"
        call :ColorText 0e "keyPassword=yourkeypassword"
        echo.
        exit /b 1
    )

    REM Build release AAB
    cd android
    call gradlew bundleRelease

    REM Output release AAB location
    call :ColorText 0a "✅ RELEASE AAB built successfully!"
    call :ColorText 0e "📦 AAB Location: android\app\build\outputs\bundle\release\app-release.aab"
    call :ColorText 0e "🎯 Ready for Google Play Store submission!"

) else (
    call :ColorText 0c "❌ Error: Please specify build type"
    echo.
    call :ColorText 0e "Usage: build-android.bat debug    - Build debug APK"
    call :ColorText 0e "       build-android.bat release  - Build release AAB"
    echo.
    exit /b 1
)

call :ColorText 0a "🎉 Android build process completed!"
echo.
ENDLOCAL
goto :EOF

:ColorText
echo off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :EOF