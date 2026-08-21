import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('responsive player journey contract', () => {
  it('makes portrait the default viewport policy and keeps the shell explicit', async () => {
    const { readFile } = await import('node:fs/promises');
    const [viewport, shell] = await Promise.all([
      readFile(new URL('../ui/design-system/GameViewport.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/shell/ApplicationShell.tsx', import.meta.url), 'utf8'),
    ]);

    assert.match(viewport, /landscapeRequired = false/);
    assert.match(viewport, /\{landscapeRequired && \(/);
    assert.match(shell, /landscapeRequired=\{false\}/);
  });

  it('gives phone portrait a reachable shell, objective, onboarding, and opening route', async () => {
    const { readFile } = await import('node:fs/promises');
    const [shellCss, objectiveCss, onboardingCss, menuCss] = await Promise.all([
      readFile(new URL('../app/shell/application-shell.css', import.meta.url), 'utf8'),
      readFile(new URL('../features/player-journey/core-objective-card.css', import.meta.url), 'utf8'),
      readFile(new URL('../features/onboarding/first-time-onboarding.css', import.meta.url), 'utf8'),
      readFile(new URL('../features/screens/core-five-screens.css', import.meta.url), 'utf8'),
    ]);

    for (const source of [shellCss, objectiveCss, onboardingCss, menuCss]) {
      assert.match(source, /@media \(max-width: (?:48|46)rem\) and \(orientation: portrait\)/);
    }
    assert.match(shellCss, /data-has-objective/);
    assert.match(shellCss, /flex-direction: column/);
    assert.match(onboardingCss, /overflow-y: auto/);
    assert.match(onboardingCss, /main-menu-world-v1\.webp/);
    assert.match(onboardingCss, /main-menu-world-v1\.png/);
    assert.match(menuCss, /thumb-reachable layer/);
    assert.match(menuCss, /portrait-signal-void-v1\.webp/);
    assert.match(menuCss, /portrait-signal-void-v1\.png/);
    const visualAssets = await readFile(new URL('../ui/presentation/visualAssets.ts', import.meta.url), 'utf8');
    assert.match(visualAssets, /echo-portrait-v1\.webp/);
    assert.match(visualAssets, /echo-fullbody-normal-v2\.webp/);
    assert.match(visualAssets, /echo-fullbody-corrupted-v1\.webp/);
  });

  it('does not continue to advertise a landscape-only mobile journey', async () => {
    const { readFile } = await import('node:fs/promises');
    const [onboarding, menu] = await Promise.all([
      readFile(new URL('../features/onboarding/FirstTimeOnboarding.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/screens/MainMenuScreen.tsx', import.meta.url), 'utf8'),
    ]);

    assert.doesNotMatch(onboarding, /LANDSCAPE MOBILE EXPERIENCE/);
    assert.doesNotMatch(menu, /Android Landscape Cinematic Interface/);
    assert.match(onboarding, /MOBILE BROWSER READY/);
  });
});
