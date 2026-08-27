---
name: 11-11-accessibility-testing
description: Audit, test, and remediate accessibility for the 11.11 project. Enforces WCAG 2.2 AA, bilingual Arabic/English coverage with RTL/LTR, visible focus, color-independent state cues, 44px touch targets, reduced-motion alternatives, keyboard navigation, and screen-reader support. Use before every player-facing change, every UI redesign, and every release. Do not modify frozen game logic, puzzle canon, or other locked systems unless the task explicitly scopes to accessibility-only changes.
---

# 11.11 Accessibility Testing

Accessibility is a first-class quality dimension in 11.11, not a polish step. The game must be playable and understandable for users on touch, keyboard, screen reader, RTL languages, reduced-motion preferences, and high-contrast displays. This skill covers the audit, test, and remediation patterns.

## Active implementation facts

- **Standard:** WCAG 2.2 AA is the project floor. AAA is encouraged where it does not regress performance.
- **Primitives:** `@radix-ui/*` provides the accessible widget foundation. Drei's `Html` is the bridge for 3D-scene HUD. `framer-motion` exposes `useReducedMotion` for honoring motion preferences.
- **Languages:** Arabic (`ar`, RTL) and English (`en`, LTR) are co-first. Every player-facing string is bilingual.
- **Tooling:** `@axe-core/playwright` for automated audits, `pa11y-ci` for CI, native Playwright for keyboard and screen-reader flows.
- **Reduced motion:** `framer-motion` reads `prefers-reduced-motion: reduce` automatically. Custom CSS animations must read the same media query.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the surface, screen, and existing accessibility status before changing it.
3. Identify the acceptance criteria:
   - WCAG 2.2 AA pass.
   - Bilingual coverage on every player-facing string.
   - Keyboard reachable from the first tab.
   - Visible focus on every interactive element.
   - Color-independent state cues.
   - 44px touch targets.
   - Reduced-motion alternative present and meaningful.
   - Screen reader announces state changes.
4. Run the audit suite (axe + pa11y + manual keyboard/screen reader).
5. File defects in the QA report at `.kilo/reports/qa/`.
6. Re-run after every fix.
7. Run `npm run agent:postflight`. If it fails, do not declare success.

## Perceptual rules (color, contrast, state)

- Body text: 4.5:1 minimum contrast against the immediate background.
- Large text (≥ 18pt or 14pt bold): 3:1 minimum.
- Non-text UI components and graphical objects: 3:1 minimum.
- State cannot be conveyed by color alone. Pair every state color with an icon, label, shape, or position change.
- The visual contract (obsidian + signal crimson + pale ivory) is the source of palette. New colors must extend the contract, not replace it.
- Status indicators: success uses a check icon and a textual label; warning uses a triangle and a textual label; error uses a clear icon and a textual label.

## Focus rules

- Every interactive element shows a visible focus ring.
- Focus ring contrast against adjacent colors: 3:1 minimum.
- Focus order matches the visual reading order. Do not use positive `tabindex`.
- Focus is not trapped accidentally. Modal dialogs trap and restore focus to the trigger.
- Skip-to-content link is the first focusable element on every screen.

## Keyboard rules

- Every interactive flow is reachable and operable with the keyboard alone.
- Common shortcuts: `Tab`/`Shift+Tab` to move, `Enter`/`Space` to activate, `Esc` to dismiss overlays, arrow keys for composite widgets.
- Chess board: arrow keys move the cursor; `Enter` selects a piece or commits a move; `Esc` cancels.
- Puzzle grid: arrow keys move the cursor; `Enter` selects; number keys select answers where applicable.

## Touch and pointer rules

- Every touch target is at least 44×44 CSS pixels.
- Spacing between adjacent touch targets is at least 8px.
- Pointer events are paired with keyboard equivalents.
- No hover-only affordances. Hover reveals supplementary information; the action is reachable without hover.

## Bilingual and bidirectional rules

- Every player-facing string lives in the bilingual table. The `t()` helper or the equivalent must be used; do not hardcode.
- Numbers, dates, and units use locale-aware formatters (`Intl.NumberFormat`, `Intl.DateTimeFormat`).
- Arabic strings must read naturally in RTL. Avoid left/right directional language.
- The HTML `dir` attribute follows the active locale. CSS uses logical properties (`margin-inline-start`, `padding-block-end`) over physical properties.
- Icons with directional meaning (chevrons, arrows) mirror in RTL. Use `transform: scaleX(-1)` in RTL or a dedicated mirrored icon.

## Reduced motion rules

- `prefers-reduced-motion: reduce` is honored. Decorative animation stops or skips to its end state.
- Functional motion (loading spinners, transition state) keeps a low-motion equivalent.
- The 3D camera and entrance choreography collapse to a static rest pose.
- Parallax, scroll-linked animation, and large fades are off by default and skipped entirely under reduced motion.

## Screen reader rules

- Landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` are used appropriately.
- Headings: a single `<h1>` per screen; heading levels do not skip.
- Live regions: `aria-live="polite"` for non-critical updates, `aria-live="assertive"` only for urgent errors.
- Form fields: every input has a programmatic label; errors are announced via `aria-describedby`.
- Modal dialogs: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title.
- Chess and puzzle state: announce turn changes, captures, check, and game-end states via `aria-live`.

## Automated audit setup

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SURFACES = ['/', '/puzzles', '/chess', '/echo-mind'];

for (const path of SURFACES) {
  test(`axe audit: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
```

## Manual checks (cannot be automated)

- Screen reader pass with VoiceOver (macOS/iOS) and NVDA (Windows). Verify the spoken order matches the visual order.
- 200% zoom on desktop: layout reflows without horizontal scrolling or clipped controls.
- High-contrast mode (Windows): focus and state remain visible.
- Switch control / voice control reach every primary action.

## Color-independent cue patterns

- Side markers in chess: piece color (light/dark) plus a non-color shape (round/square) or a textual label.
- Puzzle correctness: color plus an icon (check for success, X for failure) plus an aria-live announcement.
- Mute/volume: icon plus a label plus the value; never a color-only slider.
- Timer: remaining time as text plus a non-color bar pattern (e.g., diagonal stripes) when in warning.

## Reduced-motion cue patterns

- Puzzle completion: motion-free version uses a static highlight + a textual "Completed" label + an aria-live announcement.
- Reward reveal: motion-free version fades in a static card with the same content.
- Chess check: motion-free version overlays a static border plus an aria-live "Check" announcement.

## Bilingual fixture pattern

```ts
// e2e/fixtures/bilingual.ts
export const SURFACE_LABELS = {
  en: { start: 'Start', continue: 'Continue', settings: 'Settings' },
  ar: { start: 'ابدأ', continue: 'متابعة', settings: 'الإعدادات' },
} as const;
```

## Anti-patterns to refuse

- `outline: none` without a replacement focus ring.
- Directional language in Arabic strings (`left` / `right`).
- Hardcoded player-facing strings in either language.
- Color-only state indicators.
- Click-only interactions without a keyboard equivalent.
- Touch targets below 44px.
- Perpetual decorative motion without a reduced-motion alternative.
- ARIA roles that contradict the underlying element semantics.
- A single `<h1>` replaced by a styled `<div>`.
- Audio cues without a visual equivalent.
- Reward authority granted from the presentation layer.

## What is frozen and must not change

- The frozen-source list at `artifacts/eleven-eleven/AGENT_RULES.md` section 6.
- The 11.11 visual contract.
- Reward authority and receipt replay rules.
