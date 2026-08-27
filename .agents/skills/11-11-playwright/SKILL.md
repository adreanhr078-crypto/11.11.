---
name: 11-11-playwright
description: Author, run, and debug end-to-end browser tests for the 11.11 web build using Playwright. Use for smoke tests, white-screen detection, console-error capture, screenshot validation, Arabic/English coverage, reduced-motion verification, and viewport matrix (mobile portrait, mobile landscape, tablet, desktop). The project depends on `playwright@^1.62.1` and the `playwright-mcp` local server is available in `.kilo/kilo.json` for interactive agent use. Do not modify frozen game logic, puzzles, lore, or other locked systems unless the task explicitly scopes to test-only changes.
---

# 11.11 Playwright E2E

Playwright is the project's primary browser-automation tool. Use it for end-to-end smoke tests, regression detection, accessibility verification, and screenshot-based visual diffs. The 11.11 web build is the source of truth; the Capacitor, Tauri, and Cloudflare Worker surfaces are tested through their own harnesses.

## Active implementation facts

- **Playwright:** `playwright@^1.62.1` is installed in the workspace `devDependencies`. Browser binaries are not pre-downloaded; run `npx playwright install` once per machine.
- **Test runner:** `playwright test` (the official runner) for new specs. Use the in-tree `tsx --test` for unit tests; reserve Playwright for browser-level flows.
- **Test config:** Store Playwright config in `artifacts/eleven-eleven/playwright.config.ts`. The config must:
  - Set `baseURL` to the running dev server.
  - Set `webServer` to spin up `npm run dev` (or `vite preview` against a prior `npm run build`).
  - Use `trace: 'on-first-retry'` and `screenshot: 'only-on-failure'` to keep CI lean.
  - Run Chromium, Firefox, and WebKit in CI; locally default to Chromium only.
- **MCP server:** The `playwright-mcp` local MCP server is enabled in `.kilo/kilo.json`. It exposes `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill`, `browser_evaluate`, `browser_console_messages`, and `browser_take_screenshot` to the agent. Use it for interactive debugging; use the test runner for committed specs.
- **Selectors:** Prefer `getByRole`, `getByLabel`, `getByText`, and `getByTestId`. Reserve CSS selectors for cases where the above are insufficient.
- **Data attributes:** Test-only hooks use `data-testid`. The component owns the attribute; the test only reads it.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the surface, screen, and existing test (if any) before writing a new spec.
3. Identify the smallest set of flows that prove the surface works:
   - Initial load (no white screen, no console errors).
   - First happy-path interaction.
   - One failure-path interaction (network error, auth error, missing data).
4. Author the spec inside `artifacts/eleven-eleven/e2e/<surface>.spec.ts`.
5. Run `npx playwright test --project=chromium e2e/<surface>.spec.ts` locally.
6. Run `npx playwright test` for the full matrix before declaring done.
7. Run `npm run agent:postflight`. If it fails, do not declare success.

## Spec authoring rules

- One spec per surface or user journey. Name files after the surface: `puzzle-hub.spec.ts`, `chess-board.spec.ts`, `echo-mind.spec.ts`.
- Group related assertions with `test.describe(...)`. Use `test.beforeEach` to land on the start URL.
- Avoid `test.skip` and `test.fixme` in committed code; remove or implement.
- Each test asserts: route reaches the expected screen, no console errors, primary action reachable, success state observed.
- For visual diffs, use `toHaveScreenshot()` with a stable viewport and `maxDiffPixelRatio` calibrated to the surface.
- Never use `page.waitForTimeout(ms)`. Use `expect(locator).toBeVisible()`, `toHaveText()`, or `toHaveURL()` instead.

## Initial-load smoke test (the white-screen guard)

This is the single most important Playwright suite in 11.11. It must run on every change and on every CI pipeline. The pattern:

```ts
import { test, expect } from '@playwright/test';

const SURFACES = [
  { path: '/', name: 'home' },
  { path: '/puzzles', name: 'puzzle-hub' },
  { path: '/chess', name: 'chess-board' },
  { path: '/echo-mind', name: 'echo-mind' },
  { path: '/profile', name: 'profile' },
];

for (const { path, name } of SURFACES) {
  test(`white-screen guard: ${name}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(path, { waitUntil: 'networkidle' });

    // No white screen: the body has a non-white background or visible content.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');

    // A primary heading or known landmark is visible.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // No console errors.
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });
}
```

## Console-error capture

Always attach a console listener early in the test. Treat uncaught exceptions and `console.error` calls as test failures unless the test explicitly expects them.

## Screenshot validation

- For full-page visual diffs, set a fixed viewport (`1280×800` desktop, `390×844` mobile) and disable animations via `prefers-reduced-motion: reduce`.
- For component-level diffs, isolate the component under test with `locator.screenshot()`.
- For RTL/LTR pairs, take a screenshot in each direction and diff both.
- Store committed baseline screenshots under `e2e/__screenshots__/`. Update baselines with `--update-snapshots` after intentional UI changes.

## Viewport matrix

Run the full smoke matrix in CI. The minimum matrix:

| Viewport | Width × Height | DPR | Direction |
|---|---|---|---|
| Mobile portrait | 390 × 844 | 2 | LTR + RTL |
| Mobile landscape | 844 × 390 | 2 | LTR + RTL |
| Tablet portrait | 768 × 1024 | 2 | LTR + RTL |
| Desktop | 1280 × 800 | 1 | LTR + RTL |

## Bilingual verification

For any surface that is localized:

```ts
test('arabic copy renders', async ({ page }) => {
  await page.goto('/puzzles');
  await expect(page.getByText('ابدأ')).toBeVisible(); // or surface-specific Arabic label
});

test('english copy renders', async ({ page }) => {
  await page.goto('/puzzles?locale=en');
  await expect(page.getByText('Start')).toBeVisible();
});
```

## Reduced-motion verification

Run the smoke matrix with `prefers-reduced-motion: reduce` and assert that:
- No `useFrame` work is observable.
- No perpetual decorative animation is running.
- Camera and entrance transitions resolve to a static resting state.

```ts
test.use({ reducedMotion: 'reduce' });
```

## Auth and data setup

- Use `page.context().addCookies(...)` or `page.evaluate(() => localStorage.setItem(...))` to seed auth state.
- Never commit real credentials. Use `playwright/.auth/` gitignored.
- For Firebase auth in tests, mock the auth surface via `page.route('**/identitytoolkit/**', ...)`.

## Debugging

- `npx playwright test --ui` for the local UI runner.
- `npx playwright test --debug e2e/foo.spec.ts` to step through.
- `npx playwright show-report` to inspect the last HTML report.
- The `playwright-mcp` server can navigate, snapshot, and click interactively from the agent.

## Anti-patterns to refuse

- `page.waitForTimeout(2000)` or any fixed sleep.
- `page.locator('.css-only-class')` for surfaces that already have semantic roles.
- `test.skip` without a linked issue.
- Hardcoded English/Arabic strings in tests (use bilingual fixtures).
- Real credentials or production tokens committed to the test tree.
- `page.screenshot()` without a viewport and `fullPage: false` (avoid huge diffs).
- Running headed Chromium against a production URL.

## What is frozen and must not change

- The frozen-source list at `artifacts/eleven-eleven/AGENT_RULES.md` section 6.
- The 11.11 visual contract (obsidian, signal crimson, pale ivory, no readable text in generated assets).
- Reward authority and receipt replay rules.
