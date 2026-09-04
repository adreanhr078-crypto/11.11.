import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(...segments: string[]): string {
  return readFileSync(resolve(process.cwd(), 'src', ...segments), 'utf8');
}

describe('Stage 3 progressive disclosure UI', () => {
  it('derives and enforces route access in the application shell without an intrusion overlay', () => {
    const shell = source('app', 'shell', 'ApplicationShell.tsx');
    const shellStore = source('app', 'shell', 'shellStore.ts');

    assert.match(shell, /deriveExperienceEntitlements/);
    assert.match(shell, /visiblePrimaryNavigation/);
    assert.match(shell, /routeAccessNotice/);
    assert.match(shell, /snapshot\.firstRewardReceived/);
    assert.doesNotMatch(shell, /EchoIntrusionOverlay/);
    assert.match(shellStore, /resolveExperienceRoute/);
    assert.match(shellStore, /setExperienceEntitlements/);
    assert.match(shellStore, /writeScreenLocation\(resolution\.screen, 'replace'\)/);
  });

  it('keeps the Home surface focused on one objective and one continuation action', () => {
    const home = source('features', 'screens', 'PsychologicalStateScreen.tsx');
    const mainMenu = source('features', 'screens', 'MainMenuScreen.tsx');
    const styles = source('features', 'screens', 'psychological-state-screen.css');
    const asset = resolve(
      process.cwd(),
      'public',
      'assets',
      'ui',
      'mission-control',
      'mission-control-chamber-v1.jpg',
    );

    assert.match(home, /MISSION_CONTROL_CHAMBER_ASSET/);
    assert.match(home, /deriveCorePlayerObjective/);
    assert.match(home, /continueMission/);
    assert.match(home, /requestManhwaReader\(\)/);
    assert.match(home, /dir=\{locale === 'ar' \? 'rtl' : 'ltr'\}/);
    assert.doesNotMatch(home, /psychological-state__quick-links/);
    assert.match(home, /objective\.actionLabel/);
    assert.match(mainMenu, /continueJourney/);
    assert.doesNotMatch(mainMenu, /navigate\('echo-network'\)/);
    assert.doesNotMatch(mainMenu, /navigate\('echo-mind'\)/);
    assert.doesNotMatch(mainMenu, /confirmNewGame/);
    assert.match(styles, /psychological-state__channels-disclosure/);
    assert.match(styles, /min-block-size: 2\.75rem/);
    assert.equal(existsSync(asset), true);
    assert.ok(statSync(asset).size <= 160 * 1024);
  });

  it('renders only server-entitled puzzle channels instead of decorative locked tabs', () => {
    const hub = source('features', 'puzzle-hub', 'PuzzleHubScreen.tsx');

    assert.match(hub, /experienceEntitlements\.puzzleModes/);
    assert.match(hub, /const visibleModes/);
    assert.match(hub, /visibleModes\.map/);
    assert.match(hub, /const activeMode/);
    assert.match(hub, /activeMode !== mode/);
  });
});
