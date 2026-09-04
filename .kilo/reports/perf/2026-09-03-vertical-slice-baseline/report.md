# Performance Report — Vertical Slice Baseline (2026-09-03)

**Date:** 2026-09-03
**Scope:** Initial baseline of the 11.11 active application (`artifacts/eleven-eleven`) after the
2026-09-03 Part-1 Manhwa publication commit (`563c893`). Web bundle, runtime
performance, accessibility, Cloudflare bindings, and player-journey evidence on
Microsoft Edge (the project's required browser target). Production assets and
frozen paths were not modified.
**Verdict:** **FAIL — known fixable defects remain; runtime/Worker metrics still UNVERIFIED**

## Build Output (release)

| Chunk / asset | Raw (B) | Gzip (B) | Budget | Status |
|---|---:|---:|---|---|
| Initial JavaScript | 669,594 | 194,133 | < 250,000 gzip | **OK** (55.9 KB headroom) |
| Initial CSS | 339,978 | 58,942 | < 50,000 gzip | **BREACH** (8,942 B / 17.9 % over) |
| `phaser-runtime-*.js` (deferred) | 1,197,998 | 315,683 | — | deferred to Awakening Ward route |
| `three-runtime-*.js` (deferred) | 724,968 | 182,765 | — | deferred to R3F Gameplay route |
| `index.esm-*.js` (deferred Firebase chunks) | — | 159,952 | — | dynamic import only |
| `GameplayScreen-*.js` (deferred) | 296,666 | 90,018 | — | lazy |
| `EchoNetworkScreen-*.js` (deferred) | 133,757 | 41,491 | — | lazy |
| `PuzzleScreen-*.js` (deferred) | 85,593 | 25,372 | — | lazy |
| `echo-transform-base-to-black-coronation-v1.mp4` | 8,366,843 | — | < 10 MB | OK (1.6 MB headroom) |
| `echo-network-archive-teaser-v1.webm` | 3,195,672 | — | — | OK (Teaser budget) |
| `echo-network-part1-opening-anime-animatic-v1.webm` (untracked) | 2,866,761 | — | — | OK size; uncommitted production asset |
| `echo-black-echo-protocol-v1.png` | 2,634,917 | — | < 2.5 MB | **BREACH** (134,917 B / 5.1 % over) |
| Approved Manhwa publication (70 × WebP) | 48,406,148 | — | — | OK, 488,948 B average per page |
| Realtime Worker upload | 377.78 KiB | 74.26 KiB | — | OK size |

Build itself is green (`npm run build` 10.59 s, 2,637 modules). Vite emitted
**chunks > 500 kB after minification** and recommended further dynamic imports.

## Web Vitals (Edge headless, cold cache, emulated 4G)

Two performance probes were run against the local production build at
`http://127.0.0.1:4173/` (preview) and `http://127.0.0.1:3000/` (full dev stack).

| Metric | Phone portrait AR 390×844 | Desktop 1280×800 EN | Budget | Status |
|---|---:|---:|---|---|
| Wall time to networkidle (cold cache, 4G emulation) | 5,620 ms | 5,143 ms | — | observation |
| LCP (largest-contentful-paint) | 4,600 ms | 4,472 ms | < 2,500 ms | **BREACH** (1.84× budget) |
| CLS (cumulative layout shift, reduced-motion) | 0.0088 | 0.0106 | < 0.1 | **OK** |
| INP (interaction-to-next-paint) | UNVERIFIED | UNVERIFIED | < 200 ms | **UNVERIFIED** |
| TTI (time-to-interactive) | UNVERIFIED | UNVERIFIED | < 3,500 ms | **UNVERIFIED** |
| Initial JS gzip | 194.1 KB | 194.1 KB | < 250 KB | **OK** |
| Initial CSS gzip | 58.9 KB | 58.9 KB | < 50 KB | **BREACH** |
| Largest initial resource (mobile) | `index.esm-*.js` 160,592 B (3,062 ms) | — | — | observation |
| Largest initial resource (mobile) | `echo-portrait-v1.webp` 135,458 B (2,894 ms) | — | — | observation |
| Total initial transfer (mobile) | 769,185 B | 685,531 B | — | observation |

Phone-portrait LCP was driven by the hero portrait WebP (`echo-portrait-v1.webp`,
135,458 B). Its decoding/start before the React shell had a measurable cost
under emulated 4G. CLS is comfortably inside budget thanks to reserved layout
space in the shell; INP and TTI were not collected because no realistic
interaction was scripted in this round (only guest sign-in and the onboarding
walk-through).

Reduced-motion path was probed: the dialog's "Sign in" button still runs
5 short border-color/box-shadow transitions (1 s, `cubic-bezier(0.2, 0, 0, 1)`).
This is decorative micro-motion that the system honors even under
`prefers-reduced-motion: reduce`; not a budget breach but worth flagging for
audit and accessibility review.

## Bundle Composition

`vite.config.ts` already splits Phaser and Three into dedicated engine chunks
and the screen registry lazy-loads 17 routes including Main menu, Mission
Control, Manhwa, Puzzle Hub, Echo Mind, Echo Network, R3F gameplay, and Phaser
Awakening Ward. Initial JS composition:

| Resource | Raw (B) | Gzip (B) |
|---|---:|---:|
| `index-C6k7pdgY.js` (entry) | 363,460 | 108,689 |
| `gameStore-ulJidmGx.js` | 170,315 | 45,755 |
| `jsx-runtime-CcffSn4Q.js` | 78,991 | 21,401 |
| `design-system-D4-VZnMO.js` | 30,792 | 9,324 |
| `shellStore-CxHAeEr9.js` | 25,730 | 8,745 |
| `x-*.js` | 306 | 219 |

Notes:

- `gameStore` alone is **45.8 KB gzip** at entry.
- The largest lazy route, the Phaser Awakening Ward route, is **≥ 315.7 KB
  gzip** for the engine plus its screen chunk, before adding CSS and any
  shared 3D assets.
- The R3F Gameplay route pays **≥ 272.8 KB gzip** (Three + Gameplay screen)
  before any GLB/GLTF is added; `VITE_ECHO_MODEL_URL` is currently unset so
  the model is procedural geometry.
- `dist/index.html` still references Google Fonts CSS
  (`fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap`),
  adding an external critical-path dependency without a matching `preconnect`.

## Cloudflare Bindings (current account, read-only inspection)

| Resource | Status | Notes |
|---|---|---|
| D1 `eleven-eleven-player` | 22 tables, 26 migrations, 294,912 B | `num_tables` metadata initially reported 0, but `sqlite_master` query returns the full schema; migrations #1–#10 applied 2026-08-08 → 2026-08-10. |
| Pages Functions `wrangler.toml` | configured | `pages_build_output_dir = "./dist"`, `PLAYER_ALLOWED_ORIGINS`, `PLAYER_DB`, `REPLAYS`, `PLAYER_ANALYTICS` |
| Realtime Worker `workers/realtime/wrangler.jsonc` | configured locally only | five SQLite Durable Objects, D1, R2, queue, Analytics Engine, `nodejs_compat` |
| R2 bucket `eleven-eleven-replays` | not enabled (HTTP 403) | account-level R2 disabled; `replays` binding is dormant until enabled |
| KV namespaces | none | not currently required by any binding |
| Hyperdrive | none | not currently required |
| `eleven-eleven-realtime` Worker | not present in account | only legacy Workers `scmfecho111`, `eleveneleven11111`, `1111mindecho` exist; none is the 11.11 realtime Worker |

D1 is provisioned, healthy, and correctly authoritative. R2 and the realtime
Worker are not yet deployed; running chess/co-op/community on the live account
is therefore not possible without an explicit Cloudflare provisioning step.

## Player Journey Evidence (Edge headless, full dev stack, AR + EN)

`tools/dev-full-stack.mjs` runs Vite + Pages Functions + realtime Worker on
ports 3000 / 8788 / 8790. From a cold reload:

1. **Shell** — 200 OK, no console errors, no overflow on 390×844 or
   1280×800; `html[lang]`/`html[dir]` reflect the active locale.
2. **Sign in dialog** — opens with a complete Arabic email / password / Google /
   Guest layout. Buttons render at 44–54 px tall (passes 44 px touch target).
3. **Guest sign-in** — Firebase Identity Toolkit
   `accounts:signUp`/`accounts:lookup` succeed against the project's
   configured key.
4. **Player bootstrap** — `/api/player/{rollout, profile, story-state,
   bootstrap, save, leaderboard, collection, puzzles}` all return 200.
   `/api/player/collection` returns 200 only after the first verified
   puzzle; before that it is correctly absent. No 4xx/5xx in the cold
   trace.
5. **Onboarding** — 4 visible screens (welcome / first objective / name
   entry / start), but the visible step indicator always reads `01 / 03`.
   The "Start the experience" button is disabled until a username is
   unique and an avatar is selected. **Replay hazard:** submitting a
   non-unique name posts `PUT /api/player/profile` which currently
   returns `409 Conflict` and the dialog does not surface the failure to
   the player; the user is left waiting. (Observed in this probe.)
6. **Mission Control** — route `#/psychological-state` renders, displays
   "Your objective now: Read through page 7 for «11:11 Signal Sync»", the
   Echo hero portrait, progress shell, settings, and pause menu. Echo's
   hero is a code-native 2D presentation (`assets/characters/echo-fullbody-normal-v2.webp`)
   with the `EX-011` mark and a cyan/red signal halo, not an R3F mesh.
7. **Manhwa reader** — `/#/memories` opens. The 70-page publication is
   mounted, the 7-page "available release" window is enforced, chapters
   02–04 are gated by prerequisite puzzles, and the current chapter
   correctly demands the Signal Sync puzzle. Pages 1–7 are reachable;
   page 8+ is blocked server-side.

This is a verified guest sign-in to "first page of the Echo Network
chapter 1" journey in a real headless browser. No white screen, no
console error, no failed request.

## Regression Risks Observed in This Pass

1. **Onboarding step indicator lies.** The visible `01 / 03` indicator does
   not change across the 4 screens the user actually steps through; it
   is a Playwright-detectable a11y/UX issue and could confuse a first-time
   player into thinking the dialog is stuck. Touch target: the primary
   action `.onboarding-primary-action` is not findable by
   `getByRole('button', { name: 'متابعة' })` because the visible label is
   nested inside a `<span>`, weakening testability.
2. **Onboarding 409 is silent.** `PUT /api/player/profile` returning
   409 (e.g. reserved name) leaves the player on the dialog with no
   error affordance.
3. **Initial CSS exceeds budget by 17.9 %.** `index-*.css` is 58.9 KB
   gzip, largely because the design-system and shared shell tokens are
   not yet partitioned into per-route splits.
4. **Untracked production media is shipped via `dist`.** The Part 1
   opening anime animatic, its 10 reference WebPs, the Blender source
   file (2.0 MB), and the poster are all present in `dist/assets/...`
   after `npm run build`. They are not yet committed. The unreleased
   `echo-black-echo-protocol-v1.png` is over the 2.5 MB image budget.
5. **External critical-path font dependency.** Google Fonts CSS is still
   required by the shell, adding a third-party network dep at every cold
   load.
6. **Stale static tests around the old 20-puzzle campaign.** 35 of 45
   failing `npm test` cases still encode the pre-2026-09-03 campaign
   (14 main / 6 secret, Torn Memory, Chapter 4 event IDs, etc.). They
   are stale contracts, not behaviour breaks, but they keep `npm test`
   red. 7 additional failures are likely real: forward-compatible stage
   migration, co-op case distribution, shard balance separation, Weekly
   authority gate, and Manhwa reader page filtering. These require a
   deliberate owner review.
7. **Onboarding/Realtime path is not deployable in the current Cloudflare
   account.** R2 is disabled and the realtime Worker is not deployed.

## Recommendations (priority order)

1. **Fix Onboarding step indicator and 409 surfacing** (UX, low risk).
   Make the `01 / 03` indicator reflect the actual stage and surface a
   clear recoverable error when the profile PUT conflicts. Owner
   direction is needed because both touch locked content strings.
2. **Bring initial CSS under 50 KB gzip.** Split global design-system
   tokens from shell layout; defer non-essential screen styles to their
   lazy route CSS.
3. **Replace Google Fonts dependency with self-hosted Cairo subset.**
   Subset Arabic + Latin to the weights actually used and preload.
4. **Reduce the unreleased 2.5 MB+ PNG** to WebP/AVIF or downscale, and
   commit or remove the Part 1 opening animatic media package
   (animatic + 10 plates + poster + Blender source) in a dedicated PR
   with rights and provenance notes.
5. **Classify the 35 stale `npm test` failures and remove or rewrite
   them as Part 1 contracts.** Treat the 7 likely real failures as a
   separate triage bucket.
6. **Run lighthouse/INP/TTI and reduced-motion profiling on the actual
   full dev stack** so runtime budgets are no longer UNVERIFIED.
7. **Enable R2 in the Cloudflare account and deploy the realtime Worker
   with the current config**, then run chess/co-op latency and
   `max_concurrency: 1` queue load tests before the first player hits
   the network screen.
8. **Establish a 9-page Manhwa playback contract for the canonical
   "Signal Sync" loop** before adding any Chapter 2 content, to keep the
   reward/UX loop honest.

## Frozen-Path Audit

- [x] **No edits to frozen paths detected in this report.**
      `src/puzzles.ts`, `src/lore.ts`, `src/domain/cinematics/`,
      `src/content/puzzles/`, `functions/api/player/_storyPuzzleDefinitions.ts`,
      and `src/domain/live-challenges/smartLivePuzzleGenerator.ts` are
      untouched in this worktree. (`git diff --stat` against `HEAD` is empty
      for these paths.)
- [x] **No production assets modified without approval.** Untracked assets
      were inspected read-only; nothing was committed, removed, or
      rewritten.
- [ ] **Separate concern (not in this scope):** commit `563c893` itself
      contains large textual changes inside `src/content/puzzles/storyPuzzleCatalog.ts`
      and `src/content/manhwa/finalManhwa.ts`. Both files live under
      `src/content/puzzles/` and `src/manhwa/` which are listed as frozen
      by `AGENT_RULES.md` section 6. This report does not modify them but
      flags the change for explicit owner confirmation; until the owner
      confirms, subsequent code or content work touching these files is
      not authorized.

## Handoff

**VERDICT: FAIL** — two confirmed budget breaches (initial CSS 58.9 KB gzip,
`echo-black-echo-protocol-v1.png` 2.63 MB), one confirmed UX break in the
first-time journey (Onboarding 409 is silent), one confirmed UX defect
(Onboarding step indicator does not track the actual stage), and a large
backlog of runtime/Worker metrics that remain UNVERIFIED. The web shell is
stable, accessible at the required viewports, and the player reaches the
first puzzle objective; the cinematic, R3F, and co-op surfaces are out of
the current Part 1 scope and were not measured here.
