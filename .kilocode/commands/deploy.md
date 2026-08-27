---description: Deploy or build the 11.11 application for web, Android, iOS, or Windows.---
# /deploy — Deployment Tasks

Build or deploy the 11.11 application.

## Usage

/deploy <target> — where target is one of:
- `web` — build Vite web bundle
- `android` — build Android APK/AAB
- `ios` — prepare iOS bundle (requires macOS)
- `windows` — build Tauri Windows installer
- `realtime` — deploy Cloudflare Worker (realtime)
- `functions` — deploy Pages Functions
- `all` — web + realtime + functions

## Build commands

```bash
# Web (Vite)
cd artifacts/eleven-eleven
npm run build

# Android (Capacitor)
npm run build
npx cap sync android
npm run native:android  # opens Android Studio

# iOS (Capacitor, macOS only)
npm run build
npx cap sync ios
npm run native:ios      # opens Xcode

# Windows (Tauri)
npm run desktop:build

# Realtime worker (Cloudflare)
cd workers/realtime
wrangler deploy

# Pages Functions
cd ../..
npx wrangler pages deploy artifacts/eleven-eleven/dist
```

## Pre-deploy checks

```bash
npm run agent:preflight
npm run typecheck
npm test
npm run build
npm run agent:postflight
```

## Environment requirements

- Web: Node 22+
- Android: JDK, Android SDK, Gradle
- iOS: Xcode 15+, macOS
- Windows: Rust, MSVC, WebView2
- Cloudflare: wrangler, CF account, D1, R2, Queue, AI bindings

## Skills to load

- `$11-11-kilo-config` — Kilo environment
- `$11-11-mcp-integration` — MCP servers
- `$11.11-autonomous-quality-gate` — pre-deploy gate
