---description: Run a pre-release checklist covering bugs, performance, assets, localization, accessibility, save integrity, and regression for the 11.11 project.---
# /release-check — Pre-Release Checklist

Run a structured pre-release gate for the 11.11 project. This command orchestrates the 8 categories of checks that must pass before any web, Android, iOS, Windows, or Cloudflare release. Use it on every release candidate.

## Usage

`/release-check [target]` — where target is one of:

- (empty) — full release gate (all 8 categories)
- `web` — web build only (Vite + Cloudflare Pages)
- `android` — Android via Capacitor
- `ios` — iOS via Capacitor
- `windows` — Windows via Tauri
- `realtime` — Cloudflare Workers realtime
- `functions` — Cloudflare Pages Functions
- `all` — all targets sequentially

## The 8 Release Categories

For every release, the following 8 categories must pass. Each category has PASS / FAIL / UNVERIFIED decision. The release is **GO** only when all 8 are PASS or explicitly accepted as UNVERIFIED by the owner.

### 1. 🐛 Bugs
- `npm run agent:preflight` → must PASS
- `npm run typecheck` → must PASS
- `npm test` → must PASS
- `npm run test:realtime` → must PASS (for worker targets)
- `npm run doctor` and all sub-checks (`doctor:counts`, `doctor:white-screen`, `doctor:storage`, `doctor:files`, `doctor:build`) → must PASS

### 2. ⚡ Performance
- `npm run build` → must PASS
- `npm run doctor:build` → must PASS
- Inspect `dist/assets/*.js` for size: initial JS gzip < 250KB, initial CSS gzip < 50KB
- Inspect any new dependency for size impact
- If regressions > 5%, FAIL

### 3. 🎨 Assets
- `npm run media:validate` → must PASS
- All images: WebP or PNG, no readable text in generated assets
- All videos: WebM preferred, MP4 fallback, lazy-loaded
- All audio: -14 LUFS, peak -1 dBTP, lazy-loaded
- All GLB: < 5MB, Draco compressed, preloaded via `useGLTF.preload`
- Visual contract preserved (obsidian, crimson, ivory, cyan, no readable text in generated images)

### 4. 🌍 Localization
- All player-facing strings have `ar` and `en` variants
- Bilingual parity check: Arabic RTL and English LTR feel equally authored
- No directional language in Arabic strings (no "left" / "right" — use logical properties)
- Numbers, dates, units use `Intl.NumberFormat`, `Intl.DateTimeFormat`
- Icons with directional meaning mirror in RTL
- `chessCopy(locale)` and other bilingual helpers used everywhere

### 5. ♿ Accessibility
- WCAG 2.2 AA pass (use `@axe-core/playwright` for automated audits)
- Visible focus on every interactive element
- Color-independent state cues
- Touch targets ≥ 44px
- Reduced-motion alternative present and meaningful
- Keyboard navigation works for every interactive flow
- Screen reader announces state changes (`aria-live`)
- Bilingual coverage includes accessibility strings (alt text, aria-label)

### 6. 💾 Save Integrity
- Cloudflare D1 migrations forward-only, never edited
- No schema drift between migrations and Drizzle
- Reward authority remains server-side; never granted from UI
- Save state round-trips correctly on refresh, sign-out/sign-in
- Lost-progress mitigation: in-progress puzzle state survives refresh
- Network failure during save: graceful retry, no double-grant
- Stale response from a previous session never mutates a newer session
- ID-token verification on every rewardable endpoint

### 7. 🔁 Regression
- All previous QA reports (`/.kilo/reports/qa/`) and playtest reports (`/.kilo/reports/playtest/`) are reviewed for open issues
- `git diff --stat` since the last release: reviewed for unexpected changes
- Frozen paths (puzzles, lore, endings, achievements, cinematics): verified untouched
- All 5 mirror skills in sync: `node tools/sync-skill-mirrors.mjs` → no drift
- Doctor counts match previous baseline (puzzles, shards, achievements, endings, cinematics)

