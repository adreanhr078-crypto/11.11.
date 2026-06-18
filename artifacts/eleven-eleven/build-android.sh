#!/bin/bash

# 11.11 Android Build Script
# Builds the React/Vite app and creates Android APK/AAB packages

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting 11.11 Android Build Process...${NC}"

# Step 1: Build web assets with Vite
echo -e "${GREEN}📦 Building web assets with Vite...${NC}"
cd artifacts/eleven-eleven
npm run build

# Step 2: Copy web assets to Capacitor
echo -e "${GREEN}📁 Copying web assets to Capacitor...${NC}"
npx cap copy

# Step 3: Sync Capacitor project
echo -e "${GREEN}🔄 Syncing Capacitor project...${NC}"
npx cap sync

# Check if we should build debug or release
if [ "$1" = "debug" ]; then
    echo -e "${YELLOW}🛠️  Building DEBUG APK...${NC}"

    # Build debug APK
    cd android
    ./gradlew assembleDebug

    # Output debug APK location
    echo -e "${GREEN}✅ DEBUG APK built successfully!${NC}"
    echo -e "📱 APK Location: ${YELLOW}android/app/build/outputs/apk/debug/app-debug.apk${NC}"

elif [ "$1" = "release" ]; then
    echo -e "${YELLOW}🎯 Building RELEASE AAB (Google Play Bundle)...${NC}"

    # Check if keystore properties exist
    if [ ! -f "keystore.properties" ]; then
        echo -e "${RED}❌ Error: keystore.properties file not found!${NC}"
        echo -e "Please create a keystore.properties file in the android/ directory with your signing configuration:"
        echo -e "${YELLOW}storeFile=your-keystore.jks${NC}"
        echo -e "${YELLOW}storePassword=yourpassword${NC}"
        echo -e "${YELLOW}keyAlias=youralias${NC}"
        echo -e "${YELLOW}keyPassword=yourkeypassword${NC}"
        exit 1
    fi

    # Build release AAB
    cd android
    ./gradlew bundleRelease

    # Output release AAB location
    echo -e "${GREEN}✅ RELEASE AAB built successfully!${NC}"
    echo -e "📦 AAB Location: ${YELLOW}android/app/build/outputs/bundle/release/app-release.aab${NC}"
    echo -e "🎯 Ready for Google Play Store submission!"

else
    echo -e "${RED}❌ Error: Please specify build type${NC}"
    echo -e "Usage: ${YELLOW}./build-android.sh debug${NC} - Build debug APK"
    echo -e "       ${YELLOW}./build-android.sh release${NC} - Build release AAB"
    exit 1
fi

echo -e "${GREEN}🎉 Android build process completed!${NC}"