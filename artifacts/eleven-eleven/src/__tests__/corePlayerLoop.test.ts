import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveCorePlayerObjective } from '../application/player-journey/corePlayerLoop';
import { STORY_PUZZLES } from '../content/puzzles/storyPuzzleCatalog';
import type { StoryPuzzleSnapshot } from '../domain/story-puzzles/storyPuzzleContracts';

function snapshot(statuses: Record<string, 'locked' | 'available' | 'in_progress' | 'completed'>): StoryPuzzleSnapshot {
  return {
    coinBalance: 0,
    shardCount: 0,
    mainCompletedCount: 0,
    totalCompletedCount: 0,
    discoverableSecretPuzzleIds: [],
    echoResonance: { total: 0, byAxis: { clarity: 0, memory: 0, trust: 0, resolve: 0, stability: 0, anomaly: 0 }, lastPuzzleId: null },
    syncedAt: new Date(0).toISOString(),
    entries: STORY_PUZZLES.map((puzzle) => ({
      puzzleId: puzzle.id,
      status: statuses[puzzle.id] ?? 'locked',
      discovered: puzzle.classification === 'main',
      completedAt: null,
      perfectSolve: false,
      unlockedHintIndexes: [],
      hintCosts: [4, 8, 14],
      draft: null,
    })),
  };
}

describe('Core Player Loop', () => {
  it('gives a first-time player one readable objective instead of a menu choice', () => {
    const objective = deriveCorePlayerObjective(null);
    assert.equal(objective.kind, 'read');
    assert.equal(objective.screen, 'memories');
    assert.match(objective.title, /4/);
  });

  it('moves from Manhwa evidence to the current puzzle and then to the next evidence page', () => {
    const available = deriveCorePlayerObjective(snapshot({
      story_puzzle_01_signal_calibration: 'available',
    }));
    assert.deepEqual([available.kind, available.screen], ['solve', 'puzzles']);

    const afterFirst = deriveCorePlayerObjective(snapshot({
      story_puzzle_01_signal_calibration: 'completed',
    }));
    assert.deepEqual([afterFirst.kind, afterFirst.screen], ['read', 'memories']);
    assert.match(afterFirst.title, /5/);
  });

  it('keeps first-three puzzle answers out of the public catalog and client readiness path', async () => {
    const { readFile } = await import('node:fs/promises');
    const catalog = await readFile(new URL('../content/puzzles/storyPuzzleCatalog.ts', import.meta.url), 'utf8');
    const screen = await readFile(new URL('../features/screens/PuzzleScreen.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(catalog.slice(0, catalog.indexOf("id: 'story_puzzle_04_circuit_restore'")), /targetFrequency|targetChannel|رتّب: إشارة، وصول، ذاكرة، Echo|أعلى اليمين/);
    assert.doesNotMatch(screen, /TARGET WINDOW|data-target|pieceId === `piece-\$\{index\}`/);
    assert.match(screen, /readSignalSelection/);
  });

  it('keeps mandatory first-time identity setup inside an accessible modal focus boundary', async () => {
    const { readFile } = await import('node:fs/promises');
    const onboarding = await readFile(
      new URL('../features/onboarding/FirstTimeOnboarding.tsx', import.meta.url),
      'utf8',
    );

    assert.match(onboarding, /role="dialog"/);
    assert.match(onboarding, /aria-modal="true"/);
    assert.match(onboarding, /ONBOARDING_FOCUSABLE_SELECTOR/);
    assert.match(onboarding, /document\.getElementById\('app'\)/);
    assert.match(onboarding, /application\.inert = true/);
    assert.match(onboarding, /event\.key !== 'Tab'/);
    assert.match(onboarding, /event\.preventDefault\(\);\s*dialog\.focus\(\);/);
    assert.match(onboarding, /previousFocus\?\.isConnected/);
  });

  it('keeps the first-session path connected from account to Echo, objective, reward, and next evidence', async () => {
    const { readFile } = await import('node:fs/promises');
    const [menu, onboarding, shell, objectiveCard, puzzle] = await Promise.all([
      readFile(new URL('../features/screens/MainMenuScreen.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/onboarding/FirstTimeOnboarding.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/shell/ApplicationShell.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/player-journey/CoreObjectiveCard.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../features/screens/PuzzleScreen.tsx', import.meta.url), 'utf8'),
    ]);
    assert.match(menu, /سجّل الدخول وابدأ/);
    assert.match(menu, /<AuthPanel open=\{authOpen\}/);
    assert.match(onboarding, /navigate\('main-menu'\)/);
    assert.doesNotMatch(onboarding, /navigate\('echo-mind'\)/);
    assert.match(shell, /<CoreObjectiveCard/);
    assert.match(objectiveCard, /main-puzzle-solved/);
    assert.match(objectiveCard, /requestManhwaReader/);
    assert.match(puzzle, /playPuzzleCompletionSound/);
    assert.match(puzzle, /void loadProfile\(\)/);
    assert.match(puzzle, /void loadLeaderboard\(true\)/);
  });

  it('does not expose developer configuration keys to a player when sign-in is unavailable', async () => {
    const { readFile } = await import('node:fs/promises');
    const authPanel = await readFile(new URL('../features/auth/AuthPanel.tsx', import.meta.url), 'utf8');
    assert.match(authPanel, /تسجيل الدخول غير جاهز في هذه النسخة بعد/);
    assert.doesNotMatch(authPanel, /missingConfigKeys\.join/);
  });
});
