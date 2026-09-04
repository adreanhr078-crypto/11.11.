# Vertical Slice Polish — Fix Plan (2026-09-04)

**Date:** 2026-09-04
**Author:** performance-engineer (read-only)
**Goal:** close the verified defects in the Part 1 Vertical Slice so the
guest-to-first-puzzle journey is reliable, accessible, and inside the
project performance budgets. **No new features. No Canon change. No
production asset creation.** This plan is intentionally a *repair* plan,
not a roadmap.

The source of truth for every item is the baseline report at
`.kilo/reports/perf/2026-09-03-vertical-slice-baseline/report.md`.
Every fix is owner-gated if it touches a frozen path, the Canon, or a
production asset. The plan itself is the deliverable; the implementation
agents (`code-simplifier`, `qa-engineer`, `performance-engineer`) will
pick items up under explicit owner approval per item.

## 0. Frozen-path reminder

`AGENT_RULES.md` section 6 lists six frozen paths. No fix in this plan
modifies any of them without owner direction. Where a fix necessarily
brushes against a frozen area (e.g. step 2.2 touches the Onboarding
copy, which lives in a non-frozen component but echoes Canon phrasing),
the patch is scoped to the smallest possible edit and the plan calls it
out explicitly.

| # | Frozen path | Why it is frozen |
|---|---|---|
| F1 | `artifacts/eleven-eleven/src/puzzles.ts` | legacy puzzle archive; not in active runtime path. |
| F2 | `artifacts/eleven-eleven/src/lore.ts` | legacy lore registry. |
| F3 | `artifacts/eleven-eleven/src/domain/cinematics/` | cinematic scene authority. |
| F4 | `artifacts/eleven-eleven/src/content/puzzles/` | story-puzzle canonical data. |
| F5 | `artifacts/eleven-eleven/functions/api/player/_storyPuzzleDefinitions.ts` | server-only solution registry. |
| F6 | `artifacts/eleven-eleven/src/domain/live-challenges/smartLivePuzzleGenerator.ts` | live-challenge generator. |

If a step below names a file under any of these prefixes, the fix must
be deferred to explicit owner direction and re-scoped.

## 1. QA — Behavioural defects with evidence

Owner gate: implement only after `qa-engineer` reviews the patch in a
worktree, replays the same Edge probe used to capture the bug, and
emits a per-item PASS/FAIL line in the postflight report.

### Q1. Onboarding step indicator lies

- **Symptom:** the indicator always reads `01 / 03` across four actual
  steps (welcome, first objective, name + avatar, start).
- **Source:** `src/features/onboarding/FirstTimeOnboarding.tsx` renders
  `onboarding-step-indicator`; the value is hard-coded to a fixed
  label, not bound to the active step index.
- **Repro:** `tools/dev-full-stack.mjs` then sign in as a guest; step
  through the dialog and inspect the indicator text. Edge probe in the
  baseline captured the four stages.
- **Acceptance:** the indicator updates per stage and matches the
  documented 4-step count, or the documentation is reduced to 3 with
  a `mergedOnboardingStep` selector. Whichever the owner prefers.
- **Not in scope:** changing the Onboarding copy itself.

### Q2. Onboarding 409 is silent

- **Symptom:** `PUT /api/player/profile` returns 409 (e.g. duplicate
  username) but the dialog does not surface the error; the user is
  left waiting on the "Start the experience" button.
- **Source:** `src/features/onboarding/FirstTimeOnboarding.tsx` →
  `state.actions.start()` → `onboardingRules.ts`.
- **Repro:** the baseline run with the name `EchoTester9` (kept for
  this bug) produced `status: 409` in the network capture and left the
  dialog unchanged.
- **Acceptance:** on a 4xx response, the dialog shows a recoverable
  error in the same locale, the avatar/name selection is preserved, and
  the user can edit and retry without losing state.
- **Edge cases to test:** 401, 409, 422, 5xx, network failure,
  double-click.

### Q3. Onboarding primary action is not addressable

- **Symptom:** `.onboarding-primary-action` is a `<button>` whose
  visible label sits inside a `<span>`, so the standard
  `getByRole('button', { name: 'متابعة' })` query does not match. This
  is a Playwright/automation testability issue, but it also hides the
  label from some screen-reader flows.