### 8. 📦 Canon
- No edits to `puzzles.ts`, `lore.ts`, `domain/cinematics/`, `content/puzzles/`, `_storyPuzzleDefinitions.ts`, `smartLivePuzzleGenerator.ts`
- Story fragment reveals still tied to owning entity
- Echo character consistency
- No contradicting canon facts
- Achievement linkages correct
- Bilingual (ar/en) for all player-facing strings

## Workflow

```bash
cd artifacts/eleven-eleven

# 1. Preflight
npm run agent:preflight

# 2. Typecheck + tests + build
npm run typecheck
npm run typecheck:realtime
npm test
npm run test:realtime
npm run build

# 3. Doctor
npm run doctor
npm run doctor:counts
npm run doctor:white-screen
npm run doctor:storage
npm run doctor:files
npm run doctor:build

# 4. Media
npm run media:validate

# 5. Realtime dry-run
npx wrangler deploy --dry-run --config workers/realtime/wrangler.jsonc

# 6. Audit
npm audit --audit-level=moderate

# 7. Postflight
npm run agent:postflight
```

## Decision Matrix

| Category | Status | Action |
|---|---|---|
| All 8 PASS | **GO** | Proceed to deploy |
| 1 category FAIL | **NO-GO** | Fix before deploy |
| 1+ category UNVERIFIED | **HOLD** | Owner decision required |
| Critical regression or Canon drift | **NO-GO** | Block release, escalate |

## Per-Target Notes

- **web**: `npm run build` then `wrangler pages deploy dist`
- **android**: `npm run build` then `npx cap sync android` then Android Studio
- **ios**: `npm run build` then `npx cap sync ios` then Xcode (macOS only)
- **windows**: `npm run desktop:build` (Tauri)
- **realtime**: `wrangler deploy --config workers/realtime/wrangler.jsonc`
- **functions**: deploy Pages Functions

## Skills to load

- `$11.11-autonomous-quality-gate` — the canonical lifecycle
- `$11-11-react-patterns` — for code review
- `$11-11-three-r3f` — for R3F scenes
- `$11-11-playwright` — for E2E + axe
- `$11-11-accessibility-testing` — for WCAG
- `$11-11-cloudflare-workers` — for Workers / D1 / R2 / DO
- `$11-11-ui` — for visual contract
- `$11-11-audio` — for audio cues
- `$11-11-cinematic-assets` — for media budget
- `$11-11-playtest` — for player experience
- `$11-11-chess` — for chess surface
- `$11-11-puzzles` — for puzzle surface

## Output

Write a release report to `.kilo/reports/release/YYYY-MM-DD-<target>-rc<N>.md`:

```markdown
# Release Report — <target> RC<N>

**Date:** YYYY-MM-DD
**Scope:** <target>
**Verdict:** GO | HOLD | NO-GO

## Category Status
| # | Category | Status | Evidence |
|---|---|---|---|
| 1 | Bugs | PASS/FAIL/UNVERIFIED | <output> |
| 2 | Performance | PASS/FAIL/UNVERIFIED | <output> |
| 3 | Assets | PASS/FAIL/UNVERIFIED | <output> |
| 4 | Localization | PASS/FAIL/UNVERIFIED | <output> |
| 5 | Accessibility | PASS/FAIL/UNVERIFIED | <output> |
| 6 | Save integrity | PASS/FAIL/UNVERIFIED | <output> |
| 7 | Regression | PASS/FAIL/UNVERIFIED | <output> |
| 8 | Canon | PASS/FAIL/UNVERIFIED | <output> |

## Decision
- **GO** if all 8 PASS
- **HOLD** if any UNVERIFIED (owner decides)
- **NO-GO** if any FAIL

## Open Issues
- ...

## Sign-off
- Playtest Director: <verdict>
- QA Engineer: <verdict>
- Performance Engineer: <verdict>
- Owner: <signature>
```

## Anti-patterns to refuse

- Shipping with a failing `npm audit` (moderate or above)
- Shipping with typecheck errors
- Shipping without runtime evidence in Edge
- Shipping with frozen-path edits
- Shipping with a Canon drift
- Shipping with bilingual drift
- Shipping with accessibility regressions
- Shipping with bundle bloat > 5% without explicit owner approval
