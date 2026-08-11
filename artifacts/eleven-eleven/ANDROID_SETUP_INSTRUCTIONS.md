# 11.11 native client workflow

The web client is shared by the PWA, Android, iOS, and Windows wrappers. Game
rules and reward authority stay on the server; native wrappers do not contain a
second copy of gameplay logic.

## Prepare native projects

```bash
npm install
npm run native:sync
```

`native:sync` builds the production Vite bundle and synchronizes both
Capacitor projects. It does not publish, sign, or upload an application.

## Android

Requirements: JDK 17+, Android Studio, Android SDK 36, and a configured
`ANDROID_HOME`.

```bash
npm run native:android
```

For a local debug APK, `build-android.bat debug` (Windows) or
`./build-android.sh debug` (macOS/Linux) builds and then invokes Gradle. Release
builds intentionally fail unless `android/keystore.properties` exists. Never
commit the keystore or its passwords.

The Android client supports portrait and landscape, RTL, and the same offline
archive/training boundary as the PWA. It requests Internet access only; voice
chat and microphone permission are not part of this release.

## iOS

The `ios/` project is generated and synchronized on all platforms, but signing
and device builds require macOS, Xcode, an Apple developer team, and valid
provisioning profiles.

```bash
npm run native:ios
```

## Windows

The Tauri project is under `src-tauri/` and uses the same Vite build.

```bash
npm run desktop:dev
npm run desktop:build
```

Windows packaging requires the Rust toolchain and the platform prerequisites
reported by `npx tauri info`. No desktop installer is considered release-ready
until it has been built, signed, installed, and smoke-tested on a clean device.

## Advertising boundary

11.11 is free and monetized only through contextual ads. Ads are permitted in
the Echo Network hub and Signal Board after consent, with a 30-minute placement
cap. They are forbidden in story scenes, cinematics, puzzles, chess, co-op, and
reward moments. A production ad provider, account identifiers, consent text,
privacy policy, and store disclosures must be configured before release.

## Required release evidence

- Real Android and iOS device tests in portrait and landscape.
- Windows install/uninstall and update tests.
- Arabic and English, touch, keyboard, safe areas, and reduced-motion checks.
- Valid privacy-policy and support URLs.
- Production Firebase, Pages, and realtime Worker configuration.
- Signed artifacts and current store-policy checks at submission time.
