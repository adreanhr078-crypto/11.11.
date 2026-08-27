---description: Diagnose and triage errors in the 11.11 project (build, console, runtime, network, white-screen, doctor).---
# /debug — Debug & Triage

Diagnose and triage errors in the 11.11 project. This command is a focused, fast path for the most common failure modes the project encounters.

## Usage

`/debug <target>` — where target is one of:

- (empty) — full triage (build + console + doctor + recent changes)
- `build` — Vite build errors
- `typecheck` — TypeScript errors
- `console` — browser console error patterns
- `white-screen` — the most critical failure: white screen on load
- `network` — failed requests, CORS, mixed content
- `worker` — Cloudflare Workers local-dev errors
- `chess` — chess engine / DO / WebSocket issues
- `audio` — Web Audio context errors, mute behavior
- `media` — media asset validation failures
- `doctor` — run project doctor drill-down

## Workflow

1. Capture the failure (error message, exit code, last 50 lines of output).
2. Run the matching diagnostic sequence below.
3. Report the most likely cause and the smallest evidence-backed fix.
4. If multiple causes are plausible, list them by probability.
5. Never propose a fix that touches frozen paths without owner direction.

## Build errors (`/debug build`)

```bash
cd artifacts/eleven-eleven
npm run build 2>&1 | tail -100
```

Common causes:
- Missing import
- TypeScript error (run `/debug typecheck` first)
- Vite plugin misconfiguration (`vite.config.ts`)
- Out-of-memory: increase `NODE_OPTIONS=--max-old-space-size=4096`
- Tailwind 4 not initialized: run `npm install` then rebuild

## Typecheck errors (`/debug typecheck`)

```bash
cd artifacts/eleven-eleven
npm run typecheck 2>&1 | tail -100
npm run typecheck:realtime 2>&1 | tail -100
```

Common causes:
- Discriminated union not narrowed — add a `switch` on the discriminant
- `React.FC` was used — replace with a named function
- Default export — switch to named export
- Type-only import missing `type` keyword
- Drizzle type drift after schema change — run `drizzle-kit generate`

## White-screen debug (`/debug white-screen`) — CRITICAL

The white-screen failure is the project's #1 release blocker. The drill-down:

```bash
cd artifacts/eleven-eleven
npm run doctor:white-screen
npm run doctor:storage
npm run doctor:files
npm run doctor:build
```

Then in the browser:
1. Open DevTools → Console. Look for the first uncaught exception.
2. Open DevTools → Network. Look for the first failing request (4xx/5xx).
3. Open DevTools → Application → Local Storage / IndexedDB. Look for stale keys from a previous version.
4. Hard reload (`Ctrl+Shift+R` / `Cmd+Shift+R`) to bypass cache.

Common causes:
- React error boundary missing — wrap top-level route in `<ErrorBoundary>`
- Vite chunk load failure — clear `.vite` cache and rebuild
- Service worker stale — disable in DevTools → Application
- Hydration mismatch — verify `dir` and `lang` attributes match SSR
- CSS not loaded — verify `<link rel="stylesheet">` resolves
- R3F Suspense fallback missing — add `<Suspense fallback={<SceneFallback />}>`

## Console error patterns

| Pattern | Likely cause | Where to look |
|---|---|---|
| `Cannot read properties of undefined` | Missing null check on fetched data | `src/infrastructure/*/queries.ts` |
| `Hydration mismatch` | Locale or theme not matching server | `src/app/shell/` |
| `WebSocket connection failed` | Realtime DO unreachable | `workers/realtime/wrangler.jsonc` |
| `AudioContext was not allowed` | User gesture required | `src/infrastructure/audio/` |
| `Firebase: Error (auth/...)` | Token expired or invalid | `functions/api/`, `src/infrastructure/firebase/` |
| `CORS policy` | Worker not on allow-list | `wrangler.jsonc` headers |
| `ChunkLoadError` | Lazy-loaded chunk failed | `React.lazy` boundaries |
| `Out of memory` | Bundle too large or 3D scene heavy | `vite.config.ts` (manualChunks) |

## Network debug

```bash
# CORS preflight failures
curl -i -X OPTIONS https://<worker-url>/<path> -H "Origin: https://<app-origin>"

# Mixed content
curl -I https://<app-origin>/ | grep -i "content-security-policy"

# Cold start latency
curl -w "@%{time_total}\n" -o /dev/null -s https://<worker-url>/<path>
```

## Worker debug

```bash
cd artifacts/eleven-eleven
wrangler dev --config workers/realtime/wrangler.jsonc --port 8790 --log-level debug
```

Common causes:
- Binding ID mismatch between `wrangler.jsonc` and the actual resource
- D1 migration not applied locally — `wrangler d1 migrations apply <DB> --local`
- Durable Object class name typo
- Missing `export default { fetch }` on the worker entry
- `nodejs_compat` flag not set when Node APIs are used

## Chess debug

```bash
# Run the realtime worker test
cd artifacts/eleven-eleven
npm run test:realtime
```

Common causes:
- Frontend trusting client-side FEN — FEN must always come from the server
- Reward granted before authoritative receipt — re-order the flow
- WebSocket hibernation mishandled — verify `state.acceptWebSocket()` and `webSocketMessage()`
- Lease reconciliation failing — check the `me:chess_casual:default:open` and `me:chess_ranked_blitz:default:open` patterns

## Audio debug

Common causes:
- `AudioContext` not created after user gesture — initialize on first interaction
- `sfxVolume` not read from `useUiPreferencesStore` — every audio function must accept a volume argument
- Muting the page (visibility hidden) pausing audio — expected; document for accessibility
- Tones above 0.16 of master — `echoMindSignalAudio.ts` caps at `0.16 * volume`

## Doctor drill-down

```bash
cd artifacts/eleven-eleven
npm run doctor             # Full
npm run doctor:counts      # Puzzle / shard / achievement / cinematic / ending counts
npm run doctor:white-screen  # White-screen detectors
npm run doctor:storage     # LocalStorage / IndexedDB health
npm run doctor:files       # File count and structure
npm run doctor:build       # Build output health
```

## Decision

- **PASS** — root cause identified, fix applied, verification re-run, no fixable defects remain.
- **FAIL** — required verification step fails; list failing check and responsible file:line.
- **UNVERIFIED** — runtime evidence unavailable; list what's missing.
- **BLOCKED** — external blocker (missing env, network down); list the blocker.

## Skills to load

- `$11.11-autonomous-quality-gate` — full quality gate
- `$11-11-cloudflare-workers` — Workers / D1 / R2 / DO debug
- `$11-11-chess` — chess engine / DO / WebSocket
- `$11-11-audio` — Web Audio context, mute, volume
- `$11-11-react-patterns` — React error boundaries, Suspense, lazy loading
- `$11-11-three-r3f` — 3D scene debugging