- **Acceptance:** add a proper `aria-label` (or place the visible text
  as the button's accessible name) so the primary action is discoverable
  by role.

### Q4. Sign-in dialog overflow on short phones

- **Symptom:** on 390×844 the dialog measures 916.64 px tall (72.6 px
  taller than the viewport); horizontal layout is fine but the dialog
  needs scroll to reach the password field on small phones.
- **Source:** `src/features/auth/AuthPanel.tsx` (dialog) and the form
  inside it.
- **Repro:** `npm run dev` then `getByRole('dialog').boundingBox()` on
  Pixel 5 emulation.
- **Acceptance:** the dialog fits inside the visible viewport on the
  smallest target (Pixel 5 / 360×780) or the body is scrollable with a
  visible scroll affordance, while the close button and primary action
  remain reachable without keyboard traps.

### Q5. Manhwa reader excludes locked pages correctly — automated check

- **Symptom:** the baseline evidence in
  `src/__tests__/manhwaViewerBrowser.test.ts` (test 42) shows the
  reader used to include 7 pages when only 4 should be open. The test
  is in the "uncertain" bucket. Add a permanent Edge-driven assertion
  in a new `e2e/manhwaReaderEdge.spec.ts` that navigates the reader
  with a fresh guest profile and asserts the visible page counter
  matches the published slice.
- **Acceptance:** the new spec lives in a tracked Playwright config,
  passes on Edge, and is wired into `npm run agent:postflight` without
  adding a Chrome binary (Edge channel only).

### Q6. Reduced-motion path leaks decorative motion

- **Symptom:** even with `prefers-reduced-motion: reduce`, the
  Onboarding primary action runs 5 short border/box-shadow
  transitions (1 s). Not a budget breach, but inconsistent with the
  accessibility intent.
- **Acceptance:** under reduced motion, the primary action either has
  no transition or an instant color swap; verified by
  `document.getAnimations().length === 0` for the relevant targets.

### Q7. Stale test contracts around the old 20-puzzle campaign

- **Symptom:** 35 of 45 failing `npm test` cases still encode the
  pre-2026-09-03 campaign (14 main / 6 secret, Torn Memory, Chapter 4
  events, etc.).
- **Acceptance:** the 35 stale cases are either rewritten to match the
  current 2-puzzle slice or quarantined under
  `src/__tests__/_legacy/` with a one-line note linking to the commit
  that retired them. The remaining 7 likely-real failures (Q8) get a
  separate triage plan.

### Q8. Real behaviour / authority defects (7 likely-real)

These come from the failed-tests classification done in the baseline.
They are not yet reproduced in Edge; the QA agent must reproduce each
one before declaring it a bug.

| ID | Source test | Hypothesis | Repro path |
|---|---|---|---|
| Q8.a | `echoEvolutionPersistence.test.ts` (36, 37) | The migration that maps unknown future stages silently drops them. | Seed a save with a `stage_from_newer_build`; run migration. |
| Q8.b | `echoNetworkFoundation.test.ts` (38) | Co-op cases are not evenly distributed. | Inspect server-defined fingerprints. |
| Q8.c | `gameProgressionPersistence.test.ts` (39, 40) | Shard balance, permanent discovery, and lifetime spending share a key. | Inspect save schema version 22. |
| Q8.d | `liveChallengeIntegrityGates.test.ts` (41) | Weekly may enter the Chapter 1 projection before Chapter 2 is receipted. | Run live-challenge definition fetch with a fresh profile. |
| Q8.e | `manhwaViewerBrowser.test.ts` (42) | Reader window includes more pages than published. | Edge probe. |
| Q8.f | `manhwaReaderLocalization.test.ts` (43) | Archive copy interpolation is missing. | Edge probe with AR + EN. |
| Q8.g | `progressiveDisclosureUi.test.ts` (45) | Main menu uses more than one action label. | Edge probe. |

Q8.a and Q8.d may touch the frozen path F4 / F6 indirectly; defer to
owner review before any fix lands.

## 2. Developer — Targeted, owner-gated code changes

Each item has an owner gate. None of these run without the gate.

### D1. Split initial CSS below 50 KB gzip

- **File:** `src/index.css` (entry) and the design-system imports under
  `src/ui/design-system/`.
- **Why:** baseline shows 58.9 KB gzip vs. 50 KB budget.
- **Proposed change:** introduce a per-screen CSS entry convention so
  the design-system tokens stay in the entry but screen-specific
  utilities move to the lazy route. Use Vite's existing CSS code-split
  behaviour; no new bundler config required.
- **Acceptance:** `npm run build` then `ls -l dist/assets/*.css`; the
  entry CSS is under 50 KB gzip; the per-screen CSS survives a smoke
  test on `/`, `/#/memories`, `/#/puzzles`.
- **Risk:** regressions in dark theme on the shell if a screen rule was
  globally inherited; gate the change behind a `vite build` diff in
  the review.

### D2. Re-encode `echo-black-echo-protocol-v1.png` to WebP/AVIF

- **File:** `public/assets/cinematics/echo-black-echo-protocol-v1.png`
  (or the matching under `artifacts/eleven-eleven/public/...`).
- **Why:** baseline shows 2.63 MB vs. 2.5 MB budget.
- **Proposed change:** re-export at WebP q≈82 and AVIF q≈60; choose the
  smaller file that preserves alpha and acceptable visual quality. Keep
  the original PNG in `public/assets/cinematics/_source/` for reference.
  Update `src/ui/presentation/visualAssets.ts:33-59` if the new file
  path needs to be referenced (verify with `grep` first; only change
  if a string references the PNG).
- **Acceptance:** the published file is ≤ 2.5 MB and referenced where
  expected; the PNG is not deleted.
- **Owner gate:** this is a production asset change. The plan
  recommends keeping both files in source and shipping only the
  smaller one; owner confirms.

### D3. Self-host Cairo with an Arabic + Latin subset

- **File:** `public/assets/fonts/` (new) and the Google Fonts reference
  in `dist/index.html`.
- **Why:** baseline shows an external critical-path font dependency.
- **Proposed change:** subset Cairo to the weights actually rendered
  (300/400/500/600/700/800/900) and to the Latin + Arabic glyphs in
  the visible UI. Preload the critical files.
- **Acceptance:** `dist/index.html` no longer references
  `fonts.googleapis.com`; the page loads the same set of weights from
  the same origin; the LCP does not regress.
- **Owner gate:** the project does not currently have a font license
  file; this requires owner confirmation that the Cairo license is
  acceptable for self-hosting.

### D4. Re-decode the untracked Part 1 anime animatic

- **File:** `artifacts/eleven-eleven/public/assets/cinematics/promotional/echo-network-part1-opening-anime-animatic-v1.webm`
  (and the 10 reference plates under
  `artifacts/eleven-eleven/art/blender/reference/part-1-opening-anime/`).
- **Why:** the WebM is uncommitted; it is shipped via `dist/` after
  `npm run build`; it has no source/provenance note.
- **Proposed change:** **do not re-encode.** Instead, document the
  source hash and rights; commit the WebM + poster + plates in a
  dedicated PR; the existing `compose-part1-opening-anime-animatic.ts`
  is the source of truth for the build, so the build pipeline is not
  changed. If the owner wants a smaller WebM, do a one-pass
  `ffmpeg -i in.webm -c:v libvpx-vp9 -crf 32 -b:v 0 -deadline best -an
  out.webm`; verify with `ffprobe`.
- **Acceptance:** the WebM has a recorded `sourceSha256` in
  `tools/media/asset-budgets.json` or a new
  `tools/media/promotional-assets.manifest.json`; the rights note is
  present.
- **Owner gate:** this touches a production asset. Plan defers to owner
  before commit.

### D5. Refactor Onboarding step indicator

- **File:** `src/features/onboarding/FirstTimeOnboarding.tsx` (UI) and
  `src/features/onboarding/onboardingRules.ts` (state machine).
- **Why:** Q1.
- **Proposed change:** introduce a small `STAGE_DEFINITIONS` array and
  bind the visible indicator to the active index; cap the indicator to
  the count actually used (3 or 4). Add a `data-stage` attribute to
  each step container for testability.
- **Acceptance:** Edge probe (same Playwright spec as the baseline)
  asserts the indicator text changes per stage.

### D6. Surface profile PUT errors in the Onboarding

- **File:** `src/features/onboarding/FirstTimeOnboarding.tsx` and the
  profile store.
- **Why:** Q2.
- **Proposed change:** catch the rejected promise in
  `state.actions.start()`, dispatch an `onboardingError` event, and
  render a localized, recoverable message in the dialog. Preserve
  selected avatar and partial name input. Ensure the primary action is
  re-enabled after the error.
- **Acceptance:** four negative-path Edge tests pass: 401, 409, 422,
  network failure. The positive path is unchanged.

### D7. Re-enable reduced-motion on the Onboarding primary action

- **File:** `src/features/onboarding/FirstTimeOnboarding.tsx` and
  `src/app/onboarding/onboarding.css`.
- **Why:** Q6.
- **Proposed change:** wrap the decorative transitions in
  `matchMedia('(prefers-reduced-motion: reduce)')` and either remove
  them or set `transition-duration: 0s` for the matching selector.
- **Acceptance:** under reduced motion, the primary action has
  `getAnimations().length === 0`; the visual resting state is
  preserved.

### D8. Diagnostic-only: optional LCP/INP/TTI instrumentation

- **File:** `src/app/shell/ApplicationShell.tsx` and
  `src/infrastructure/telemetry/`.
- **Why:** the baseline marks INP/TTI as UNVERIFIED. Owner can choose
  to enable a tiny `PerformanceObserver` that only fires when
  `import.meta.env.DEV` is true or when a `?perf=1` query is present,
  then writes to `console.debug`. No PII, no network.
- **Acceptance:** with `?perf=1` on the guest journey, the console
  emits LCP, CLS, INP, and TTI numbers; without the query, the bundle
  size and runtime are unchanged.

## 3. Performance — Budget repair, evidence-first

### P1. Re-run the Edge cold-cache probe after D1, D2, D3

- **Command:** the same `node C:/.../tmp-walk.cjs` shape used in the
  baseline, but pointed at the production build (`npm run serve` is
  not enough; the probe must run against the dev stack for API
  coverage, or the production preview for static-only).
- **Acceptance:** LCP ≤ 2,500 ms on 390×844 emulated 4G; CLS ≤ 0.1;
  initial CSS ≤ 50 KB gzip; the `echo-black-echo-protocol-v1.*`
  asset ≤ 2.5 MB.

### P2. Capture INP and TTI in the same probe

- Add a `PerformanceObserver({ entryTypes: ['event'] })` to the probe
  with `durationThreshold: 16`. Click the primary Onboarding action
  and a puzzle option; record INP.
- **Acceptance:** INP ≤ 200 ms; TTI ≤ 3,500 ms.

### P3. Lighthouse in Edge channel

- Run `npx lighthouse http://127.0.0.1:3000/ --preset=desktop
  --chrome-flags='--headless=new' --output=json` against the local
  stack. Save the JSON to
  `.kilo/reports/perf/2026-09-04-vertical-slice-polish/lighthouse/`.
- **Acceptance:** the LCP, CLS, and Speed Index numbers match the
  Edge-probe values within ±10 %.

### P4. Realtime Worker provisioning check

- The baseline shows R2 disabled and the realtime Worker not present
  in the account. Confirm with the owner whether to enable R2 and
  deploy the Worker; if yes, follow the `11-11-cloudflare-workers`
  skill to provision.
- **Acceptance:** R2 enabled; `eleven-eleven-realtime` Worker
  deployed; the dry-run bundle still ≤ 100 KB gzip.

### P5. Static analysis diff

- After D1, the Vite chunk warning should reduce. Record the
  pre/post chunk size deltas in the report.
- **Acceptance:** the largest non-engine chunk ≤ 300 KB raw; the
  initial CSS ≤ 50 KB gzip.

## 4. Sequencing and review

1. **Owner approves the plan.** Nothing else happens without this.
2. **D5, D6, D7 land first** because they unblock Q1, Q2, Q6 and the
   QA testability (Q3, Q5).
3. **D1, D2, D3** land next, each in its own PR with a perf delta in
   the description.
4. **D4** lands as a dedicated media-rights PR; this is a separate
   concern from the perf work.
5. **P1, P2, P3** are run after D1/D2/D3 land; the numbers are added
   to the postflight report.
6. **Q1–Q6** are run as Edge specs that are wired into
   `npm run agent:postflight`.
7. **Q7, Q8** are reviewed; Q7 produces a `src/__tests__/_legacy/`
   quarantine, Q8 produces a per-item owner review.
8. **Final:** re-run the full vertical-slice probe and the
   `agent:postflight` chain; emit
   `.kilo/reports/perf/2026-09-04-vertical-slice-polish/report.md`
   with PASS/FAIL/UNVERIFIED per item.

## 5. Forbidden actions

- No new features, no cinematic surface work, no new Manhwa content,
  no new puzzle or reward type, no Daily/Weekly implementation.
- No edits to F1–F6 without owner direction.
- No production asset deletion.
- No new public Manhwa page publication.
- No claim of PASS without the Edge probe showing the metric inside
  budget.

## 6. Owner sign-off

This plan is a draft. Implementation only begins after the owner
reviews each item in §1–§3 and confirms the gates. The performance-
engineer agent remains read-only and only re-runs measurement; the
implementing agents are the `code-simplifier` (Developer) and
`qa-engineer` (QA). The `performance-engineer` (this agent) validates
the postflight.
