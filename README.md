# 11.11 — رحلة الذاكرة

**11.11** is a cinematic psychological interactive experience built as a web application. It combines puzzle-solving, narrative progression, and an evolving AI companion named Echo.

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **State Management:** Zustand
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Routing:** Wouter
- **Build Tool:** Vite 6
- **Mobile:** Capacitor (Android)

## Project Structure

```
artifacts/eleven-eleven/
├── src/
│   ├── core/                    # Game systems
│   │   ├── narrativeEngine.ts       # 4-act story progression
│   │   ├── memoryShardsSystem.ts    # 219 memory shards timeline
│   │   ├── echoCharacterSystem.ts   # Living character animation
│   │   ├── echoPuzzleExpansion.ts   # Expanded puzzle arcs (220-1000)
│   │   ├── echoEvolutionSystem.ts   # Echo transformation engine
│   │   ├── echoImmersiveSystem.ts   # Voice + memory persistence
│   │   └── ...
│   ├── stores/
│   │   └── gameStore.ts             # Central Zustand state (single source of truth)
│   ├── components/                  # UI components
│   ├── styles/
│   │   └── eleven-theme.css
│   ├── App.tsx
│   └── main.tsx
├── android/                        # Capacitor Android project
├── tools/project-doctor/           # Diagnostic scripts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.ts
├── build-android.bat                # Windows Android build
├── build-android.sh                 # Linux/macOS Android build
└── ANDROID_SETUP_INSTRUCTIONS.md
```

## How to Run Locally

```bash
cd artifacts/eleven-eleven
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Build for Web

```bash
cd artifacts/eleven-eleven
npm run build
npm run serve
```

## Android Build

### Prerequisites
- Java JDK 17+
- Android Studio
- Android SDK

### Debug APK

```bash
cd artifacts/eleven-eleven
./build-android.bat debug     # Windows
./build-android.sh debug      # Linux/macOS
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release AAB (Google Play)

1. Generate a keystore:
```bash
keytool -genkey -v -keystore your-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yourkeyalias
```

2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your values.

3. Build:
```bash
cd artifacts/eleven-eleven
./build-android.bat release     # Windows
./build-android.sh release      # Linux/macOS
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Game Systems

- **219 original puzzles** across 4 entities (Echo, Watcher, Signal, Architect)
- **781 generated puzzles** across 5 narrative arcs (Prelude, Fracture, Architect, Signal, Final)
- **1000 total puzzles**
- **4 endings** influenced by trust, memory, flower growth, and player choices
- **24 achievements** tracking milestones
- **219 memory shards** unlocking story fragments
- **Flower growth system** with 5 stages (seed → sprout → bloom → flourish → completed)
- **Real-time clock** affecting world stability and Echo's behavior
- **Echo AI** with dynamic dialogue, personality evolution, and emotional states

## Notes

- The main application is in `artifacts/eleven-eleven/`.
- A legacy standalone prototype exists in `artifacts/11-11-full-app/` and is not used by the main build.
