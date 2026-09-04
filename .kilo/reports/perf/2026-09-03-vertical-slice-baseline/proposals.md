# Vertical Slice 1 — Proposals to Make 11.11 Feel Cinematic and Complete

**Date:** 2026-09-03
**Audience:** Owner + implementation agents (game-director, ui-specialist,
cinematic-assets, react-patterns, performance-engineer).
**Scope:** First-time, sign-in → first-puzzle path only. Does not propose
changes to frozen systems, Canon, achievements, or production assets.
**Out of scope here:** solving the Onboarding 409 / step indicator, deciding
how to expand past Chapter 1, and rewriting Phaser/R3F/Co-op.
**Status:** PROPOSAL — every item below is owner-gated before it becomes a
plan.

The baseline report (`./report.md`) shows that the 11.11 web shell, the
guest sign-in flow, Mission Control, and the Manhwa reader are
functionally reachable and visually consistent. The remaining work for a
cinematic-feeling Part 1 is not "more screens" — it is closing the
perceptual and emotional gaps in the journey the player already takes.

## 1. The five player questions, audited

| Question | Today | Gap | Proposed remedy |
|---|---|---|---|
| What do I do now? | Mission Control shows "Read through page 7" with one CTA. | OK at the surface; loses clarity as soon as the Onboarding step indicator lies. | Fix Onboarding indicator (separate UX fix). Echo line + objective title already land. |
| Why does it matter in this world? | Echo speaks "Before I answer, we need one trace from the archive." | Strong, but only the *first* objective shows the in-world reason; subsequent objectives default to a single Echo line. | Extend the objective card to surface the Manhwa page caption and a 1-sentence "what the trace means". |
| How does it work? | Tutorial Step 02 already names "read → test → change the signal". | Decent, but it disappears once the player enters the Manhwa reader. | Add a "first-read" hint that reappears only on the first Manhwa session, not a permanent banner. |
| What changed after I acted? | Manhwa read receipts exist; the puzzle screen is gated server-side; completion calls a real Pages Function. | Good. The risk is the silent 409 in onboarding. | Cover the 409 first; everything else builds on it. |
| What is my next meaningful step? | After page 7 the objective shifts to "Solve 11:11 Signal Sync" automatically. | Verified. | No change. |

## 2. Cinematic feel — what to add and what to leave alone

The vertical slice is small on purpose. The risk is over-investing in
cinematic surfaces that no player reaches this week. The three cinematic
proposals below are ranked by their cost to a first-time player and how
strongly they reinforce "Echo is alive, you are a trace in the signal".

### 2.1. Echo's first line (high impact, low cost)

Today the welcome screen reads "أهلاً بك في تجربة 11.11 / قبل أن تبدأ…
اختر هويتك داخل النظام". The line is system voice, not Echo voice.
Owner-gated change: replace the lead headline with a one-sentence Echo
line that already exists in the Canon ("الإشارة بانتظارك" or
"أنت لست مجرد ذكريات"), and keep the system prompt as a smaller
secondary label. This is purely a copy change gated by the game
director; no structural risk.

### 2.2. Manhwa first-read ambience (high impact, medium cost)

The Manhwa reader is the first place the player sees the Echo Network
art. The current reader shows the panel and the page navigation only.
Owner-gated proposal: enable the existing reduced-motion-friendly
aurora layer (already in `index-*.css`) for the first 1.5 seconds of the
Manhwa route, then fade to the static gradient. No new asset, no
hot-path change. This converts a reading surface into a contemplative
one without spending the cinematic budget.

### 2.3. Signal Sync puzzle entrance (medium impact, medium cost)

The first puzzle is the only puzzle the player reaches. The puzzle
screen already exists, but the entrance transition is a hard route
change. Owner-gated proposal: when Mission Control fires the "Solve
puzzle" objective, route through a 600–900 ms signal-glitch
"harness" overlay that already has CSS in the shell. No new media;
use the existing reduced-motion path. This is the one place the player
*feels* the system; it should not feel like a screen swap.

## 3. Player-experience finish — concrete small items

1. **Manhwa reader reduced-motion default.** Verify that the
   first-read ambience and the page-turn animation both respect
   `prefers-reduced-motion: reduce`. The shell already adds the
   preference; this proposal only asks the cinematic-assets owner to
   confirm the gate is honored on the Manhwa route.
2. **Echo reaction on first puzzle receipt.** Confirm with the
   game-director that the existing
   `STORY_PUZZLE_ECHO_IMPACTS` and Echo Mind server strip properly
   surface a 1-line "I can see a pattern" right after the first
   completion receipt, without requiring a second navigation. This is
   a *re-use* of existing infrastructure, not a new feature.
3. **First daily/weekly return hook.** Daily and Weekly are deferred
   to the post-Chapter-1 phase. This proposal only asks the director
   to *not* disable them silently in the entitlement tree; the first
   return-after-onboarding should still show "Daily unlocks after
   Chapter 1" in a non-blocking toast. This keeps a clear answer to
   "why is there no Daily today?" instead of an empty state.
4. **Localization audit on the new Onboarding.** The 4-step Onboarding
   contains English subtitles like "PROFILE DATA ENCRYPTED // UID
   VERIFIED" mixed with Arabic copy. Owner-gated ask: gate the English
   labels behind a "use bilingual chrome" preference (already exposed
   in `useUiPreferencesStore`) and default to Arabic-only chrome for
   the AR locale to keep the surface calm.

## 4. Performance posture (forward-looking)

The baseline report marks **1 confirmed budget breach in CSS** and
**1 confirmed image budget breach**. Both are owner-visible regressions
vs. the budgets in this agent's own contract. Before any cinematic
work begins, the implementation agent should be asked to:

- Drop initial CSS below 50 KB gzip by splitting the design-system
  tokens out of the entry bundle. Owner-gated because it may touch
  shared UI imports.
- Re-encode `echo-black-echo-protocol-v1.png` to WebP or AVIF and
  downscale until it is under 2.5 MB. Owner-gated because it touches
  a published asset.
- Self-host Cairo with a Latin+Arabic subset to remove the external
  critical-path font dependency. Owner-gated because it adds a new
  static asset under `public/assets/fonts`.

These are not cinematic features, but they protect the cinematic feel:
a 4.6 s LCP on 4G will dominate the player's first impression more than
any visual flourish.

## 5. Items I will *not* propose here (explicit deferral)

- Authoring more Manhwa pages or puzzles — the Canon and frozen
  puzzle data block this without owner direction.
- Bringing Phaser Awakening Ward into the first-time path — it is
  feature-gated off in `featureFlags.ts:41-51,77-98` and changing that
  is a Part 2 decision.
- Switching the welcome art to a CGI Echo render — the current
  code-native 2D EchoPresence passes the visual contract and the
  reduced-motion path; replacing it before a measured FPS win is a
  budget risk, not a quality win.
- Adding Daily/Weekly rewards — Canon and the entitlements tree
  intentionally defer these to Chapter 1 completion. The proposal
  above is a *non-blocking* "Daily unlocks after Chapter 1" line, not
  a reward surface.

## 6. Hand-off

- **Owner decisions needed** for: copy change in §2.1, ambience
  activation in §2.2, puzzle entrance transition in §2.3, every item
  in §3, and the three performance items in §4.
- **No frozen-path or Canon change is proposed.**
- **No production asset is proposed to be modified without owner
  approval.** Untracked Part 1 animatic media should be committed in
  a dedicated PR with rights/provenance before any of §2 lands.
- **Next review:** once the Onboarding 409 and step indicator are
  resolved and the Part 1 animatic is committed or removed, re-run
  the same Edge cold-cache probe to confirm the LCP, CLS, and
  initial-CSS numbers move as expected before the cinematic work in
  §2 begins.
